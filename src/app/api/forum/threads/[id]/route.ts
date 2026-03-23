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

    const threadId = parseInt(params.id, 10);
    if (isNaN(threadId)) {
      return NextResponse.json({ error: 'Invalid thread.' }, { status: 400 });
    }

    const body = await request.json();
    const title = (body.title ?? '').trim();
    const content = (body.content ?? '').trim();

    if (!title || title.length > 255) {
      return NextResponse.json({ error: 'Title is required (max 255 characters).' }, { status: 400 });
    }
    if (!content || content.length > 10000) {
      return NextResponse.json({ error: 'Content is required (max 10,000 characters).' }, { status: 400 });
    }

    if (containsOffensiveLanguage(title) || containsOffensiveLanguage(content)) {
      return NextResponse.json({ error: 'Your post contains language that is not allowed.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: { id: true, active: true },
    });
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Account is inactive.' }, { status: 403 });
    }

    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { userId: true, locked: true },
    });
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
    }
    if (thread.locked) {
      return NextResponse.json({ error: 'This thread is locked.' }, { status: 403 });
    }
    if (thread.userId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own posts.' }, { status: 403 });
    }

    const updated = await prisma.forumThread.update({
      where: { id: threadId },
      data: { title, content, edited: true },
      select: { id: true, title: true, content: true, edited: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Forum thread edit error:', error);
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

    const threadId = parseInt(params.id, 10);
    if (isNaN(threadId)) {
      return NextResponse.json({ error: 'Invalid thread.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: { id: true, active: true },
    });
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Account is inactive.' }, { status: 403 });
    }

    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { userId: true },
    });
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found.' }, { status: 404 });
    }
    if (thread.userId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own posts.' }, { status: 403 });
    }

    await prisma.forumThread.delete({ where: { id: threadId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forum thread delete error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
