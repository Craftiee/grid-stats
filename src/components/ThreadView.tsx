'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────

interface ReplyData {
  id: number;
  parentReplyId: number | null;
  content: string;
  createdAt: string;
  user: { username: string; displayName: string | null } | null;
  score: number;
  userVote: number;
  childCount: number;
  edited: boolean;
}

interface ThreadData {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  repliesCount: number;
  user: { username: string; displayName: string | null } | null;
  score: number;
  userVote: number;
  edited: boolean;
}

interface Props {
  thread: ThreadData;
  replies: ReplyData[];
  currentUsername: string | null;
}

// ── Helpers ────────────────────────────────────────────────────

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildTree(replies: ReplyData[]): Map<number | null, ReplyData[]> {
  const map = new Map<number | null, ReplyData[]>();
  for (const r of replies) {
    const key = r.parentReplyId;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}

// ── Vote Button ────────────────────────────────────────────────

function VoteControls({
  targetType,
  targetId,
  initialScore,
  initialUserVote,
}: {
  targetType: 'thread' | 'reply';
  targetId: number;
  initialScore: number;
  initialUserVote: number;
}) {
  const { data: session } = useSession();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  async function vote(value: 1 | -1) {
    if (!session) return;
    if (loading) return;
    setLoading(true);
    try {
      const body: Record<string, number> = { value };
      if (targetType === 'thread') body.threadId = targetId;
      else body.replyId = targetId;

      const res = await fetch('/api/forum/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setUserVote(data.userVote);
      }
    } finally {
      setLoading(false);
    }
  }

  const scoreStr = score > 0 ? `+${score}` : `${score}`;

  return (
    <div className="flex items-center gap-1.5 select-none">
      <button
        onClick={() => vote(1)}
        disabled={!session || loading}
        className="p-0.5 transition-colors disabled:opacity-30"
        style={{ color: userVote === 1 ? '#22c55e' : '#71717a', background: 'none', border: 'none', cursor: session ? 'pointer' : 'default' }}
        title="Upvote"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <span
        className="text-xs font-bold min-w-[20px] text-center"
        style={{ color: score > 0 ? '#22c55e' : score < 0 ? '#ef4444' : '#71717a' }}
      >
        {scoreStr}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={!session || loading}
        className="p-0.5 transition-colors disabled:opacity-30"
        style={{ color: userVote === -1 ? '#ef4444' : '#71717a', background: 'none', border: 'none', cursor: session ? 'pointer' : 'default' }}
        title="Downvote"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

// ── Reply Form ─────────────────────────────────────────────────

function ReplyForm({
  threadId,
  parentReplyId,
  onCancel,
  onSuccess,
}: {
  threadId: number;
  parentReplyId: number | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/forum/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, parentReplyId, content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch {
      setError('Failed to post reply.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={5000}
        required
        rows={3}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
        style={{ backgroundColor: '#111113', border: '1px solid #27272a', color: '#e2e8f0', minHeight: '80px' }}
        placeholder="Write a reply..."
      />
      {error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
        >
          {submitting ? 'Posting...' : 'Post Reply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors hover:bg-white/5"
          style={{ color: '#71717a', background: 'none', border: 'none' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Edit Thread Form ──────────────────────────────────────────

function EditThreadForm({
  thread,
  onCancel,
  onSuccess,
}: {
  thread: ThreadData;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(thread.title);
  const [content, setContent] = useState(thread.content);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch {
      setError('Failed to save changes.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        required
        className="w-full rounded-lg px-3 py-2 text-sm font-bold outline-none mb-2"
        style={{ backgroundColor: '#111113', border: '1px solid #27272a', color: '#e2e8f0' }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={10000}
        required
        rows={5}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
        style={{ backgroundColor: '#111113', border: '1px solid #27272a', color: '#e2e8f0', minHeight: '100px' }}
      />
      {error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors hover:bg-white/5"
          style={{ color: '#71717a', background: 'none', border: 'none' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Edit Reply Form ───────────────────────────────────────────

function EditReplyForm({
  replyId,
  initialContent,
  onCancel,
  onSuccess,
}: {
  replyId: number;
  initialContent: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch {
      setError('Failed to save changes.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={5000}
        required
        rows={3}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
        style={{ backgroundColor: '#111113', border: '1px solid #27272a', color: '#e2e8f0', minHeight: '80px' }}
      />
      {error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-opacity disabled:opacity-40"
          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors hover:bg-white/5"
          style={{ color: '#71717a', background: 'none', border: 'none' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Reply Node (recursive) ─────────────────────────────────────

const MAX_DEPTH = 5;

function ReplyNode({
  reply,
  tree,
  threadId,
  depth,
  replyingTo,
  setReplyingTo,
  onReplySuccess,
  currentUsername,
  editingId,
  setEditingId,
}: {
  reply: ReplyData;
  tree: Map<number | null, ReplyData[]>;
  threadId: number;
  depth: number;
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
  onReplySuccess: () => void;
  currentUsername: string | null;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const authorName = reply.user?.displayName || reply.user?.username || 'Unknown';
  const username = reply.user?.username;
  const children = tree.get(reply.id) || [];
  const isOwner = currentUsername && username === currentUsername;

  async function handleDelete() {
    if (!confirm('Delete this reply? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/forum/replies/${reply.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete reply.');
      }
    } catch {
      alert('Failed to delete reply.');
    } finally {
      setDeleting(false);
    }
  }

  // If editing this reply, show the edit form instead of content
  if (editingId === reply.id) {
    return (
      <div style={{ marginLeft: depth > 0 ? '24px' : '0' }}>
        <div className="flex">
          <div className="flex-shrink-0 w-0.5 mr-3" style={{ backgroundColor: '#3f3f46' }} />
          <div className="flex-1 min-w-0 mt-2">
            <EditReplyForm
              replyId={reply.id}
              initialContent={reply.content}
              onCancel={() => setEditingId(null)}
              onSuccess={() => { setEditingId(null); router.refresh(); }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: depth > 0 ? '24px' : '0' }}>
      {/* Gray tracking line + card */}
      <div className="flex">
        <div className="flex-shrink-0 w-0.5 mr-3" style={{ backgroundColor: '#3f3f46' }} />
        <div className="flex-1 min-w-0">
          {/* Reply card */}
          <div
            className="rounded-lg p-4 mt-2"
            style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
          >
            {/* Top row: content left, votes right */}
            <div className="flex justify-between items-start gap-3">
              <div className="text-sm leading-relaxed whitespace-pre-wrap flex-1 min-w-0" style={{ color: '#d4d4d8' }}>
                {reply.content}
              </div>
              <VoteControls
                targetType="reply"
                targetId={reply.id}
                initialScore={reply.score}
                initialUserVote={reply.userVote}
              />
            </div>

            {/* Bottom-right meta */}
            <div className="flex justify-end mt-3">
              <div className="text-left">
                {username ? (
                  <Link
                    href={`/profile/${username}`}
                    className="text-xs font-bold no-underline hover:underline block"
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
                  {children.length} {children.length === 1 ? 'reply' : 'replies'} | {formatDate(reply.createdAt)}
                  {reply.edited && <span className="italic ml-1">(edited)</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end mt-1 gap-3">
            {isOwner && (
              <>
                <button
                  onClick={() => setEditingId(reply.id)}
                  className="text-xs font-bold uppercase tracking-wide transition-colors hover:opacity-70"
                  style={{ color: '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-bold uppercase tracking-wide transition-colors hover:opacity-70 disabled:opacity-40"
                  style={{ color: '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
            {session && depth < MAX_DEPTH && (
              <button
                onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-colors hover:opacity-70"
                style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Reply
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>

          {/* Inline reply form */}
          {replyingTo === reply.id && (
            <ReplyForm
              threadId={threadId}
              parentReplyId={reply.id}
              onCancel={() => setReplyingTo(null)}
              onSuccess={onReplySuccess}
            />
          )}

          {/* Child replies */}
          {children.map((child) => (
            <ReplyNode
              key={child.id}
              reply={child}
              tree={tree}
              threadId={threadId}
              depth={depth + 1}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              onReplySuccess={onReplySuccess}
              currentUsername={currentUsername}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function ThreadView({ thread, replies, currentUsername }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingThread, setEditingThread] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const tree = buildTree(replies);
  const topLevelReplies = tree.get(null) || [];

  const authorName = thread.user?.displayName || thread.user?.username || 'Unknown';
  const authorUsername = thread.user?.username;
  const isThreadOwner = currentUsername && authorUsername === currentUsername;

  function handleReplySuccess() {
    setReplyingTo(null);
    router.refresh();
  }

  async function handleDeleteThread() {
    if (!confirm('Delete this post and all its replies? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/forum');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete post.');
        setDeleting(false);
      }
    } catch {
      alert('Failed to delete post.');
      setDeleting(false);
    }
  }

  // If editing the thread, show the edit form
  if (editingThread) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
      >
        <div className="p-6">
          <EditThreadForm
            thread={thread}
            onCancel={() => setEditingThread(false)}
            onSuccess={() => { setEditingThread(false); router.refresh(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Thread card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
      >
        <div className="p-6">
          {/* Top row: title left, votes right */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>
              {thread.title}
            </h1>
            <VoteControls
              targetType="thread"
              targetId={thread.id}
              initialScore={thread.score}
              initialUserVote={thread.userVote}
            />
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#d4d4d8' }}>
            {thread.content}
          </div>

          {/* Bottom-right meta */}
          <div className="flex justify-end mt-4">
            <div className="text-left">
              {authorUsername ? (
                <Link
                  href={`/profile/${authorUsername}`}
                  className="text-xs font-bold no-underline hover:underline block"
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
                {thread.edited && <span className="italic ml-1">(edited)</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons for thread */}
      <div className="flex justify-end mt-1.5 gap-3">
        {isThreadOwner && (
          <>
            <button
              onClick={() => setEditingThread(true)}
              className="text-xs font-bold uppercase tracking-wide transition-colors hover:opacity-70"
              style={{ color: '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Edit
            </button>
            <button
              onClick={handleDeleteThread}
              disabled={deleting}
              className="text-xs font-bold uppercase tracking-wide transition-colors hover:opacity-70 disabled:opacity-40"
              style={{ color: '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        )}
        {session && (
          <button
            onClick={() => setReplyingTo(replyingTo === 0 ? null : 0)}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-colors hover:opacity-70"
            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Reply
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>

      {/* Inline reply form for thread */}
      {replyingTo === 0 && (
        <ReplyForm
          threadId={thread.id}
          parentReplyId={null}
          onCancel={() => setReplyingTo(null)}
          onSuccess={handleReplySuccess}
        />
      )}

      {/* Replies */}
      {topLevelReplies.length > 0 && (
        <div className="mt-4">
          {topLevelReplies.map((reply) => (
            <ReplyNode
              key={reply.id}
              reply={reply}
              tree={tree}
              threadId={thread.id}
              depth={0}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              onReplySuccess={handleReplySuccess}
              currentUsername={currentUsername}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          ))}
        </div>
      )}
    </>
  );
}
