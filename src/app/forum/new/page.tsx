'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function NewThreadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
        <p className="text-sm" style={{ color: '#71717a' }}>Loading...</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }

      router.push('/forum');
    } catch {
      setError('Failed to create post. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <div className="container mx-auto px-4 py-6 max-w-3xl">

        <h1
          className="text-lg font-bold uppercase tracking-wide mb-5"
          style={{ color: '#e2e8f0' }}
        >
          Create New Post
        </h1>

        <form onSubmit={handleSubmit}>
          <div
            className="rounded-xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
          >
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: '#52525b' }}
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                maxLength={255}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:ring-1"
                style={{
                  backgroundColor: '#111113',
                  border: '1px solid #27272a',
                  color: '#e2e8f0',
                }}
              />
            </div>

            {/* Body */}
            <div>
              <label
                htmlFor="content"
                className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: '#52525b' }}
              >
                Body
              </label>
              <textarea
                id="content"
                maxLength={10000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={10}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors resize-y focus:ring-1"
                style={{
                  backgroundColor: '#111113',
                  border: '1px solid #27272a',
                  color: '#e2e8f0',
                  minHeight: '200px',
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs font-medium" style={{ color: '#ef4444' }}>
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-1">
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
              <a
                href="/forum"
                className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors hover:bg-white/5"
                style={{ color: '#71717a' }}
              >
                Cancel
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
