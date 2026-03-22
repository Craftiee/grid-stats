'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CurrentDriver, PastDriver, DriverChampionData } from './page';

interface Props {
  currentDrivers: CurrentDriver[];
  champion: DriverChampionData;
  pastDrivers: PastDriver[];
}

export default function DriversClient({ currentDrivers, champion, pastDrivers }: Props) {
  const [search, setSearch] = useState('');
  const [decade, setDecade] = useState<number | null>(null);
  const [nationality, setNationality] = useState<string | null>(null);
  const [championsOnly, setChampionsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Decades derived from actual racing years (not birth year)
  const decades = useMemo(() => {
    const ds = new Set<number>();
    pastDrivers.forEach((d) => d.racingDecades.forEach((dec) => ds.add(dec)));
    return Array.from(ds).filter((d) => d >= 1950).sort((a, b) => a - b);
  }, [pastDrivers]);

  // Unique nationalities from past drivers
  const nationalities = useMemo(() => {
    const ns = new Set<string>();
    pastDrivers.forEach((d) => {
      if (d.nationality) ns.add(d.nationality);
    });
    return Array.from(ns).sort();
  }, [pastDrivers]);

  // Filtered past drivers
  const filtered = useMemo(() => {
    return pastDrivers.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        const full = `${d.firstName} ${d.lastName}`.toLowerCase();
        if (!full.includes(q) && !(d.code?.toLowerCase().includes(q))) return false;
      }
      if (decade !== null) {
        if (!d.racingDecades.includes(decade)) return false;
      }
      if (nationality && d.nationality !== nationality) return false;
      if (championsOnly && d.championships === 0) return false;
      return true;
    });
  }, [pastDrivers, search, decade, nationality, championsOnly]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const hasFilters = Boolean(search || decade !== null || nationality || championsOnly);

  function applyDecade(d: number | null) { setDecade(d); setPage(1); }
  function applyNationality(n: string | null) { setNationality(n); setPage(1); }
  function resetFilters() {
    setSearch(''); setDecade(null); setNationality(null); setChampionsOnly(false); setPage(1);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <div className="container mx-auto px-4 py-8">

        {/* Reigning Champion Card */}
        {champion && (
          <div className="mb-6 flex flex-col items-center">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#52525b' }}>
              Reigning Champion
            </div>
            <div style={{ width: '33%', minWidth: '220px' }}>
              <Link href={`/drivers/${champion.driverId}`} className="block no-underline group">
                <div
                  className="rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5"
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                >
                  <div className="flex items-stretch">
                    <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: champion.teamColor }} />
                    <div className="flex items-center gap-3 px-4 py-3 flex-1">
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[9px] font-bold uppercase tracking-widest mb-1"
                          style={{ color: champion.teamColor }}
                        >
                          {champion.year} Driver Champion
                        </div>
                        <div className="font-black uppercase tracking-wide text-sm leading-tight" style={{ color: '#e2e8f0' }}>
                          {champion.firstName} {champion.lastName}
                        </div>
                        {champion.teamName && (
                          <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                            {champion.teamName}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-black leading-none" style={{ color: champion.teamColor }}>
                          {champion.championships}
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: '#71717a' }}>
                          {champion.championships === 1 ? 'Title' : 'Titles'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Current Grid Section Label */}
        <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#52525b' }}>
          2026 Season — Current Grid
        </div>

        {/* Current Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {currentDrivers.map((driver) => (
            <Link key={driver.driverId} href={`/drivers/${driver.driverId}`} className="block no-underline group">
              <div
                className="rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 h-full"
                style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
              >
                <div className="flex items-stretch h-full">
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: driver.teamColor }} />
                  <div className="flex items-center gap-4 px-5 py-4 flex-1">
                    {/* Driver code / number badge */}
                    <div
                      className="flex-shrink-0 text-center"
                      style={{ width: '44px' }}
                    >
                      {driver.code && (
                        <div className="text-xs font-black uppercase tracking-widest" style={{ color: driver.teamColor }}>
                          {driver.code}
                        </div>
                      )}
                      {driver.number && (
                        <div className="text-lg font-black leading-tight" style={{ color: '#e2e8f0' }}>
                          {driver.number}
                        </div>
                      )}
                    </div>

                    {/* Name + team */}
                    <div className="flex-1 min-w-0">
                      <div className="font-black uppercase tracking-wide text-base leading-tight" style={{ color: '#e2e8f0' }}>
                        {driver.firstName} {driver.lastName}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                        {driver.teamName}
                      </div>
                      {driver.nationality && (
                        <div className="text-xs mt-0.5" style={{ color: '#52525b' }}>
                          {driver.nationality}
                        </div>
                      )}
                    </div>

                    {/* Championships */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-black leading-none" style={{ color: driver.championships > 0 ? driver.teamColor : '#3f3f46' }}>
                        {driver.championships}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: '#71717a' }}>
                        {driver.championships === 1 ? 'Title' : 'Titles'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Past Drivers Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: '#27272a' }} />
          <span className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#52525b' }}>
            Past Drivers
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#27272a' }} />
        </div>

        {/* Filters */}
        <div className="mb-5 space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-72 px-4 py-2 rounded-md text-sm outline-none"
            style={{ backgroundColor: '#18181b', border: '1px solid #27272a', color: '#e2e8f0' }}
          />

          {/* Birth decade chips */}
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
              {filtered.length} driver{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Past Drivers Grid */}
        {paginated.length === 0 ? (
          <div
            className="text-center py-16 rounded-lg"
            style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
          >
            <p className="text-sm" style={{ color: '#71717a' }}>No drivers match your filters.</p>
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
            {paginated.map((driver) => (
              <Link key={driver.driverId} href={`/drivers/${driver.driverId}`} className="block no-underline group">
                <div
                  className="rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 h-full"
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                >
                  <div className="flex items-stretch h-full">
                    <div className="w-1 flex-shrink-0" style={{ backgroundColor: '#3f3f46' }} />
                    <div className="flex items-center gap-3 px-4 py-3 flex-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate" style={{ color: '#e2e8f0' }}>
                          {driver.firstName} {driver.lastName}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                          {driver.nationality}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-black leading-none" style={{ color: driver.championships > 0 ? '#dc2626' : '#3f3f46' }}>
                          {driver.championships}
                        </div>
                        <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: '#71717a' }}>
                          {driver.championships === 1 ? 'Title' : 'Titles'}
                        </div>
                      </div>
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
