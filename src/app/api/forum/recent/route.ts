import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const threads = await prisma.forumThread.findMany({
      orderBy: [
        { lastReplyAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: 10,
      select: {
        id: true,
        title: true,
        repliesCount: true,
        createdAt: true,
        lastReplyAt: true,
        user: { select: { username: true, displayName: true } },
      },
    });

    return NextResponse.json(threads, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Forum recent error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
