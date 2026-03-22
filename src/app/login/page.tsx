'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username: username.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === 'CredentialsSignin'
          ? 'Invalid username or password.'
          : result.error
        );
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4" style={{ backgroundColor: '#050505' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="no-underline">
            <h1 className="text-3xl font-black italic tracking-[0.15em]" style={{ color: '#ffffff', transform: 'skewX(-10deg)' }}>
              <span style={{ color: '#dc2626' }}>GRID</span>STATS
            </h1>
          </Link>
          <p className="text-sm mt-1" style={{ color: '#71717a' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: '#71717a' }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm font-medium outline-none transition-colors"
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #27272a',
                  color: '#e2e8f0',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#dc2626')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: '#71717a' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm font-medium outline-none transition-colors"
                style={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #27272a',
                  color: '#e2e8f0',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#dc2626')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              onMouseOver={(e) => { if (!loading) (e.target as HTMLElement).style.backgroundColor = '#ef4444'; }}
              onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#dc2626'}
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm mt-6" style={{ color: '#71717a' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold transition-colors" style={{ color: '#dc2626' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
