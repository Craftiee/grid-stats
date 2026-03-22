'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [motorsportOpen, setMotorsportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const motorsportRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (motorsportRef.current && !motorsportRef.current.contains(e.target as Node)) {
        setMotorsportOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Hide navbar on auth pages (must be after all hooks)
  if (pathname === '/login' || pathname === '/register') return null;

  // Determine active page from current URL
  let activePage = 'dashboard';
  if (pathname.startsWith('/news')) activePage = 'news';
  else if (pathname.startsWith('/drivers')) activePage = 'drivers';
  else if (pathname.startsWith('/teams')) activePage = 'teams';
  else if (pathname === '/') activePage = 'dashboard';

  return (
    <nav className="z-50" style={{ backgroundColor: '#18181b', borderBottom: '1px solid #27272a' }}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end h-24 pb-4">

          {/* Logo + Motorsport Selector */}
          <div className="flex-shrink-0 flex items-end mb-2 gap-4">
            <Link href="/" className="no-underline">
              <h1
                className="text-5xl font-black italic cursor-pointer select-none tracking-[0.15em] relative z-10"
                style={{ transform: 'skewX(-10deg)' }}
              >
                <span className="text-red-600 inline-block">GRID</span>
                <span className="inline-block stats-text">STATS</span>
                <div className="absolute -bottom-1 left-0 h-1.5 w-full bg-red-600 skew-x-12"></div>
              </h1>
            </Link>

            {/* Motorsport Dropdown */}
            <div className="relative mb-1" id="motorsport-dropdown-container" ref={motorsportRef}>
              <button
                onClick={() => setMotorsportOpen(!motorsportOpen)}
                id="motorsport-btn"
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all duration-200${motorsportOpen ? ' active' : ''}`}
                style={{ backgroundColor: 'transparent', border: '1px solid #3f3f46' }}
              >
                <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Formula One</span>
                <svg
                  id="motorsport-arrow"
                  className="w-4 h-4 transition-transform duration-200"
                  style={{
                    transform: motorsportOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    stroke: motorsportOpen ? '#dc2626' : '#71717a',
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {motorsportOpen && (
                <div
                  className="absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50"
                  style={{ backgroundColor: '#1a1a1f', border: '1px solid #3f3f46' }}
                >
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setMotorsportOpen(false); }}
                    className="motorsport-option block px-4 py-2 text-sm font-medium transition-colors duration-150"
                    style={{ color: '#e2e8f0' }}
                  >
                    Formula One
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Nav Links */}
          <div
            className="nav-container hidden md:flex items-center gap-1 mb-1 relative rounded-lg p-1"
            style={{ backgroundColor: '#18181b' }}
          >
            <Link
              href="/news"
              className={`nav-btn${activePage === 'news' ? ' active' : ''} px-4 py-2 text-sm font-semibold transition uppercase tracking-wide`}
            >
              News
            </Link>

            <Link
              href="/"
              className={`nav-btn${activePage === 'dashboard' ? ' active' : ''} px-4 py-2 text-sm font-semibold transition uppercase tracking-wide`}
            >
              Dashboard
            </Link>

            <Link
              href="/drivers"
              className={`nav-btn${activePage === 'drivers' ? ' active' : ''} px-4 py-2 text-sm font-semibold transition uppercase tracking-wide`}
            >
              Drivers
            </Link>

            <Link
              href="/teams"
              className={`nav-btn${activePage === 'teams' ? ' active' : ''} px-4 py-2 text-sm font-semibold transition uppercase tracking-wide`}
            >
              Teams
            </Link>

            <Link
              href="/"
              className={`nav-btn${activePage === 'stats' ? ' active' : ''} px-4 py-2 text-sm font-semibold transition uppercase tracking-wide`}
            >
              Stats
            </Link>

            <Link
              href="/"
              className={`nav-btn${activePage === 'forum' ? ' active' : ''} px-4 py-2 text-sm font-semibold transition uppercase tracking-wide`}
            >
              Forum
            </Link>

            {/* Settings */}
            <div className="relative ml-1" ref={settingsRef}>
              <button onClick={() => setSettingsOpen(!settingsOpen)} className="nav-btn p-2 rounded transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {settingsOpen && (
                <div
                  id="settings-dropdown"
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50"
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                >
                  {!mounted || status === 'loading' ? (
                    <div className="px-4 py-3 text-sm" style={{ color: '#71717a' }}>Loading...</div>
                  ) : session ? (
                    <>
                      {/* Logged-in user info */}
                      <div className="px-4 py-2 border-b" style={{ borderColor: '#27272a' }}>
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#71717a' }}>
                          {session.user.role}
                        </span>
                        <Link href="/profile" className="block text-sm font-medium hover:underline" style={{ color: '#e2e8f0' }}>
                          {session.user.name}
                        </Link>
                      </div>

                      {/* Admin link — only for ADMIN role */}
                      {session.user.role === 'ADMIN' && (
                        <>
                          <a
                            href="/admin"
                            className="block px-4 py-2 text-sm font-medium hover:bg-white/5 transition"
                            style={{ color: '#f59e0b' }}
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                />
                              </svg>
                              Admin Panel
                            </span>
                          </a>
                          <div className="h-px" style={{ backgroundColor: '#27272a' }}></div>
                        </>
                      )}

                      <a href="#" className="block px-4 py-2 text-sm hover:bg-white/5 transition" style={{ color: '#a1a1aa' }}>Settings</a>
                      <a href="#" className="block px-4 py-2 text-sm hover:bg-white/5 transition" style={{ color: '#a1a1aa' }}>Send Feedback</a>
                      <div className="h-px my-1" style={{ backgroundColor: '#27272a' }}></div>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-white/5 transition"
                        style={{ color: '#f87171' }}
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Logged-out state */}
                      <div className="px-4 py-2 border-b" style={{ borderColor: '#27272a' }}>
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#71717a' }}>Account</span>
                      </div>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm font-medium hover:bg-white/5 transition"
                        style={{ color: '#e2e8f0' }}
                      >
                        Log In
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-2 text-sm font-medium hover:bg-white/5 transition"
                        style={{ color: '#dc2626' }}
                      >
                        Register
                      </Link>
                      <div className="h-px my-1" style={{ backgroundColor: '#27272a' }}></div>
                      <a href="#" className="block px-4 py-2 text-sm hover:bg-white/5 transition" style={{ color: '#a1a1aa' }}>Settings</a>
                      <a href="#" className="block px-4 py-2 text-sm hover:bg-white/5 transition" style={{ color: '#a1a1aa' }}>Contact Us</a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden mb-2">
            <button style={{ color: '#a1a1aa' }}>
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
