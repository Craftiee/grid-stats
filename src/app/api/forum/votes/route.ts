import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Rate limit: 60 votes per user per hour
    if (!(await rateLimit(`forum-vote:${session.user.username}`, 60, 60 * 60 * 1000))) {
      return NextResponse.json({ error: 'Too many votes. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const threadId = body.threadId ? parseInt(body.threadId, 10) : null;
    const replyId = body.replyId ? parseInt(body.replyId, 10) : null;
    const value = parseInt(body.value, 10);

    // Must vote on exactly one target
    if ((!threadId && !replyId) || (threadId && replyId)) {
      return NextResponse.json({ error: 'Specify either threadId or replyId.' }, { status: 400 });
    }
    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: 'Value must be 1 or -1.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: { id: true, active: true },
    });
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Account is inactive.' }, { status: 403 });
    }

    if (threadId) {
      // Find existing vote
      const existing = await prisma.forumVote.findUnique({
        where: { userId_threadId: { userId: user.id, threadId } },
      });

      if (existing) {
        if (existing.value === value) {
          // Same vote = toggle off (delete)
          await prisma.forumVote.delete({ where: { id: existing.id } });
        } else {
          // Different vote = switch
          await prisma.forumVote.update({ where: { id: existing.id }, data: { value } });
        }
      } else {
        await prisma.forumVote.create({
          data: { userId: user.id, threadId, value },
        });
      }

      // Return current score
      const agg = await prisma.forumVote.aggregate({
        where: { threadId },
        _sum: { value: true },
      });
      const userVote = await prisma.forumVote.findUnique({
        where: { userId_threadId: { userId: user.id, threadId } },
        select: { value: true },
      });

      return NextResponse.json({ score: agg._sum.value ?? 0, userVote: userVote?.value ?? 0 });
    } else if (replyId) {
      const existing = await prisma.forumVote.findUnique({
        where: { userId_replyId: { userId: user.id, replyId } },
      });

      if (existing) {
        if (existing.value === value) {
          await prisma.forumVote.delete({ where: { id: existing.id } });
        } else {
          await prisma.forumVote.update({ where: { id: existing.id }, data: { value } });
        }
      } else {
        await prisma.forumVote.create({
          data: { userId: user.id, replyId, value },
        });
      }

      const agg = await prisma.forumVote.aggregate({
        where: { replyId },
        _sum: { value: true },
      });
      const userVote = await prisma.forumVote.findUnique({
        where: { userId_replyId: { userId: user.id, replyId } },
        select: { value: true },
      });

      return NextResponse.json({ score: agg._sum.value ?? 0, userVote: userVote?.value ?? 0 });
    }

    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  } catch (error) {
    console.error('Forum vote error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
