import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { containsOffensiveLanguage } from '@/lib/content-filter';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const replyId = parseInt(params.id, 10);
    if (isNaN(replyId)) {
      return NextResponse.json({ error: 'Invalid reply.' }, { status: 400 });
    }

    const body = await request.json();
    const content = (body.content ?? '').trim();

    if (!content || content.length > 5000) {
      return NextResponse.json({ error: 'Content is required (max 5,000 characters).' }, { status: 400 });
    }

    if (containsOffensiveLanguage(content)) {
      return NextResponse.json({ error: 'Your post contains language that is not allowed.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: { id: true, active: true },
    });
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Account is inactive.' }, { status: 403 });
    }

    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
      select: { userId: true, thread: { select: { locked: true } } },
    });
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found.' }, { status: 404 });
    }
    if (reply.thread.locked) {
      return NextResponse.json({ error: 'This thread is locked.' }, { status: 403 });
    }
    if (reply.userId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own replies.' }, { status: 403 });
    }

    const updated = await prisma.forumReply.update({
      where: { id: replyId },
      data: { content, edited: true },
      select: { id: true, content: true, edited: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Forum reply edit error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const replyId = parseInt(params.id, 10);
    if (isNaN(replyId)) {
      return NextResponse.json({ error: 'Invalid reply.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: { id: true, active: true },
    });
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Account is inactive.' }, { status: 403 });
    }

    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
      select: { userId: true, threadId: true },
    });
    if (!reply) {
      return NextResponse.json({ error: 'Reply not found.' }, { status: 404 });
    }
    if (reply.userId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own replies.' }, { status: 403 });
    }

    // Count this reply + its descendants to decrement thread counter accurately
    const descendantCount = await prisma.forumReply.count({
      where: {
        OR: [
          { id: replyId },
          { parentReplyId: replyId },
        ],
      },
    });

    await prisma.$transaction([
      prisma.forumReply.delete({ where: { id: replyId } }),
      prisma.forumThread.update({
        where: { id: reply.threadId },
        data: { repliesCount: { decrement: descendantCount } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forum reply delete error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
