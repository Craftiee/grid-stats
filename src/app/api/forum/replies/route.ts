import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { containsOffensiveLanguage } from '@/lib/content-filter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Rate limit: 20 replies per user per hour
    if (!(await rateLimit(`forum-reply:${session.user.username}`, 20, 60 * 60 * 1000))) {
      return NextResponse.json({ error: 'Too many replies. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const threadId = parseInt(body.threadId, 10);
    const parentReplyId = body.parentReplyId ? parseInt(body.parentReplyId, 10) : null;
    const content = (body.content ?? '').trim();

    if (isNaN(threadId)) {
      return NextResponse.json({ error: 'Invalid thread.' }, { status: 400 });
    }
    if (!content || content.length > 5000) {
      return NextResponse.json({ error: 'Reply is required (max 5,000 characters).' }, { status: 400 });
    }

    if (containsOffensiveLanguage(content)) {
      return NextResponse.json({ error: 'Your post contains language that is not allowed.' }, { status: 400 });
    }

    // Verify thread exists and not locked
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { id: true, locked: true },
    });
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
    }
    if (thread.locked) {
      return NextResponse.json({ error: 'This thread is locked.' }, { status: 403 });
    }

    // If replying to a reply, verify parent exists and belongs to same thread
    if (parentReplyId !== null) {
      if (isNaN(parentReplyId)) {
        return NextResponse.json({ error: 'Invalid parent reply.' }, { status: 400 });
      }
      const parent = await prisma.forumReply.findUnique({
        where: { id: parentReplyId },
        select: { threadId: true },
      });
      if (!parent || parent.threadId !== threadId) {
        return NextResponse.json({ error: 'Parent reply not found.' }, { status: 404 });
      }
    }

    // Verify user is active
    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: { id: true, active: true },
    });
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Account is inactive.' }, { status: 403 });
    }

    // Create reply and update thread counters
    const [reply] = await prisma.$transaction([
      prisma.forumReply.create({
        data: {
          threadId,
          userId: user.id,
          parentReplyId,
          content,
        },
      }),
      prisma.forumThread.update({
        where: { id: threadId },
        data: {
          repliesCount: { increment: 1 },
          lastReplyAt: new Date(),
          lastReplyUserId: user.id,
        },
      }),
    ]);

    return NextResponse.json({ success: true, replyId: reply.id }, { status: 201 });
  } catch (error) {
    console.error('Forum reply creation error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
