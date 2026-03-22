'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CurrentTeam, PastTeam, ChampionData } from './page';

interface Props {
  currentTeams: CurrentTeam[];
  champion: ChampionData;
  pastTeams: PastTeam[];
}

export default function TeamsClient({ currentTeams, champion, pastTeams }: Props) {
  const [search, setSearch] = useState('');
  const [decade, setDecade] = useState<number | null>(null);
  const [nationality, setNationality] = useState<string | null>(null);
  const [championsOnly, setChampionsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Unique decades from past team first entries
  const decades = useMemo(() => {
    const ds = new Set<number>();
    pastTeams.forEach((t) => {
      if (t.firstEntry) ds.add(Math.floor(t.firstEntry / 10) * 10);
    });
    return Array.from(ds).sort((a, b) => a - b);
  }, [pastTeams]);

  // Unique nationalities from past teams
  const nationalities = useMemo(() => {
    const ns = new Set<string>();
    pastTeams.forEach((t) => {
      if (t.nationality) ns.add(t.nationality);
    });
    return Array.from(ns).sort();
  }, [pastTeams]);

  // Filtered past teams
  const filtered = useMemo(() => {
    return pastTeams.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (decade !== null && t.firstEntry !== null) {
        if (Math.floor(t.firstEntry / 10) * 10 !== decade) return false;
      }
      if (nationality && t.nationality !== nationality) return false;
      if (championsOnly && t.worldChampionships === 0) return false;
      return true;
    });
  }, [pastTeams, search, decade, nationality, championsOnly]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const hasFilters = Boolean(search || decade !== null || nationality || championsOnly);

  function applyDecade(d: number | null) {
    setDecade(d);
    setPage(1);
  }

  function applyNationality(n: string | null) {
    setNationality(n);
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setDecade(null);
    setNationality(null);
    setChampionsOnly(false);
    setPage(1);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <div className="container mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black uppercase tracking-wider" style={{ color: '#e2e8f0' }}>
            Teams
          </h2>
          <p className="text-sm mt-1" style={{ color: '#71717a' }}>
            {currentTeams.length} active constructors in 2026 &middot; {pastTeams.length} historical teams
          </p>
        </div>

        {/* Previous Season Champion Card */}
        {champion && (
          <div className="mb-6 flex flex-col items-center">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#52525b' }}>
              Reigning Champion
            </div>
            <div style={{ width: '33%', minWidth: '220px' }}>
              <Link href={`/teams/${champion.constructorId}`} className="block no-underline group">
                <div
                  className="rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5"
                  style={{ backgroundColor: '#18181b', border: `1px solid #27272a` }}
                >
                  <div className="flex items-stretch">
                    <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: champion.color }} />
                    <div className="flex items-center gap-3 px-4 py-3 flex-1">
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[9px] font-bold uppercase tracking-widest mb-1"
                          style={{ color: champion.color }}
                        >
                          {champion.year} Constructor Champion
                        </div>
                        <div className="font-black uppercase tracking-wide text-sm leading-tight" style={{ color: '#e2e8f0' }}>
                          {champion.name}
                        </div>
                        {champion.base && (
                          <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                            {champion.base}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-black leading-none" style={{ color: champion.color }}>
                          {champion.worldChampionships}
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: '#71717a' }}>
                          {champion.worldChampionships === 1 ? 'Title' : 'Titles'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Current Teams Section Label */}
        <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#52525b' }}>
          2026 Season — Active Constructors
        </div>

        {/* Current Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {currentTeams.map((team) => (
            <Link key={team.constructorId} href={`/teams/${team.constructorId}`} className="block no-underline group">
              <div
                className="rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 h-full"
                style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
              >
                <div className="flex items-stretch h-full">
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: team.color }} />
                  <div className="flex items-center gap-4 px-5 py-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-black uppercase tracking-wide text-base leading-tight"
                        style={{ color: '#e2e8f0' }}
                      >
                        {team.name}
                      </div>
                      {team.fullName && team.fullName !== team.name && (
                        <div className="text-xs mt-0.5 truncate" style={{ color: '#71717a' }}>
                          {team.fullName}
                        </div>
                      )}
                      {team.base && (
                        <div className="text-xs mt-1" style={{ color: '#a1a1aa' }}>
                          {team.base}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-black leading-none" style={{ color: team.color }}>
                        {team.worldChampionships}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: '#71717a' }}>
                        {team.worldChampionships === 1 ? 'Title' : 'Titles'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Past Teams Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: '#27272a' }} />
          <span className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#52525b' }}>
            Past Teams
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#27272a' }} />
        </div>

        {/* Filters */}
        <div className="mb-5 space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-72 px-4 py-2 rounded-md text-sm outline-none focus:ring-1"
            style={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#e2e8f0',
            }}
          />

          {/* Era filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyDecade(null)}
              className="px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide transition-all"
              style={{
                backgroundColor: decade === null ? '#dc2626' : '#18181b',
                color: decade === null ? '#fff' : '#a1a1aa',
                border: `1px solid ${decade === null ? '#dc2626' : '#3f3f46'}`,
              }}
            >
              All Eras
            </button>
            {decades.map((d) => (
              <button
                key={d}
                onClick={() => applyDecade(decade === d ? null : d)}
                className="px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide transition-all"
                style={{
                  backgroundColor: decade === d ? '#dc2626' : '#18181b',
                  color: decade === d ? '#fff' : '#a1a1aa',
                  border: `1px solid ${decade === d ? '#dc2626' : '#3f3f46'}`,
                }}
              >
                {d} – {d + 9}
              </button>
            ))}
          </div>

          {/* Nationality + Champions Only + Clear */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={nationality ?? ''}
              onChange={(e) => applyNationality(e.target.value || null)}
              className="px-3 py-1.5 rounded text-sm outline-none"
              style={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                color: nationality ? '#e2e8f0' : '#71717a',
              }}
            >
              <option value="">All Nationalities</option>
              {nationalities.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <button
              onClick={() => { setChampionsOnly(!championsOnly); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wide transition-all"
              style={{
                backgroundColor: championsOnly ? '#dc2626' : '#18181b',
                color: championsOnly ? '#fff' : '#a1a1aa',
                border: `1px solid ${championsOnly ? '#dc2626' : '#3f3f46'}`,
              }}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Champions Only
            </button>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="text-xs px-3 py-1.5 rounded transition-all"
                style={{ color: '#71717a', border: '1px solid #3f3f46', backgroundColor: '#18181b' }}
              >
                Clear filters
              </button>
            )}

            <span className="text-xs ml-auto" style={{ color: '#52525b' }}>
              {filtered.length} team{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Past Teams Grid */}
        {paginated.length === 0 ? (
          <div
            className="text-center py-16 rounded-lg"
            style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
          >
            <p className="text-sm" style={{ color: '#71717a' }}>No teams match your filters.</p>
            <button
              onClick={resetFilters}
              className="mt-3 text-xs px-4 py-2 rounded transition-all"
              style={{ color: '#dc2626', border: '1px solid #dc262644', backgroundColor: '#dc262611' }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
            {paginated.map((team) => (
              <Link key={team.constructorId} href={`/teams/${team.constructorId}`} className="block no-underline group">
                <div
                  className="rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 h-full"
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                >
                  <div className="flex items-stretch h-full">
                    <div className="w-1 flex-shrink-0" style={{ backgroundColor: team.color }} />
                    <div className="flex items-center gap-3 px-4 py-3 flex-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate" style={{ color: '#e2e8f0' }}>
                          {team.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                          {[
                            team.nationality,
                            team.firstEntry ? `est. ${team.firstEntry}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      {team.worldChampionships > 0 && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-black leading-none" style={{ color: team.color }}>
                            {team.worldChampionships}
                          </div>
                          <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: '#71717a' }}>
                            {team.worldChampionships === 1 ? 'Title' : 'Titles'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#71717a' }}>Per page:</span>
              {[25, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => { setPerPage(n); setPage(1); }}
                  className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: perPage === n ? '#dc2626' : '#18181b',
                    color: perPage === n ? '#fff' : '#a1a1aa',
                    border: `1px solid ${perPage === n ? '#dc2626' : '#3f3f46'}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded text-xs font-semibold transition-all disabled:opacity-40"
                style={{ backgroundColor: '#18181b', color: '#a1a1aa', border: '1px solid #3f3f46' }}
              >
                Prev
              </button>
              <span className="text-xs px-3" style={{ color: '#71717a' }}>
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded text-xs font-semibold transition-all disabled:opacity-40"
                style={{ backgroundColor: '#18181b', color: '#a1a1aa', border: '1px solid #3f3f46' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
