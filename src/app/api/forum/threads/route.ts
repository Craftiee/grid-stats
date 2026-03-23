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

    // Rate limit: 5 threads per user per hour
    if (!(await rateLimit(`forum-thread:${session.user.username}`, 5, 60 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Too many posts. Please try again later.' },
        { status: 429 }
      );
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

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 200);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Find the user and verify active status
    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: { id: true, active: true },
    });
    if (!user || !user.active) {
      return NextResponse.json({ error: 'User not found or account is inactive.' }, { status: 403 });
    }

    // Get or create default category (upsert to avoid race condition)
    let category;
    try {
      category = await prisma.forumCategory.upsert({
        where: { slug: 'general' },
        update: {},
        create: { name: 'General', slug: 'general', description: 'General discussion', displayOrder: 0 },
      });
    } catch {
      // Fallback: if upsert races, the row exists — just fetch it
      category = await prisma.forumCategory.findFirst({ where: { slug: 'general' } });
      if (!category) throw new Error('Failed to resolve forum category');
    }

    const thread = await prisma.forumThread.create({
      data: {
        categoryId: category.id,
        userId: user.id,
        title,
        slug,
        content,
      },
    });

    return NextResponse.json({ success: true, threadId: thread.id }, { status: 201 });
  } catch (error) {
    console.error('Forum thread creation error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
