'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState, useEffect, useRef, useCallback } from 'react';
import NewsCarousel from '@/components/NewsCarousel';

// ============================================================
// WELCOME NOTIFICATION (once per session)
// ============================================================

function WelcomeNotification() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('gridstats_welcomed')) return;
    sessionStorage.setItem('gridstats_welcomed', '1');
    // Small delay so the animation plays after mount
    const t = setTimeout(() => setVisible(true), 300);
    // Auto-dismiss after 12 seconds
    const auto = setTimeout(() => dismiss(), 12000);
    return () => { clearTimeout(t); clearTimeout(auto); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => setVisible(false), 400);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none"
      style={{ paddingTop: '80px' }}
    >
      <div
        className="pointer-events-auto rounded-xl shadow-2xl px-6 py-5 max-w-lg w-full mx-4 relative"
        style={{
          backgroundColor: '#18181b',
          border: '1px solid #3f3f46',
          animation: exiting ? 'welcomeSlideOut 0.4s ease-in forwards' : 'welcomeSlideIn 0.5s ease-out forwards',
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 hover:opacity-80 transition-opacity"
          style={{ color: '#71717a' }}
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dc262620' }}>
              <svg className="w-5 h-5" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide" style={{ color: '#e2e8f0' }}>
              Welcome to GRIDSTATS
            </h4>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#a1a1aa' }}>
              This site is currently under construction. Thank you for checking us out &mdash; we hope you enjoy the content!
              If you have suggestions or run into any issues, reach out to us via{' '}
              <span className="font-semibold" style={{ color: '#dc2626' }}>Contact Us</span>{' '}
              in the menu. We&apos;d love to hear from you.
            </p>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        <div className="mt-4 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: '#27272a' }}>
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: '#dc2626',
              animation: 'welcomeProgress 12s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONSTANTS (from app.js)
// ============================================================

const API_BASE = '/api/';
const CURRENT_YEAR = 2026;

const circuitTimezones: Record<string, number> = {
  'albert_park': 11, 'bahrain': 3, 'jeddah': 3, 'suzuka': 9,
  'shanghai': 8, 'miami': -4, 'imola': 2, 'monaco': 2,
  'villeneuve': -4, 'catalunya': 2, 'red_bull_ring': 2, 'silverstone': 1,
  'hungaroring': 2, 'spa': 2, 'zandvoort': 2, 'monza': 2,
  'baku': 4, 'marina_bay': 8, 'americas': -5, 'rodriguez': -6,
  'interlagos': -3, 'vegas': -8, 'losail': 3, 'yas_marina': 4, 'madring': 2,
};

const circuitTimezoneAbbr: Record<string, string> = {
  'albert_park': 'AEDT', 'bahrain': 'AST', 'jeddah': 'AST', 'suzuka': 'JST',
  'shanghai': 'CST', 'miami': 'EDT', 'imola': 'CEST', 'monaco': 'CEST',
  'villeneuve': 'EDT', 'catalunya': 'CEST', 'red_bull_ring': 'CEST', 'silverstone': 'BST',
  'hungaroring': 'CEST', 'spa': 'CEST', 'zandvoort': 'CEST', 'monza': 'CEST',
  'baku': 'AZT', 'marina_bay': 'SGT', 'americas': 'CDT', 'rodriguez': 'CDT',
  'interlagos': 'BRT', 'vegas': 'PST', 'losail': 'AST', 'yas_marina': 'GST', 'madring': 'CEST',
};

const teamColorsFallback: Record<string, string> = {
  "red_bull": "#3671C6", "ferrari": "#E80020", "mclaren": "#FF8000",
  "mercedes": "#27F4D2", "aston_martin": "#229971", "alpine": "#eb58a5",
  "williams": "#64C4FF", "rb": "#6692FF", "sauber": "#52E252",
  "haas": "#B6BABD", "alphatauri": "#4E7C9B", "alfa": "#C92D4B",
  "racing_point": "#F596C8", "renault": "#FFF500", "toro_rosso": "#469BFF",
  "cadillac": "#C9A227", "audi": "#FF4D00", "default": "#FFFFFF",
};

const teamImageMap: Record<string, string> = {
  'alfa': 'Alfa', 'alpine': 'Alpine', 'aston_martin': 'Aston',
  'ferrari': 'Ferrari', 'haas': 'Haas', 'sauber': 'Kick',
  'mclaren': 'McLaren', 'mercedes': 'Merc', 'rb': 'RBF1',
  'alphatauri': 'RBF1', 'red_bull': 'RedBull', 'williams': 'Williams',
  'cadillac': 'Cadillac', 'audi': 'Audi',
};

const photoOffsets: Record<string, string> = {
  'piastri': '-15px', 'hamilton': '-15px', 'albon': '-15px',
  'sainz': '-15px', 'bearman': '-15px', 'lawson': '-15px',
  'tsunoda': '-15px', 'gasly': '-15px', 'russell': '-15px',
  'leclerc': '-15px', 'antonelli': '-15px', 'hulkenberg': '-15px',
  'ocon': '-15px', 'colapinto': '-20px', 'hadjar': '10px',
};

const countryCodeMap: Record<string, string> = {
  "Dutch": "nl", "British": "gb", "Monegasque": "mc", "Spanish": "es",
  "Mexican": "mx", "Australian": "au", "German": "de", "French": "fr",
  "Thai": "th", "Canadian": "ca", "Japanese": "jp", "Chinese": "cn",
  "American": "us", "Finnish": "fi", "Brazilian": "br", "Danish": "dk",
  "Italian": "it", "New Zealander": "nz", "Argentine": "ar", "Swiss": "ch",
  "Belgian": "be", "Austrian": "at", "Polish": "pl", "Russian": "ru",
  "Swedish": "se", "Indonesian": "id", "Indian": "in", "Venezuelan": "ve",
  "Colombian": "co", "South African": "za", "Portuguese": "pt", "Irish": "ie",
  "Hungarian": "hu", "Czech": "cz", "Malaysian": "my", "Estonian": "ee",
  "Uruguayan": "uy", "Chilean": "cl", "Moroccan": "ma", "Singaporean": "sg",
  "Korean": "kr", "Emirati": "ae", "Israeli": "il", "Turkish": "tr",
};

const locationMap: Record<string, string> = {
  'Australian Grand Prix': 'Australia', 'Austrian Grand Prix': 'Austria',
  'Azerbaijan Grand Prix': 'Azerbaijan', 'Bahrain Grand Prix': 'Bahrain',
  'Belgian Grand Prix': 'Belgium', 'Brazilian Grand Prix': 'Brazil',
  'British Grand Prix': 'Great Britain', 'Canadian Grand Prix': 'Canada',
  'Chinese Grand Prix': 'China', 'Dutch Grand Prix': 'Netherlands',
  'Emilia Romagna Grand Prix': 'Emilia Romagna', 'Hungarian Grand Prix': 'Hungary',
  'Italian Grand Prix': 'Italy', 'Japanese Grand Prix': 'Japan',
  'Mexican Grand Prix': 'Mexico', 'Mexico City Grand Prix': 'Mexico City',
  'Monaco Grand Prix': 'Monaco', 'Qatar Grand Prix': 'Qatar',
  'Saudi Arabian Grand Prix': 'Saudi Arabia', 'Singapore Grand Prix': 'Singapore',
  'Spanish Grand Prix': 'Spain', 'Barcelona Grand Prix': 'Barcelona',
  'United States Grand Prix': 'United States', 'Abu Dhabi Grand Prix': 'Abu Dhabi',
  'Las Vegas Grand Prix': 'Las Vegas', 'Miami Grand Prix': 'Miami',
  'Portuguese Grand Prix': 'Portugal', 'Russian Grand Prix': 'Russia',
  'Turkish Grand Prix': 'Turkey', 'Styrian Grand Prix': 'Styria',
  'Sakhir Grand Prix': 'Sakhir', '70th Anniversary Grand Prix': 'Silverstone',
  'Eifel Grand Prix': 'Eifel', 'Tuscan Grand Prix': 'Tuscany',
  'Pre-Season Testing': 'Pre-Season', 'Season Schedule TBA': 'TBA',
};

const defaultDriverImage = "/img/drivers/generic.png";
const defaultCircuitImage = "https://placehold.co/800x400/18181b/333?text=Track+Map";

// Map circuitId → local track image in /img/tracks/
const trackImages: Record<string, string> = {
  albert_park: '/img/tracks/albertpark.png',
};

// ============================================================
// PURE HELPER FUNCTIONS
// ============================================================

function getLocationName(raceName: string): string {
  if (!raceName) return 'TBA';
  if (locationMap[raceName]) return locationMap[raceName];
  return raceName.replace(' Grand Prix', '').replace(' GP', '');
}

function getTeamColor(constructor: any): string {
  if (constructor?.color) return constructor.color;
  if (constructor?.constructorId) return teamColorsFallback[constructor.constructorId] || teamColorsFallback['default'];
  return teamColorsFallback['default'];
}

function getFlagUrl(nationality: string): string {
  const code = countryCodeMap[nationality] || 'gb';
  return `/img/flags/${code}.png`;
}

function getTeamUrl(constructorId: string): string {
  return `/teams/${constructorId}`;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function FlagImg({ nationality, size = 'normal' }: { nationality: string; size?: 'normal' | 'large' }) {
  const url = getFlagUrl(nationality);
  const sizeClass = size === 'large' ? 'w-16 h-11' : 'w-6 h-4';
  return (
    <img
      src={url}
      alt={nationality}
      className={`${sizeClass} object-cover rounded shadow-lg`}
    />
  );
}

function PodiumPosition({ driver, position }: { driver: any; position: number }) {
  if (!driver) {
    return (
      <div className="flex flex-col items-center" style={{ width: '100px' }}>
        <div className="w-full h-16 rounded-t-lg flex items-end justify-center pb-2" style={{ backgroundColor: '#27272a' }}>
          <span className="text-2xl font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>{position}</span>
        </div>
        <div className="text-center mt-2">
          <span className="text-xs" style={{ color: '#71717a' }}>—</span>
        </div>
      </div>
    );
  }

  const teamColor = getTeamColor(driver.Constructor);
  const driverCode = driver.Driver.code || driver.Driver.familyName.substring(0, 3).toUpperCase();
  const driverName = driver.Driver.familyName;
  const teamName = driver.Constructor.name;

  let podiumBg = '';
  let height = 'h-16';
  if (position === 1) { podiumBg = 'background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);'; height = 'h-20'; }
  else if (position === 2) { podiumBg = 'background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);'; height = 'h-16'; }
  else if (position === 3) { podiumBg = 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);'; height = 'h-14'; }

  return (
    <div className="flex flex-col items-center" style={{ width: '100px' }}>
      <div className="px-3 py-1 rounded text-xs font-bold mb-2" style={{ backgroundColor: teamColor, color: 'white' }}>
        {driverCode}
      </div>
      <div
        className={`w-full ${height} rounded-t-lg flex items-end justify-center pb-2 relative`}
        style={{ background: position === 1 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : position === 2 ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
      >
        <span className="text-2xl font-black" style={{ color: 'rgba(0,0,0,0.3)' }}>{position}</span>
      </div>
      <div className="text-center mt-2 w-full">
        <span className="text-xs font-bold block truncate" style={{ color: '#e2e8f0' }}>{driverName}</span>
        <span className="text-[10px]" style={{ color: '#71717a' }}>{teamName}</span>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ============================================================
// MAIN DASHBOARD PAGE
// ============================================================

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [currentCenterTab, setCurrentCenterTab] = useState<'schedule' | 'results'>('schedule');
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(0);
  const [driverStandings, setDriverStandings] = useState<any[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<any[]>([]);
  const [openDriverId, setOpenDriverId] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(false);
  const [driverLoading, setDriverLoading] = useState(true);
  const [driverError, setDriverError] = useState(false);
  const [constructorLoading, setConstructorLoading] = useState(true);
  const [constructorError, setConstructorError] = useState(false);
  const [resultsRaces, setResultsRaces] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', mins: '00', secs: '00' });
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);

  // ── Fetch recent forum activity (poll every 5s) ──
  useEffect(() => {
    let active = true;
    async function fetchRecent() {
      try {
        const res = await fetch('/api/forum/recent');
        if (res.ok && active) setRecentThreads(await res.json());
      } catch { /* ignore */ }
    }
    fetchRecent();
    const id = setInterval(fetchRecent, 5000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // ── Fetch on mount and year change ──
  useEffect(() => {
    fetchSchedule(selectedYear);
    fetchDriverStandings(selectedYear);
    fetchConstructorStandings(selectedYear);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // ── Countdown ──
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const race = races[selectedRaceIndex];
    if (!race) return;
    const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
    if (raceDate < new Date()) return;

    function tick() {
      const diff = raceDate.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ days: '00', hours: '00', mins: '00', secs: '00' });
        if (countdownRef.current) clearInterval(countdownRef.current);
        return;
      }
      setCountdown({
        days: Math.floor(diff / 86400000).toString().padStart(2, '0'),
        hours: Math.floor((diff % 86400000) / 3600000).toString().padStart(2, '0'),
        mins: Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0'),
        secs: Math.floor((diff % 60000) / 1000).toString().padStart(2, '0'),
      });
    }
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [races, selectedRaceIndex]);

  // ── Year dropdown close on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function switchCenterTab(tab: 'schedule' | 'results') {
    setCurrentCenterTab(tab);
    if (tab === 'results' && resultsRaces.length === 0) {
      fetchResults(selectedYear);
    }
  }

  function selectYear(year: number) {
    setYearDropdownOpen(false);
    if (year === selectedYear) return;
    setSelectedYear(year);
    setRaces([]);
    setDriverStandings([]);
    setConstructorStandings([]);
    setResultsRaces([]);
    setSelectedRaceIndex(0);
    if (currentCenterTab === 'results') {
      fetchResults(year);
    }
  }

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  async function fetchSchedule(year: number) {
    setScheduleLoading(true);
    setScheduleError(false);

    const cacheKey = `schedule_v3_${year}`;
    const cachedSchedule = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    const cacheMaxAge = 60 * 60 * 1000;

    if (cachedSchedule && cacheTime && (Date.now() - parseInt(cacheTime)) < cacheMaxAge) {
      const racesData = JSON.parse(cachedSchedule);
      const today = new Date();
      let nextIndex = racesData.findIndex((r: any) => new Date(`${r.date}T${r.time || '00:00:00Z'}`) >= today);
      if (nextIndex === -1) nextIndex = racesData.length - 1;
      setRaces(racesData);
      setSelectedRaceIndex(nextIndex);
      setScheduleLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}${year}`);
      const json = await res.json();
      let racesData: any[] = [];
      let nextIndex = 0;

      if (!json.MRData || !json.MRData.RaceTable.Races || json.MRData.RaceTable.Races.length === 0) {
        racesData = [{
          round: "0", raceName: "Season Schedule TBA",
          date: `${year}-03-01`, time: "00:00:00Z",
          Circuit: { circuitId: "tba", circuitName: "To Be Announced", timezoneOffset: 0, mapImageUrl: null },
        }];
      } else {
        racesData = json.MRData.RaceTable.Races;
        const today = new Date();
        nextIndex = racesData.findIndex((r: any) => new Date(`${r.date}T${r.time || '00:00:00Z'}`) >= today);
        if (nextIndex === -1) nextIndex = racesData.length - 1;
        localStorage.setItem(cacheKey, JSON.stringify(racesData));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      }
      setRaces(racesData);
      setSelectedRaceIndex(nextIndex);
    } catch (e) {
      console.error('Schedule fetch error:', e);
      setScheduleError(true);
    }
    setScheduleLoading(false);
  }

  async function fetchDriverStandings(year: number) {
    setDriverLoading(true);
    setDriverError(false);
    try {
      const res = await fetch(`${API_BASE}${year}/driverStandings`);
      const json = await res.json();
      if (!json.MRData || !json.MRData.StandingsTable.StandingsLists[0]) {
        setDriverStandings([]);
      } else {
        setDriverStandings(json.MRData.StandingsTable.StandingsLists[0].DriverStandings);
      }
    } catch (e) {
      console.error('Driver standings fetch error:', e);
      setDriverError(true);
    }
    setDriverLoading(false);
  }

  async function fetchConstructorStandings(year: number) {
    setConstructorLoading(true);
    setConstructorError(false);
    try {
      const res = await fetch(`${API_BASE}${year}/constructorStandings`);
      const json = await res.json();
      if (!json.MRData || !json.MRData.StandingsTable.StandingsLists[0]) {
        setConstructorStandings([]);
      } else {
        setConstructorStandings(json.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);
      }
    } catch (e) {
      console.error('Constructor standings fetch error:', e);
      setConstructorError(true);
    }
    setConstructorLoading(false);
  }

  async function fetchResults(year: number) {
    setResultsLoading(true);
    setResultsError(false);
    try {
      const res = await fetch(`${API_BASE}${year}/results`);
      const json = await res.json();
      if (!json.MRData || !json.MRData.RaceTable.Races || json.MRData.RaceTable.Races.length === 0) {
        setResultsRaces([]);
      } else {
        setResultsRaces(json.MRData.RaceTable.Races);
      }
    } catch (e) {
      console.error('Results fetch error:', e);
      setResultsError(true);
    }
    setResultsLoading(false);
  }

  // ============================================================
  // HERO CARD
  // ============================================================

  function renderHeroCard() {
    const race = races[selectedRaceIndex];
    if (!race) return null;

    const circuit = race.Circuit;
    const circuitId = circuit.circuitId || circuit.circuit_id;
    const timezoneOffset = circuitTimezones[circuitId] ?? circuit.timezoneOffset ?? 0;
    const mapImage = trackImages[circuitId] || circuit.mapImageUrl || circuit.Location?.mapImageUrl || defaultCircuitImage;
    const circuitName = (circuit.circuitName && circuit.circuitName !== 'Unknown Circuit')
      ? circuit.circuitName
      : race.raceName.replace(' Grand Prix', ' Circuit');

    const raceDateObj = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
    const today = new Date();
    const isCancelled = race.cancelled === true;
    const isCompleted = raceDateObj < today;
    const isSeasonOpener = parseInt(race.round) === 1;
    const isSeasonFinale = parseInt(race.round) === races.length;
    const raceEndEstimate = new Date(raceDateObj.getTime() + 3 * 60 * 60 * 1000);
    const isOngoing = today >= raceDateObj && today <= raceEndEstimate && !isCompleted;

    const userTime = raceDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const userTimezone = raceDateObj.toLocaleTimeString([], { timeZoneName: 'short' }).split(' ').pop() || '';

    const trackDate = new Date(raceDateObj.getTime());
    trackDate.setUTCHours(trackDate.getUTCHours() + timezoneOffset);
    const trackTimeStr = `${trackDate.getUTCHours().toString().padStart(2, '0')}:${trackDate.getUTCMinutes().toString().padStart(2, '0')}`;

    let headerLabel = '';
    let headerColor = '#a1a1aa';
    if (isSeasonOpener) { headerLabel = 'Season Opener'; headerColor = '#22c55e'; }
    else if (isSeasonFinale) { headerLabel = 'Season Finale'; headerColor = '#ef4444'; }

    return (
      <div className="relative w-full h-[400px] border-b overflow-hidden flex-shrink-0 group" style={{ backgroundColor: '#18181b', borderColor: '#27272a' }}>
        {/* Track map background */}
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition duration-700">
          <img src={mapImage} className="w-full h-full object-cover invert opacity-50" onError={(e) => { (e.target as HTMLImageElement).src = defaultCircuitImage; }} alt={circuitName} />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #18181b, rgba(24,24,27,0.5), transparent)' }}></div>

        {/* Round - Top Left */}
        <div className="absolute top-6 left-6 z-20">
          <span className="block text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: '#a1a1aa' }}>Round</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black" style={{ color: '#ffffff' }}>{race.round || '—'}</span>
            <span className="text-sm uppercase font-bold tracking-wider" style={{ color: '#a1a1aa' }}>/ {races.length || '—'}</span>
          </div>
        </div>

        {/* Season label - Top Right */}
        {headerLabel && (
          <div className="absolute top-6 right-6 z-20">
            <span className="font-bold tracking-[0.2em] text-xs uppercase" style={{ color: headerColor }}>{headerLabel}</span>
          </div>
        )}

        <div className="absolute inset-0 p-8 pt-20 flex flex-col justify-end z-10">
          <div className="mb-4">
            <h1 className="f1-text text-4xl md:text-5xl tracking-tighter mb-1">{getLocationName(race.raceName).toUpperCase()}</h1>
            <p className="text-sm" style={{ color: '#a1a1aa' }}>{circuitName}</p>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex gap-6 items-start">
              {/* Race Date */}
              <div className="border-l-2 pl-3" style={{ borderColor: '#52525b' }}>
                <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#a1a1aa' }}>Race Date</span>
                <span className="text-xl font-mono font-bold" style={{ color: '#e2e8f0' }}>
                  {raceDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="block text-[9px] font-bold uppercase" style={{ color: 'transparent' }}>—</span>
              </div>

              {isCancelled ? null : isOngoing ? (
                <div className="flex items-center gap-2 pt-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-sm uppercase font-bold tracking-wider animate-pulse" style={{ color: '#ef4444' }}>Race Ongoing</span>
                </div>
              ) : !isCompleted ? (
                <>
                  <div className="border-l-2 pl-3" style={{ borderColor: '#dc2626' }}>
                    <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#a1a1aa' }}>Your Time</span>
                    <span className="text-xl font-mono font-bold" style={{ color: '#e2e8f0' }}>{userTime}</span>
                    <span className="block text-[9px] font-bold uppercase" style={{ color: '#71717a' }}>{userTimezone}</span>
                  </div>
                  <div className="border-l-2 pl-3" style={{ borderColor: '#52525b' }}>
                    <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#a1a1aa' }}>Track Time</span>
                    <span className="text-xl font-mono font-bold" style={{ color: '#a1a1aa' }}>{trackTimeStr}</span>
                    <span className="block text-[9px] font-bold uppercase" style={{ color: 'transparent' }}>—</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Right side */}
            {isCancelled ? (
              <div className="flex flex-col items-center justify-center">
                <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(113, 113, 122, 0.2)', color: '#71717a', border: '1px solid rgba(113, 113, 122, 0.4)' }}>
                  Cancelled
                </span>
              </div>
            ) : isCompleted ? (
              <div className="flex flex-col items-center justify-center">
                <div className="text-sm uppercase font-bold tracking-wider mb-1" style={{ color: '#22c55e' }}>Race Complete</div>
                <div className="text-[11px] uppercase font-bold tracking-wider cursor-pointer hover:text-red-400 transition" style={{ color: '#ef4444' }}>
                  View Race Results →
                </div>
              </div>
            ) : isOngoing ? (
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: '#a1a1aa' }}>Live</div>
                <div className="text-4xl font-mono font-bold animate-pulse" style={{ color: '#ef4444' }}>LIVE</div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: '#a1a1aa' }}>Race Starts In</div>
                <div id="countdown-timer" className="flex justify-end gap-1 font-mono font-bold tabular-nums" style={{ color: '#ffffff' }}>
                  <div className="flex flex-col items-center">
                    <span className="text-xl">{countdown.days}</span>
                    <span className="text-[9px] uppercase font-bold" style={{ color: '#a1a1aa' }}>Days</span>
                  </div>
                  <span className="text-xl" style={{ color: '#a1a1aa' }}>:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xl">{countdown.hours}</span>
                    <span className="text-[9px] uppercase font-bold" style={{ color: '#a1a1aa' }}>Hrs</span>
                  </div>
                  <span className="text-xl" style={{ color: '#a1a1aa' }}>:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xl">{countdown.mins}</span>
                    <span className="text-[9px] uppercase font-bold" style={{ color: '#a1a1aa' }}>Mins</span>
                  </div>
                  <span className="text-xl" style={{ color: '#a1a1aa' }}>:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-xl" style={{ color: '#ef4444' }}>{countdown.secs}</span>
                    <span className="text-[9px] uppercase font-bold" style={{ color: '#a1a1aa' }}>Secs</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RACE CALENDAR
  // ============================================================

  function renderRaceCalendar() {
    const today = new Date();

    const finishedBadge = (
      <div className="flex flex-col items-center gap-1">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="5" height="5" fill="#22c55e" />
          <rect x="7" y="3" width="5" height="5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.5" />
          <rect x="12" y="3" width="5" height="5" fill="#22c55e" />
          <rect x="2" y="8" width="5" height="5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.5" />
          <rect x="7" y="8" width="5" height="5" fill="#22c55e" />
          <rect x="12" y="8" width="5" height="5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.5" />
          <rect x="2" y="13" width="5" height="5" fill="#22c55e" />
          <rect x="7" y="13" width="5" height="5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.5" />
          <rect x="12" y="13" width="5" height="5" fill="#22c55e" />
          <rect x="19" y="3" width="2" height="18" fill="#a1a1aa" />
        </svg>
        <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>Finished</span>
      </div>
    );

    const upcomingBadge = (
      <div className="flex flex-col items-center gap-1">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="13" r="8" stroke="#71717a" strokeWidth="2" />
          <path d="M12 9V13L15 15" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 2H15" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 2V4" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
          <path d="M18.5 5.5L17 7" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(113, 113, 122, 0.2)', color: '#e2e8f0', border: '1px solid rgba(113, 113, 122, 0.4)' }}>Upcoming</span>
      </div>
    );

    const cancelledBadge = (
      <div className="flex flex-col items-center gap-1">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(113, 113, 122, 0.2)', color: '#71717a', border: '1px solid rgba(113, 113, 122, 0.3)' }}>Cancelled</span>
      </div>
    );

    return (
      <div className="p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 py-2 z-10" style={{ color: '#a1a1aa', backgroundColor: '#18181b' }}>
          {selectedYear} Season Calendar
        </h3>
        <div className="space-y-1">
          {races.map((r, index) => {
            const rDate = new Date(r.date);
            const isPast = rDate < today;
            const isSelected = index === selectedRaceIndex;
            const circuitName = (r.Circuit?.circuitName && r.Circuit.circuitName !== 'Unknown Circuit')
              ? r.Circuit.circuitName
              : r.raceName.replace(' Grand Prix', ' Circuit');

            return (
              <div
                key={index}
                onClick={() => setSelectedRaceIndex(index)}
                className="flex items-stretch rounded border transition hover:border-red-600/50 cursor-pointer overflow-hidden"
                style={{
                  backgroundColor: isSelected ? 'rgba(127, 29, 29, 0.3)' : '#18181b',
                  borderColor: isSelected ? '#dc2626' : '#27272a',
                  opacity: (isPast || r.cancelled) && !isSelected ? 0.6 : 1,
                }}
              >
                {r.Sprint && (
                  <div className="w-5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#dc2626' }}>
                    <span className="text-[8px] text-white font-bold uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Sprint</span>
                  </div>
                )}
                <div className="flex items-center justify-between flex-grow p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center w-12">
                      <span className="block text-xs font-bold uppercase" style={{ color: '#a1a1aa' }}>
                        {rDate.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="block text-lg font-bold" style={{ color: '#e2e8f0' }}>{rDate.getDate()}</span>
                    </div>
                    <div>
                      <div className="f1-text text-sm">{getLocationName(r.raceName)}</div>
                      <div className="text-[10px] uppercase font-bold" style={{ color: '#a1a1aa' }}>{circuitName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.cancelled ? cancelledBadge : isPast ? finishedBadge : upcomingBadge}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================
  // RESULTS VIEW
  // ============================================================

  function renderResultsView() {
    if (resultsLoading) {
      return (
        <div className="p-20 text-center">
          <div className="loader mx-auto mb-4"></div>
          <span style={{ color: '#a1a1aa' }} className="text-sm">Loading {selectedYear} Results...</span>
        </div>
      );
    }
    if (resultsError) {
      return <div className="p-10 text-center" style={{ color: '#ef4444' }}>Error loading results.</div>;
    }
    if (resultsRaces.length === 0) {
      return (
        <div className="flex items-center justify-center h-full p-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#e2e8f0' }}>No Results Yet</h2>
            <p style={{ color: '#a1a1aa' }}>Race results for {selectedYear} will appear here once races are completed.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>{selectedYear} Race Results</h2>
          <span className="text-sm font-bold" style={{ color: '#a1a1aa' }}>{resultsRaces.length}/{races.length} Races Completed</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resultsRaces.map((race, index) => {
            const results = race.Results || [];
            const podium = results.slice(0, 3);
            const fastestLapDriver = results.find((r: any) => r.FastestLap && r.FastestLap.rank === '1');
            const fastestLapTime = fastestLapDriver?.FastestLap?.Time?.time || '—';
            const fastestLapName = fastestLapDriver
              ? `${fastestLapDriver.Driver.givenName} ${fastestLapDriver.Driver.familyName}`
              : '—';
            const fastestLapPosition = fastestLapDriver ? parseInt(fastestLapDriver.position) : 99;
            const locationName = getLocationName(race.raceName);
            const circuitName = race.Circuit?.circuitName || 'Unknown Circuit';
            const totalLaps = results[0]?.laps || '—';
            const hasSprint = !!race.Sprint;

            return (
              <div key={index} className="result-card rounded-xl overflow-hidden transition-all duration-300" style={{ backgroundColor: '#1a1a1f', border: '2px solid #dc2626' }}>
                {/* Header */}
                <div className="flex justify-between items-start p-4 pb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#27272a', color: '#a1a1aa' }}>R{race.round}</span>
                      <h3 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{locationName.toUpperCase()}</h3>
                    </div>
                    <p className="text-xs" style={{ color: '#71717a' }}>{circuitName}</p>
                    {hasSprint && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block" style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>SPRINT</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <a href={`/race?season=${selectedYear}&round=${race.round}`} className="text-[10px] font-bold uppercase tracking-wide hover:underline cursor-pointer whitespace-nowrap" style={{ color: '#dc2626' }}>
                      Full Result →
                    </a>
                    <div className="mt-1">
                      <span className="text-xs font-bold" style={{ color: '#a1a1aa' }}>LAPS</span>
                      <div className="text-lg font-mono font-bold" style={{ color: '#e2e8f0' }}>{totalLaps}</div>
                    </div>
                  </div>
                </div>

                {/* Podium */}
                <div className="px-4 py-3">
                  <div className="flex justify-center items-end gap-2">
                    <PodiumPosition driver={podium[1]} position={2} />
                    <PodiumPosition driver={podium[0]} position={1} />
                    <PodiumPosition driver={podium[2]} position={3} />
                  </div>
                </div>

                {/* Fastest Lap */}
                <div className="px-4 py-3 border-t" style={{ borderColor: '#27272a', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#a855f7' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-bold uppercase" style={{ color: '#a855f7' }}>Fastest Lap</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold" style={{ color: '#e2e8f0' }}>{fastestLapTime}</span>
                      <span className="text-xs block" style={{ color: '#a1a1aa' }}>
                        {fastestLapName}{' '}
                        {fastestLapDriver && (
                          <span className="font-bold" style={{ color: fastestLapPosition <= 10 ? '#22c55e' : '#71717a' }}>
                            {fastestLapPosition <= 10 ? '(+1)' : '(0)'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================
  // DRIVER STANDINGS
  // ============================================================

  function renderDriverStandings() {
    if (driverLoading) return <div className="flex justify-center py-20"><div className="loader"></div></div>;
    if (driverError) return <div className="p-4 text-center" style={{ color: '#f87171' }}>Error loading standings</div>;
    if (driverStandings.length === 0) return <div className="p-4 text-center" style={{ color: '#a1a1aa' }}>No standings data available for {selectedYear}.</div>;

    return (
      <div className="p-3 pt-0 pb-4 space-y-2">
        {driverStandings.map((d) => {
          const driverId = d.Driver.driverId;
          const teamData = d.Constructors[0] || { name: 'Unattached', constructorId: 'default' };
          const teamColor = getTeamColor(teamData);
          const teamKey = teamImageMap[teamData.constructorId] || 'Haas';
          const circleImgUrl = `/img/helmets/${teamKey}V2Fix.png`;
          const largeImgUrl = `/img/drivers/generic${teamKey}.png`;
          const photoOffset = photoOffsets[driverId] || '0px';
          const isOpen = openDriverId === driverId;

          const posChange = d.positionChange || 0;
          let driverChevron;
          if (posChange > 0) {
            driverChevron = (
              <div className="flex flex-col items-center" style={{ color: '#22c55e' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-[9px] font-bold">{posChange}</span>
              </div>
            );
          } else if (posChange < 0) {
            driverChevron = (
              <div className="flex flex-col items-center" style={{ color: '#ef4444' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-[9px] font-bold">{Math.abs(posChange)}</span>
              </div>
            );
          } else {
            driverChevron = <div className="flex flex-col items-center" style={{ color: '#a1a1aa' }}><span className="text-[10px] font-bold">—</span></div>;
          }

          let positionTextColor = '#a1a1aa';
          let positionBgStyle: React.CSSProperties = { backgroundColor: '#27272a' };
          if (d.position === '1') { positionTextColor = '#facc15'; positionBgStyle = { backgroundColor: 'rgba(250, 204, 21, 0.2)' }; }
          else if (d.position === '2') { positionTextColor = '#d1d5db'; positionBgStyle = { backgroundColor: 'rgba(156, 163, 175, 0.2)' }; }
          else if (d.position === '3') { positionTextColor = '#d97706'; positionBgStyle = { backgroundColor: 'rgba(217, 119, 6, 0.2)' }; }

          return (
            <div key={driverId} className="driver-card rounded-lg overflow-hidden border hover:border-zinc-600 transition-all duration-300" style={{ backgroundColor: '#1a1a1f', borderColor: '#27272a' }}>
              {/* Collapsed Header */}
              <button
                onClick={() => setOpenDriverId(isOpen ? null : driverId)}
                className="w-full flex items-center gap-3 p-3 text-left group"
                style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <div className="w-5 flex-shrink-0 flex justify-center">{driverChevron}</div>
                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={positionBgStyle}>
                  <span className="text-sm font-bold" style={{ color: positionTextColor }}>{d.position}</span>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${teamColor}` }}>
                  <img src={circleImgUrl} className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).src = defaultDriverImage; }} alt={d.Driver.familyName} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="f1-text text-sm">
                      {d.Driver.givenName} <span className="uppercase">{d.Driver.familyName}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={getTeamUrl(teamData.constructorId)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] uppercase font-semibold tracking-wide transition"
                      style={{ color: '#a1a1aa' }}
                      onMouseOver={(e) => { (e.target as HTMLElement).style.color = '#ef4444'; }}
                      onMouseOut={(e) => { (e.target as HTMLElement).style.color = '#a1a1aa'; }}
                    >
                      {teamData.name}
                    </a>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: teamColor, color: 'white' }}>
                      {d.Driver.code || ''}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 min-w-[50px]">
                  <span className="text-base font-bold" style={{ color: '#ffffff' }}>{d.points}</span>
                  <span className="text-[8px] block uppercase font-semibold" style={{ color: '#a1a1aa' }}>PTS</span>
                </div>
                <div
                  id={`chevron-${driverId}`}
                  className="expand-arrow w-5 flex-shrink-0"
                  style={{ color: '#52525b', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Panel */}
              {isOpen && (
                <div id={`panel-${driverId}`} className="accordion-content overflow-hidden">
                  <div className="relative" style={{ background: `linear-gradient(135deg, ${teamColor}22, transparent 60%)` }}>
                    <div className="absolute left-3 top-3 z-20">
                      <FlagImg nationality={d.Driver.nationality} size="large" />
                    </div>
                    <div className="absolute right-2 top-4 text-[100px] font-black select-none leading-none z-0" style={{ color: teamColor, opacity: 0.15 }}>
                      {d.Driver.permanentNumber || ''}
                    </div>
                    <div className="h-72 w-full relative overflow-hidden">
                      <div className="absolute inset-x-0 bottom-0 h-32 z-10" style={{ background: 'linear-gradient(to top, #1a1a1f, transparent)' }}></div>
                      <img
                        src={largeImgUrl}
                        className="w-full h-full object-cover object-top z-0"
                        style={{ objectPosition: `center ${photoOffset}` }}
                        onError={(e) => { (e.target as HTMLImageElement).src = defaultDriverImage; }}
                        alt={d.Driver.familyName}
                      />
                    </div>
                    <div className="relative z-20 p-4 -mt-16">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid #3f3f46' }}>
                          <span className="block text-[9px] uppercase font-bold" style={{ color: '#71717a' }}>Wins</span>
                          <span className="font-mono text-sm font-bold" style={{ color: '#ffffff' }}>{d.wins}</span>
                        </div>
                        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', border: '1px solid #3f3f46' }}>
                          <span className="block text-[9px] uppercase font-bold" style={{ color: '#71717a' }}>Podiums</span>
                          <span className="font-mono text-sm font-bold" style={{ color: '#ffffff' }}>{d.podiums || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // CONSTRUCTOR STANDINGS
  // ============================================================

  function renderConstructorStandings() {
    if (constructorLoading) return <div className="flex justify-center py-8"><div className="loader"></div></div>;
    if (constructorError) return <div className="text-xs p-3" style={{ color: '#f87171' }}>Error loading</div>;
    if (constructorStandings.length === 0) return <div className="text-xs p-3" style={{ color: '#a1a1aa' }}>No data available for {selectedYear}</div>;

    return (
      <div className="p-3 pb-4 space-y-2">
        {constructorStandings.map((c, index) => {
          const teamColor = getTeamColor(c.Constructor);
          const constructorId = c.Constructor.constructorId;
          const posChange = c.positionChange || 0;

          let chevron;
          if (posChange > 0) {
            chevron = (
              <div className="flex flex-col items-center" style={{ color: '#22c55e' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-[9px] font-bold">{posChange}</span>
              </div>
            );
          } else if (posChange < 0) {
            chevron = (
              <div className="flex flex-col items-center" style={{ color: '#ef4444' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-[9px] font-bold">{Math.abs(posChange)}</span>
              </div>
            );
          } else {
            chevron = <div className="flex flex-col items-center" style={{ color: '#a1a1aa' }}><span className="text-[10px] font-bold">—</span></div>;
          }

          let positionTextColor = '#a1a1aa';
          let positionBgStyle: React.CSSProperties = { backgroundColor: '#27272a' };
          if (index === 0) { positionTextColor = '#facc15'; positionBgStyle = { backgroundColor: 'rgba(250, 204, 21, 0.2)' }; }
          else if (index === 1) { positionTextColor = '#d1d5db'; positionBgStyle = { backgroundColor: 'rgba(156, 163, 175, 0.2)' }; }
          else if (index === 2) { positionTextColor = '#d97706'; positionBgStyle = { backgroundColor: 'rgba(217, 119, 6, 0.2)' }; }

          return (
            <div key={constructorId} className="constructor-card rounded-lg overflow-hidden border transition-all duration-300" style={{ backgroundColor: '#1a1a1f', borderColor: '#27272a' }}>
              <div className="flex items-center gap-2 p-3">
                <div className="w-5 flex-shrink-0 flex justify-center">{chevron}</div>
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={positionBgStyle}>
                  <span className="text-xs font-bold" style={{ color: positionTextColor }}>{c.position}</span>
                </div>
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }}></div>
                <div className="flex-grow min-w-0">
                  <a href={getTeamUrl(constructorId)} className="block">
                    <div className="flex items-center justify-center py-1.5 rounded-md hover:opacity-80 transition" style={{ backgroundColor: teamColor, width: '120px' }}>
                      <span className="text-[10px] font-bold uppercase tracking-wide truncate px-2" style={{ color: 'white' }}>{c.Constructor.name}</span>
                    </div>
                  </a>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: '#ffffff' }}>{c.points}</span>
                  <span className="text-[8px] block uppercase font-semibold" style={{ color: '#a1a1aa' }}>PTS</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  const years = Array.from({ length: CURRENT_YEAR - 2018 + 1 }, (_, i) => CURRENT_YEAR - i);

  return (
    <div className="container mx-auto mt-6 px-4 flex-grow pb-6">
      <WelcomeNotification />
      <div className="flex flex-col md:flex-row gap-4">

        {/* ── LEFT COLUMN: Constructor Standings + News ── */}
        <div className="hidden md:flex flex-col w-full md:w-80 flex-shrink-0 gap-4">

          {/* Constructor Standings Panel */}
          <div className="constructor-panel flex-col z-20 rounded-xl" style={{ backgroundColor: '#15151a', border: '1px solid #3f3f46' }}>
            <div id="constructor-container" className="p-0 relative">
              <div className="z-20 constructor-header px-3 pt-3 pb-2 flex justify-between items-center h-[52px] rounded-t-xl" style={{ backgroundColor: '#15151a' }}>
                <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#e2e8f0' }}>Constructors</h3>
              </div>
              <div id="team-leaders">
                {renderConstructorStandings()}
              </div>
            </div>
          </div>

          {/* Ad Placeholder */}
          <div style={{ height: '250px' }} />

          {/* Recent News Panel */}
          <div className="news-panel flex-col z-20">
            <div className="px-1 pb-3 flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#e2e8f0' }}>Recent News</h3>
              <a href="/news" className="text-[10px] font-bold uppercase tracking-wide hover:underline" style={{ color: '#dc2626' }}>View All →</a>
            </div>
            <NewsCarousel layout="sidebar" limit={10} />
          </div>

        </div>

        {/* ── CENTER PANEL: Schedule & Results ── */}
        <div className="flex-1 flex flex-col relative z-10 min-w-0 center-panel rounded-xl" style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}>

          {/* Tab Switcher */}
          <div className="z-20 px-6 pt-4 pb-3 flex justify-center" style={{ backgroundColor: '#18181b', borderRadius: '12px 12px 0 0' }}>
            <div id="center-tab-bar" className="relative flex rounded-lg overflow-hidden" style={{ backgroundColor: '#27272a' }}>
              <div
                id="tab-slider"
                className="absolute top-0 left-0 h-full w-1/2 rounded-lg transition-transform duration-300 ease-out"
                style={{ backgroundColor: '#dc2626', transform: currentCenterTab === 'schedule' ? 'translateX(0)' : 'translateX(100%)' }}
              ></div>
              <button
                id="tab-schedule"
                onClick={() => switchCenterTab('schedule')}
                className="relative z-10 px-16 py-2 text-sm font-bold uppercase tracking-wider transition-colors duration-300"
                style={{ color: currentCenterTab === 'schedule' ? '#ffffff' : '#a1a1aa' }}
              >
                Schedule
              </button>
              <button
                id="tab-results"
                onClick={() => switchCenterTab('results')}
                className="relative z-10 px-16 py-2 text-sm font-bold uppercase tracking-wider transition-colors duration-300"
                style={{ color: currentCenterTab === 'results' ? '#ffffff' : '#a1a1aa' }}
              >
                Results
              </button>
            </div>
          </div>

          {/* Center Display */}
          <div id="center-display" className="p-0 flex flex-col">
            {currentCenterTab === 'schedule' ? (
              scheduleLoading ? (
                <div className="p-20 text-center">
                  <div className="loader mx-auto mb-4"></div>
                  <span className="text-sm" style={{ color: '#a1a1aa' }}>Loading Season Data...</span>
                </div>
              ) : scheduleError ? (
                <div className="p-10 text-center text-red-500">Error loading schedule.</div>
              ) : (
                <>
                  {renderHeroCard()}
                  {renderRaceCalendar()}
                </>
              )
            ) : (
              renderResultsView()
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Driver Standings + Forum ── */}
        <div className="hidden md:flex flex-col w-full md:w-[400px] flex-shrink-0 gap-4">

          {/* Driver Standings Panel */}
          <div className="driver-standings-panel flex flex-col z-30 shadow-2xl rounded-xl" style={{ backgroundColor: '#15151a', border: '1px solid #3f3f46', height: '780px' }}>
            {/* Header */}
            <div className="driver-standings-header px-3 pt-3 pb-2 flex justify-between items-center h-[52px]" style={{ backgroundColor: '#15151a', borderRadius: '12px 12px 0 0' }}>
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#e2e8f0' }}>Driver Standings</h2>

              {/* Custom Year Dropdown */}
              <div className="relative" id="year-dropdown-container" ref={yearDropdownRef}>
                <button
                  type="button"
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  id="year-dropdown-btn"
                  style={{
                    backgroundColor: '#000000', color: '#ffffff', border: '1px solid #3f3f46',
                    fontSize: '10px', fontWeight: 'bold', padding: '4px 20px 4px 8px',
                    borderRadius: '4px', textTransform: 'uppercase', cursor: 'pointer',
                    minWidth: '60px', textAlign: 'left', position: 'relative',
                  }}
                >
                  <span id="selected-year">{selectedYear}</span>
                  <svg
                    className="w-3 h-3 absolute right-1 top-1/2 transition-transform"
                    style={{ transform: yearDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0deg)', top: '50%' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {yearDropdownOpen && (
                  <div
                    id="year-dropdown-list"
                    className="absolute right-0 mt-1 rounded overflow-hidden z-50"
                    style={{ backgroundColor: '#000000', border: '1px solid #3f3f46', maxHeight: '130px', overflowY: 'auto', minWidth: '60px' }}
                  >
                    {years.map((y) => (
                      <div
                        key={y}
                        className="year-option px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer transition-colors hover:bg-red-600"
                        style={{ color: '#ffffff' }}
                        onClick={() => selectYear(y)}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hidden select for compatibility */}
              <select id="season-select" className="hidden" value={selectedYear} onChange={(e) => selectYear(parseInt(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Driver list */}
            <div id="accordion-container" className="flex-grow overflow-y-auto custom-scroll p-0 relative">
              {renderDriverStandings()}
            </div>
          </div>

          {/* Ad Placeholder */}
          <div style={{ height: '250px' }} />

          {/* Recent Forum Panel */}
          <div className="forum-panel flex-col z-20 rounded-xl" style={{ backgroundColor: '#15151a', border: '1px solid #3f3f46' }}>
            <div className="px-3 pt-3 pb-2 flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#e2e8f0' }}>Recent Activity</h3>
              <a href="/forum" className="text-[10px] font-bold uppercase tracking-wide hover:underline" style={{ color: '#dc2626' }}>View Forum →</a>
            </div>
            <div id="forum-container" className="p-3 pt-0 flex flex-col gap-1.5">
              {recentThreads.length > 0 ? recentThreads.map((t: any) => {
                const activityDate = t.lastReplyAt || t.createdAt;
                const ago = timeAgo(activityDate);
                const name = t.user?.displayName || t.user?.username || 'Unknown';
                return (
                  <a
                    key={t.id}
                    href={`/forum/${t.id}`}
                    className="block rounded-lg px-3 py-2 transition-colors hover:bg-white/5 no-underline"
                    style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}
                  >
                    <div className="text-sm font-bold truncate" style={{ color: '#e2e8f0' }}>{t.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: '#71717a' }}>
                      {name} · {t.repliesCount} {t.repliesCount === 1 ? 'reply' : 'replies'} · {ago}
                    </div>
                  </a>
                );
              }) : (
                <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#1a1a1f', border: '1px solid #27272a' }}>
                  <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#3f3f46' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <p className="text-xs font-medium" style={{ color: '#71717a' }}>No current posts</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
