import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function ForumPage() {
  const session = await getServerSession(authOptions);

  const threads = await prisma.forumThread.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      pinned: true,
      repliesCount: true,
      createdAt: true,
      user: { select: { username: true, displayName: true } },
    },
    orderBy: [
      { pinned: 'desc' },
      { lastReplyAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  });

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <div className="container mx-auto px-4 py-6 max-w-5xl">

        {/* Create Post Button */}
        <Link href={session ? '/forum/new' : '/login'} className="block no-underline mb-5">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
          >
            <svg className="w-4 h-4" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#dc2626' }}>
              {session ? 'Create New Post' : 'Log in to create a post'}
            </span>
          </div>
        </Link>

        {/* Thread List */}
        {threads.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
          >
            <svg className="w-10 h-10 mx-auto mb-3" style={{ color: '#3f3f46' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: '#71717a' }}>
              No posts yet — be the first!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {threads.map((thread) => {
              const authorName = thread.user?.displayName || thread.user?.username || 'Unknown';
              const username = thread.user?.username;
              const preview = thread.content.length > 100
                ? thread.content.slice(0, 100) + '...'
                : thread.content;
              return (
                <div
                  key={thread.id}
                  className="flex flex-col justify-between rounded-lg p-4 transition-colors hover:bg-white/5"
                  style={{
                    backgroundColor: '#1a1a1f',
                    border: `1px solid ${thread.pinned ? '#dc262640' : '#27272a'}`,
                    minHeight: '100px',
                  }}
                >
                  {/* Title — top left */}
                  <div>
                    <div className="flex items-start gap-2">
                      {thread.pinned && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.828 3.414a2 2 0 012.344 0l.354.248a1 1 0 00.698.158l.43-.043a2 2 0 012.122 1.53l.1.424a1 1 0 00.399.587l.35.252a2 2 0 01.564 2.414l-.186.398a1 1 0 00-.032.735l.143.413a2 2 0 01-.92 2.298l-.38.222a1 1 0 00-.466.554l-.13.424a2 2 0 01-2.052 1.39l-.432-.05a1 1 0 00-.716.19l-.346.262a2 2 0 01-2.416-.036l-.337-.27a1 1 0 00-.704-.175l-.432.058a2 2 0 01-2.024-1.43l-.12-.427a1 1 0 00-.475-.546l-.373-.217a2 2 0 01-.88-2.316l.154-.41a1 1 0 00-.022-.737l-.194-.394a2 2 0 01.6-2.4l.358-.244a1 1 0 00.408-.58l.108-.427a2 2 0 012.149-1.49l.431.05a1 1 0 00.707-.168l.355-.257z" />
                        </svg>
                      )}
                      <Link href={`/forum/${thread.id}`} className="no-underline">
                        <h3 className="text-lg font-bold hover:underline" style={{ color: '#e2e8f0' }}>
                          {thread.title}
                        </h3>
                      </Link>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: '#71717a' }}>
                      {preview}
                    </p>
                  </div>

                  {/* Meta block — bottom right, text left-aligned within block */}
                  <div className="self-end text-left mt-3">
                    {username ? (
                      <Link
                        href={`/profile/${username}`}
                        className="text-xs font-bold no-underline hover:underline"
                        style={{ color: '#e2e8f0' }}
                      >
                        {authorName}
                      </Link>
                    ) : (
                      <div className="text-xs font-bold" style={{ color: '#e2e8f0' }}>
                        {authorName}
                      </div>
                    )}
                    <div className="text-xs" style={{ color: '#71717a' }}>
                      {thread.repliesCount} {thread.repliesCount === 1 ? 'reply' : 'replies'} | {formatDate(thread.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
