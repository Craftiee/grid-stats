'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      // Auto-login after successful registration
      const result = await signIn('credentials', {
        username: data.username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push('/login');
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

  const inputStyle = {
    backgroundColor: '#0a0a0a',
    border: '1px solid #27272a',
    color: '#e2e8f0',
  };

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
          <p className="text-sm mt-1" style={{ color: '#71717a' }}>Create your account</p>
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
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#dc2626')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                placeholder="3-30 characters, letters, numbers, underscores"
                required
                autoComplete="username"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: '#71717a' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm font-medium outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#dc2626')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                placeholder="you@example.com"
                required
                autoComplete="email"
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
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#dc2626')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: '#71717a' }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm font-medium outline-none transition-colors"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#dc2626')}
                onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
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
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm mt-6" style={{ color: '#71717a' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-bold transition-colors" style={{ color: '#dc2626' }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
