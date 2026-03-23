import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ThreadView from '@/components/ThreadView';

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const threadId = parseInt(params.id, 10);
  if (isNaN(threadId)) notFound();

  const session = await getServerSession(authOptions);
  const currentUsername = session?.user?.username;

  // Get current user ID for vote lookups
  let currentUserId: number | null = null;
  if (currentUsername) {
    const u = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: { id: true },
    });
    currentUserId = u?.id ?? null;
  }

  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    include: {
      user: { select: { username: true, displayName: true } },
      replies: {
        include: {
          user: { select: { username: true, displayName: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      },
    },
  });

  if (!thread) notFound();

  // Compute thread vote score + user's vote
  const threadVotes = await prisma.forumVote.aggregate({
    where: { threadId },
    _sum: { value: true },
  });
  let threadUserVote = 0;
  if (currentUserId) {
    const v = await prisma.forumVote.findUnique({
      where: { userId_threadId: { userId: currentUserId, threadId } },
      select: { value: true },
    });
    threadUserVote = v?.value ?? 0;
  }

  // Compute reply vote scores + user's votes in bulk
  const replyIds = thread.replies.map((r) => r.id);
  const replyVotes = replyIds.length > 0
    ? await prisma.forumVote.groupBy({
        by: ['replyId'],
        where: { replyId: { in: replyIds } },
        _sum: { value: true },
      })
    : [];
  const replyScoreMap = new Map<number, number>();
  for (const rv of replyVotes) {
    if (rv.replyId) replyScoreMap.set(rv.replyId, rv._sum.value ?? 0);
  }

  const userReplyVoteMap = new Map<number, number>();
  if (currentUserId && replyIds.length > 0) {
    const userVotes = await prisma.forumVote.findMany({
      where: { userId: currentUserId, replyId: { in: replyIds } },
      select: { replyId: true, value: true },
    });
    for (const uv of userVotes) {
      if (uv.replyId) userReplyVoteMap.set(uv.replyId, uv.value);
    }
  }

  // Count children per reply
  const childCountMap = new Map<number, number>();
  for (const r of thread.replies) {
    if (r.parentReplyId) {
      childCountMap.set(r.parentReplyId, (childCountMap.get(r.parentReplyId) || 0) + 1);
    }
  }

  // Serialize for client
  const threadData = {
    id: thread.id,
    title: thread.title,
    content: thread.content,
    createdAt: thread.createdAt.toISOString(),
    repliesCount: thread.repliesCount,
    user: thread.user,
    score: threadVotes._sum.value ?? 0,
    userVote: threadUserVote,
    edited: thread.edited,
  };

  const repliesData = thread.replies.map((r) => ({
    id: r.id,
    parentReplyId: r.parentReplyId,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
    score: replyScoreMap.get(r.id) ?? 0,
    userVote: userReplyVoteMap.get(r.id) ?? 0,
    childCount: childCountMap.get(r.id) ?? 0,
    edited: r.edited,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <div className="container mx-auto px-4 py-6 max-w-3xl">

        {/* Back link */}
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest no-underline transition-colors hover:underline mb-5"
          style={{ color: '#52525b' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Forum
        </Link>

        <ThreadView thread={threadData} replies={repliesData} currentUsername={currentUsername ?? null} />

      </div>
    </div>
  );
}
