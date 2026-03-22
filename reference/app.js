// js/app.js

// API Base URL - router.php handles routing to local database vs external Ergast API
const API_BASE = 'http://f1stats.local/api/';

let currentView = 'standings';
let currentCenterTab = 'schedule';  // 'schedule' or 'results'
let countdownInterval;

// Circuit timezone offsets (hours from UTC) - not available from any API
const circuitTimezones = {
    'albert_park': 11,      // Melbourne, Australia (AEDT)
    'bahrain': 3,           // Sakhir, Bahrain
    'jeddah': 3,            // Jeddah, Saudi Arabia
    'suzuka': 9,            // Suzuka, Japan
    'shanghai': 8,          // Shanghai, China
    'miami': -4,            // Miami, USA (EDT)
    'imola': 2,             // Imola, Italy (CEST)
    'monaco': 2,            // Monaco (CEST)
    'villeneuve': -4,       // Montreal, Canada (EDT)
    'catalunya': 2,         // Barcelona, Spain (CEST)
    'red_bull_ring': 2,     // Spielberg, Austria (CEST)
    'silverstone': 1,       // Silverstone, UK (BST)
    'hungaroring': 2,       // Budapest, Hungary (CEST)
    'spa': 2,               // Spa, Belgium (CEST)
    'zandvoort': 2,         // Zandvoort, Netherlands (CEST)
    'monza': 2,             // Monza, Italy (CEST)
    'baku': 4,              // Baku, Azerbaijan
    'marina_bay': 8,        // Singapore
    'americas': -5,         // Austin, USA (CDT)
    'rodriguez': -6,        // Mexico City (CST)
    'interlagos': -3,       // SÃ£o Paulo, Brazil
    'vegas': -8,            // Las Vegas, USA (PST)
    'losail': 3,            // Lusail, Qatar
    'yas_marina': 4,        // Abu Dhabi, UAE
    'madring': 2,           // Madrid, Spain (CEST)
};

// Circuit timezone abbreviations
const circuitTimezoneAbbr = {
    'albert_park': 'AEDT',
    'bahrain': 'AST',
    'jeddah': 'AST',
    'suzuka': 'JST',
    'shanghai': 'CST',
    'miami': 'EDT',
    'imola': 'CEST',
    'monaco': 'CEST',
    'villeneuve': 'EDT',
    'catalunya': 'CEST',
    'red_bull_ring': 'CEST',
    'silverstone': 'BST',
    'hungaroring': 'CEST',
    'spa': 'CEST',
    'zandvoort': 'CEST',
    'monza': 'CEST',
    'baku': 'AZT',
    'marina_bay': 'SGT',
    'americas': 'CDT',
    'rodriguez': 'CDT',
    'interlagos': 'BRT',
    'vegas': 'PST',
    'losail': 'AST',
    'yas_marina': 'GST',
    'madring': 'CEST',
};

// Helper function to get location name from race name (removes "Grand Prix" for legal reasons)
function getLocationName(raceName) {
    if (!raceName) return 'TBA';
    
    // Special mappings for races where simple replacement won't work
    const locationMap = {
        'Australian Grand Prix': 'Australia',
        'Austrian Grand Prix': 'Austria',
        'Azerbaijan Grand Prix': 'Azerbaijan',
        'Bahrain Grand Prix': 'Bahrain',
        'Belgian Grand Prix': 'Belgium',
        'Brazilian Grand Prix': 'Brazil',
        'British Grand Prix': 'Great Britain',
        'Canadian Grand Prix': 'Canada',
        'Chinese Grand Prix': 'China',
        'Dutch Grand Prix': 'Netherlands',
        'Emilia Romagna Grand Prix': 'Emilia Romagna',
        'Hungarian Grand Prix': 'Hungary',
        'Italian Grand Prix': 'Italy',
        'Japanese Grand Prix': 'Japan',
        'Mexican Grand Prix': 'Mexico',
        'Mexico City Grand Prix': 'Mexico City',
        'Monaco Grand Prix': 'Monaco',
        'Qatar Grand Prix': 'Qatar',
        'Saudi Arabian Grand Prix': 'Saudi Arabia',
        'Singapore Grand Prix': 'Singapore',
        'Spanish Grand Prix': 'Spain',
        'Barcelona Grand Prix': 'Barcelona',
        'United States Grand Prix': 'United States',
        'Abu Dhabi Grand Prix': 'Abu Dhabi',
        'Las Vegas Grand Prix': 'Las Vegas',
        'Miami Grand Prix': 'Miami',
        'Portuguese Grand Prix': 'Portugal',
        'Russian Grand Prix': 'Russia',
        'Turkish Grand Prix': 'Turkey',
        'Styrian Grand Prix': 'Styria',
        'Sakhir Grand Prix': 'Sakhir',
        '70th Anniversary Grand Prix': 'Silverstone',
        'Eifel Grand Prix': 'Eifel',
        'Tuscan Grand Prix': 'Tuscany',
        'Pre-Season Testing': 'Pre-Season',
        'Season Schedule TBA': 'TBA'
    };
    
    // Check for exact match first
    if (locationMap[raceName]) {
        return locationMap[raceName];
    }
    
    // Fallback: Remove "Grand Prix" suffix
    return raceName.replace(' Grand Prix', '').replace(' GP', '');
}

// Team colors for constructor styling (fallback if not in database)
const teamColorsFallback = {
    "red_bull": "#3671C6",
    "ferrari": "#E80020",
    "mclaren": "#FF8000",
    "mercedes": "#27F4D2",
    "aston_martin": "#229971",
    "alpine": "#eb58a5",
    "williams": "#64C4FF",
    "rb": "#6692FF",
    "sauber": "#52E252",
    "haas": "#B6BABD",
    "alphatauri": "#4E7C9B",
    "alfa": "#C92D4B",
    "racing_point": "#F596C8",
    "renault": "#FFF500",
    "toro_rosso": "#469BFF",
    "cadillac": "#C9A227",
    "audi": "#FF4D00",
    "default": "#FFFFFF"
};

// Helper function to get team color (from API or fallback)
function getTeamColor(constructor) {
    if (constructor && constructor.color) {
        return constructor.color;
    }
    if (constructor && constructor.constructorId) {
        return teamColorsFallback[constructor.constructorId] || teamColorsFallback['default'];
    }
    return teamColorsFallback['default'];
}

// Fallback driver image
const defaultDriverImage = "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/d/driver_fallback_image.png";

// Helper function to get team page URL
const getTeamUrl = (constructorId) => `/teams/${constructorId}`;

// Fallback circuit image
const defaultCircuitImage = "https://placehold.co/800x400/18181b/333?text=Track+Map";

document.addEventListener('DOMContentLoaded', () => {
    const seasonSelect = document.getElementById('season-select');
    if (seasonSelect) {
        fetchSchedule(seasonSelect.value);
        fetchDriverStandings(seasonSelect.value);
        fetchConstructorStandings(seasonSelect.value);
    }
});

function loadView(viewName) {
    currentView = viewName;
    const year = document.getElementById('season-select')?.value || '2025';
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event?.target?.classList?.add('active');
    
    // Show/hide center tab bar based on view
    const tabBar = document.getElementById('center-tab-bar');
    
    switch(viewName) {
        case 'standings':
            // Show tab bar and load based on current tab
            if (tabBar) tabBar.parentElement.style.display = 'flex';
            if (currentCenterTab === 'schedule') {
                fetchSchedule(year);
            } else {
                fetchResults(year);
            }
            break;
        case 'news':
        case 'live':
        case 'drivers':
        case 'stats':
        case 'forum':
            // Hide tab bar for other views
            if (tabBar) tabBar.parentElement.style.display = 'none';
            const container = document.getElementById('center-display');
            if (container) {
                container.innerHTML = `
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center">
                            <h2 class="text-2xl font-bold mb-2" style="color: #e2e8f0;">${viewName.charAt(0).toUpperCase() + viewName.slice(1)}</h2>
                            <p style="color: #a1a1aa;">Coming Soon</p>
                        </div>
                    </div>
                `;
            }
            break;
        default:
            if (tabBar) tabBar.parentElement.style.display = 'flex';
            if (currentCenterTab === 'schedule') {
                fetchSchedule(year);
            } else {
                fetchResults(year);
            }
    }
}

// Switch between Schedule and Results tabs in center panel
function switchCenterTab(tab) {
    currentCenterTab = tab;
    const year = document.getElementById('season-select')?.value || '2025';
    
    const slider = document.getElementById('tab-slider');
    const scheduleTab = document.getElementById('tab-schedule');
    const resultsTab = document.getElementById('tab-results');
    
    if (tab === 'schedule') {
        // Slide to left (Schedule)
        if (slider) slider.style.transform = 'translateX(0)';
        if (scheduleTab) scheduleTab.style.color = '#ffffff';
        if (resultsTab) resultsTab.style.color = '#a1a1aa';
        fetchSchedule(year);
    } else {
        // Slide to right (Results)
        if (slider) slider.style.transform = 'translateX(100%)';
        if (scheduleTab) scheduleTab.style.color = '#a1a1aa';
        if (resultsTab) resultsTab.style.color = '#ffffff';
        fetchResults(year);
    }
}

function changeSeason() {
    const year = document.getElementById('season-select').value;
    
    // Refresh center content based on current tab
    if (currentCenterTab === 'results') {
        fetchResults(year);
    } else {
        fetchSchedule(year);
    }
    
    // Always refresh standings panels
    fetchDriverStandings(year);
    fetchConstructorStandings(year);
}

// ============================================================
// MODULE 1: SCHEDULE & NEXT RACE
// ============================================================

let currentSeasonRaces = []; // Store races for click handling

async function fetchSchedule(year) {
    const container = document.getElementById('center-display');
    if(!container) return;

    // Check localStorage for cached next race (instant countdown start)
    const cachedRace = localStorage.getItem('nextRace');
    if (cachedRace) {
        const race = JSON.parse(cachedRace);
        // Only use cache if it's for the same year and race hasn't passed
        if (race.year == year && new Date(`${race.date}T${race.time}`) > new Date()) {
            startCountdown(race.date, race.time);
        }
    }

    // Check for cached full schedule (avoid API call if fresh)
    const cacheKey = `schedule_${year}`;
    const cachedSchedule = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    const cacheMaxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (cachedSchedule && cacheTime && (Date.now() - parseInt(cacheTime)) < cacheMaxAge) {
        // Use cached data
        const races = JSON.parse(cachedSchedule);
        const today = new Date();
        let nextRaceIndex = races.findIndex(r => new Date(`${r.date}T${r.time || '00:00:00Z'}`) >= today);
        if (nextRaceIndex === -1) nextRaceIndex = races.length - 1;
        
        currentSeasonRaces = races;
        renderScheduleView(container, races, nextRaceIndex, year);
        return; // Skip API call
    }

    container.innerHTML = '<div class="p-20 text-center"><div class="loader mx-auto"></div></div>';

    try {
        const res = await fetch(`${API_BASE}${year}`);
        const json = await res.json();

        let races = [];
        let nextRaceIndex = 0;

        if (!json.MRData || !json.MRData.RaceTable.Races || json.MRData.RaceTable.Races.length === 0) {
            // Fallback for empty seasons (future season with no schedule yet)
            const preSeasonDate = `${year}-03-01`;
            const preSeasonTime = "00:00:00Z";
            
            races = [{
                round: "0",
                raceName: "Season Schedule TBA",
                date: preSeasonDate,
                time: preSeasonTime,
                Circuit: { 
                    circuitId: "tba", 
                    circuitName: "To Be Announced",
                    timezoneOffset: 0,
                    mapImageUrl: null,
                    lapRecord: null
                }
            }];
        } else {
            races = json.MRData.RaceTable.Races;
            const today = new Date();
            
            // Find next upcoming race index
            nextRaceIndex = races.findIndex(r => new Date(`${r.date}T${r.time || '00:00:00Z'}`) >= today);
            
            // If no upcoming race found, show last race (season completed)
            if (nextRaceIndex === -1) {
                nextRaceIndex = races.length - 1;
            }
            
            // Cache the full schedule
            localStorage.setItem(cacheKey, JSON.stringify(races));
            localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
        
        // Store races globally for click handling
        currentSeasonRaces = races;
        
        // Cache the next race for instant countdown on reload
        if (races[nextRaceIndex]) {
            localStorage.setItem('nextRace', JSON.stringify({
                year: year,
                date: races[nextRaceIndex].date,
                time: races[nextRaceIndex].time || '00:00:00Z'
            }));
        }
        
        // Render the schedule view
        renderScheduleView(container, races, nextRaceIndex, year);

    } catch (e) {
        console.error('Schedule fetch error:', e);
        container.innerHTML = `<div class="p-10 text-center text-red-500">Error loading schedule.</div>`;
    }
}

function renderScheduleView(container, races, selectedIndex, year) {
    const selectedRace = races[selectedIndex];
    const today = new Date();
    const totalRaces = races.length;
    
    // Determine race status
    const raceDate = new Date(`${selectedRace.date}T${selectedRace.time || '00:00:00Z'}`);
    const isCompleted = raceDate < today;
    const isSeasonOpener = parseInt(selectedRace.round) === 1;
    const isSeasonFinale = parseInt(selectedRace.round) === totalRaces;
    
    // Build Hero Card
    let html = buildHeroCard(selectedRace, {
        isCompleted,
        isSeasonOpener,
        isSeasonFinale,
        totalRaces
    });

    // Build Season Calendar
    html += `<div class="p-6">
                <h3 class="text-xs font-bold uppercase tracking-widest mb-4 py-2 z-10" style="color: #a1a1aa; background-color: #18181b;">${year} Season Calendar</h3>
                <div class="space-y-1">`;
    
    // Larger checkered flag SVG with FINISHED badge for completed races
    const finishedBadge = `
        <div class="flex flex-col items-center gap-1">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="5" height="5" fill="#22c55e"/>
                <rect x="7" y="3" width="5" height="5" fill="#18181b" stroke="#3f3f46" stroke-width="0.5"/>
                <rect x="12" y="3" width="5" height="5" fill="#22c55e"/>
                <rect x="2" y="8" width="5" height="5" fill="#18181b" stroke="#3f3f46" stroke-width="0.5"/>
                <rect x="7" y="8" width="5" height="5" fill="#22c55e"/>
                <rect x="12" y="8" width="5" height="5" fill="#18181b" stroke="#3f3f46" stroke-width="0.5"/>
                <rect x="2" y="13" width="5" height="5" fill="#22c55e"/>
                <rect x="7" y="13" width="5" height="5" fill="#18181b" stroke="#3f3f46" stroke-width="0.5"/>
                <rect x="12" y="13" width="5" height="5" fill="#22c55e"/>
                <rect x="19" y="3" width="2" height="18" fill="#a1a1aa"/>
            </svg>
            <span class="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style="background-color: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3);">Finished</span>
        </div>`;
    
    // Stopwatch icon with UPCOMING badge for scheduled races
    const upcomingBadge = `
        <div class="flex flex-col items-center gap-1">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="13" r="8" stroke="#71717a" stroke-width="2"/>
                <path d="M12 9V13L15 15" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 2H15" stroke="#71717a" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 2V4" stroke="#71717a" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.5 5.5L17 7" stroke="#71717a" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style="background-color: rgba(113, 113, 122, 0.2); color: #e2e8f0; border: 1px solid rgba(113, 113, 122, 0.4);">Upcoming</span>
        </div>`;
    
    
    races.forEach((r, index) => {
        const rDate = new Date(r.date);
        const isPast = rDate < today;
        const isSelected = index === selectedIndex;
        const circuitName = (r.Circuit?.circuitName && r.Circuit.circuitName !== 'Unknown Circuit') 
            ? r.Circuit.circuitName 
            : r.raceName.replace(' Grand Prix', ' Circuit');
        
        html += `
            <div onclick="selectRace(${index})" 
                 class="flex items-stretch rounded border transition hover:border-red-600/50 cursor-pointer overflow-hidden"
                 style="background-color: ${isSelected ? 'rgba(127, 29, 29, 0.3)' : '#18181b'}; border-color: ${isSelected ? '#dc2626' : '#27272a'}; ${isPast && !isSelected ? 'opacity: 0.6;' : ''}">
                ${r.Sprint ? `
                <div class="w-5 flex items-center justify-center flex-shrink-0" style="background-color: #dc2626;">
                    <span class="text-[8px] text-white font-bold uppercase" style="writing-mode: vertical-rl; transform: rotate(180deg);">Sprint</span>
                </div>
                ` : ''}
                <div class="flex items-center justify-between flex-grow p-4">
                    <div class="flex items-center gap-4">
                        <div class="text-center w-12">
                            <span class="block text-xs font-bold uppercase" style="color: #a1a1aa;">${rDate.toLocaleString('default', { month: 'short' })}</span>
                            <span class="block text-lg font-bold" style="color: #e2e8f0;">${rDate.getDate()}</span>
                        </div>
                        <div>
                            <div class="f1-text text-sm">${getLocationName(r.raceName)}</div>
                            <div class="text-[10px] uppercase font-bold" style="color: #a1a1aa;">${circuitName}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${isPast ? finishedBadge : upcomingBadge}
                    </div>
                </div>
            </div>
        `;
    });
    html += `</div></div>`;
    container.innerHTML = html;
    
    // Re-apply dark theme to dynamically loaded content
    if (typeof applyDarkTheme === 'function') applyDarkTheme();

    // Start countdown only if race is upcoming
    if (!isCompleted) {
        startCountdown(selectedRace.date, selectedRace.time);
    } else {
        // Clear any existing countdown
        if (countdownInterval) clearInterval(countdownInterval);
    }
}

function selectRace(index) {
    const container = document.getElementById('center-display');
    const year = document.getElementById('season-select').value;
    if (container && currentSeasonRaces.length > 0) {
        renderScheduleView(container, currentSeasonRaces, index, year);
    }
}

function buildHeroCard(race, options = {}) {
    if (!race) return '';
    
    const { isCompleted, isSeasonOpener, isSeasonFinale, totalRaces } = options;
    const circuit = race.Circuit;
    
    // Get circuit data
    const circuitId = circuit.circuitId || circuit.circuit_id;
    const timezoneOffset = circuitTimezones[circuitId] ?? circuit.timezoneOffset ?? 0;
    const timezoneAbbr = circuitTimezoneAbbr[circuitId] ?? 'Local';
    const mapImage = circuit.mapImageUrl || circuit.Location?.mapImageUrl || defaultCircuitImage;
    const lapRecord = circuit.lapRecord;
    
    const circuitName = (circuit.circuitName && circuit.circuitName !== 'Unknown Circuit')
        ? circuit.circuitName
        : race.raceName.replace(' Grand Prix', ' Circuit');
    
    // Time Calculation
    const raceDateObj = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
    const userTime = raceDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const userTimezone = raceDateObj.toLocaleTimeString([], { timeZoneName: 'short' }).split(' ').pop();
    
    // Calculate track local time using UTC methods
    const trackDate = new Date(raceDateObj.getTime());
    trackDate.setUTCHours(trackDate.getUTCHours() + timezoneOffset);
    const trackHours = trackDate.getUTCHours().toString().padStart(2, '0');
    const trackMins = trackDate.getUTCMinutes().toString().padStart(2, '0');
    const trackTimeStr = `${trackHours}:${trackMins}`;
    
    // Header label
    let headerLabel = '';
    let headerStyle = 'color: #a1a1aa;';
    
    if (isSeasonOpener) {
        headerLabel = 'Season Opener';
        headerStyle = 'color: #22c55e;';
    } else if (isSeasonFinale) {
        headerLabel = 'Season Finale';
        headerStyle = 'color: #ef4444;';
    }

    // Determine if race is ongoing (within race day)
    const now = new Date();
    const raceEndEstimate = new Date(raceDateObj.getTime() + (3 * 60 * 60 * 1000)); // Race + 3 hours
    const isOngoing = now >= raceDateObj && now <= raceEndEstimate && !isCompleted;

    return `
    <div class="relative w-full h-80 border-b overflow-hidden flex-shrink-0 group" style="background-color: #18181b; border-color: #27272a;">
        <div class="absolute inset-0 opacity-20 group-hover:opacity-30 transition duration-700">
             <img src="${mapImage}" class="w-full h-full object-cover invert opacity-50" onerror="this.src='${defaultCircuitImage}'">
        </div>
        <div class="absolute inset-0" style="background: linear-gradient(to top, #18181b, rgba(24,24,27,0.5), transparent);"></div>

        <!-- Round Number - Top Left -->
        <div class="absolute top-6 left-6 z-20">
            <span class="block text-[10px] uppercase font-bold tracking-widest mb-1" style="color: #a1a1aa;">Round</span>
            <div class="flex items-baseline gap-2">
                <span class="text-4xl font-black" style="color: #ffffff;">${race.round || '—'}</span>
                <span class="text-sm uppercase font-bold tracking-wider" style="color: #a1a1aa;">/ ${totalRaces || '—'}</span>
            </div>
        </div>

        <!-- Season Opener/Finale Label - Top Right -->
        ${headerLabel ? `
        <div class="absolute top-6 right-6 z-20">
            <span class="font-bold tracking-[0.2em] text-xs uppercase" style="${headerStyle}">${headerLabel}</span>
        </div>
        ` : ''}

        <div class="absolute inset-0 p-8 pt-20 flex flex-col justify-end z-10">
            <!-- Race Name and Circuit -->
            <div class="mb-4">
                <h1 class="f1-text text-4xl md:text-5xl tracking-tighter mb-1">${getLocationName(race.raceName).toUpperCase()}</h1>
                <p class="text-sm" style="color: #a1a1aa;">${circuitName}</p>
            </div>
            
            <!-- Date/Time/Countdown Row - all aligned -->
            <div class="flex justify-between items-start">
                <div class="flex gap-6 items-start">
                    <div class="border-l-2 pl-3" style="border-color: #52525b;">
                        <span class="block text-[10px] font-bold uppercase tracking-wider mb-1" style="color: #a1a1aa;">Race Date</span>
                        <span class="text-xl font-mono font-bold" style="color: #e2e8f0;">${raceDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span class="block text-[9px] font-bold uppercase" style="color: transparent;">—</span>
                    </div>
                    ${isOngoing ? `
                    <div class="flex items-center gap-2 pt-3">
                        <span class="relative flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span class="text-sm uppercase font-bold tracking-wider animate-pulse" style="color: #ef4444;">Race Ongoing</span>
                    </div>
                    ` : !isCompleted ? `
                    <div class="border-l-2 pl-3" style="border-color: #dc2626;">
                        <span class="block text-[10px] font-bold uppercase tracking-wider mb-1" style="color: #a1a1aa;">Your Time</span>
                        <span class="text-xl font-mono font-bold" style="color: #e2e8f0;">${userTime}</span>
                        <span class="block text-[9px] font-bold uppercase" style="color: #71717a;">${userTimezone}</span>
                    </div>
                    <div class="border-l-2 pl-3" style="border-color: #52525b;">
                        <span class="block text-[10px] font-bold uppercase tracking-wider mb-1" style="color: #a1a1aa;">Track Time</span>
                        <span class="text-xl font-mono font-bold" style="color: #a1a1aa;">${trackTimeStr}</span>
                        <span class="block text-[9px] font-bold uppercase" style="color: transparent;">—</span>
                    </div>
                    ` : ''}
                </div>

                ${isCompleted ? `
                <div class="flex flex-col items-center justify-center">
                    <div class="text-sm uppercase font-bold tracking-wider mb-1" style="color: #22c55e;">Race Complete</div>
                    <div class="text-[11px] uppercase font-bold tracking-wider cursor-pointer hover:text-red-400 transition" style="color: #ef4444;">View Race Results →</div>
                </div>
                ` : isOngoing ? `
                <div class="text-right">
                    <div class="text-[10px] uppercase font-bold tracking-widest mb-1" style="color: #a1a1aa;">Live</div>
                    <div class="text-4xl font-mono font-bold animate-pulse" style="color: #ef4444;">LIVE</div>
                </div>
                ` : `
                <div class="text-right">
                    <div class="text-[10px] uppercase font-bold tracking-widest mb-1" style="color: #a1a1aa;">Race Starts In</div>
                    <div id="countdown-timer" class="flex justify-end gap-1 font-mono font-bold tabular-nums" style="color: #ffffff;">
                        <div class="flex flex-col items-center">
                            <span class="text-xl" data-unit="days">00</span>
                            <span class="text-[9px] uppercase font-bold" style="color: #a1a1aa;">Days</span>
                        </div>
                        <span class="text-xl" style="color: #a1a1aa;">:</span>
                        <div class="flex flex-col items-center">
                            <span class="text-xl" data-unit="hours">00</span>
                            <span class="text-[9px] uppercase font-bold" style="color: #a1a1aa;">Hrs</span>
                        </div>
                        <span class="text-xl" style="color: #a1a1aa;">:</span>
                        <div class="flex flex-col items-center">
                            <span class="text-xl" data-unit="mins">00</span>
                            <span class="text-[9px] uppercase font-bold" style="color: #a1a1aa;">Mins</span>
                        </div>
                        <span class="text-xl" style="color: #a1a1aa;">:</span>
                        <div class="flex flex-col items-center">
                            <span class="text-xl" data-unit="secs" style="color: #ef4444;">00</span>
                            <span class="text-[9px] uppercase font-bold" style="color: #a1a1aa;">Secs</span>
                        </div>
                    </div>
                </div>
                `}
            </div>
        </div>
    </div>
    `;
}

function startCountdown(dateStr, timeStr) {
    if (countdownInterval) clearInterval(countdownInterval);
    const raceTime = new Date(`${dateStr}T${timeStr || '00:00:00Z'}`);

    // Function to update the countdown display
    function updateCountdown() {
        const now = new Date();
        const diff = raceTime - now;

        if (diff <= 0) {
            const el = document.getElementById('countdown-timer');
            if (el) el.innerHTML = '<span class="text-xl font-bold" style="color: #ef4444;">RACE STARTED</span>';
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const container = document.getElementById('countdown-timer');
        if (container) {
            const daysEl = container.querySelector('[data-unit="days"]');
            const hoursEl = container.querySelector('[data-unit="hours"]');
            const minsEl = container.querySelector('[data-unit="mins"]');
            const secsEl = container.querySelector('[data-unit="secs"]');
            
            if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
            if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if (minsEl) minsEl.textContent = minutes.toString().padStart(2, '0');
            if (secsEl) secsEl.textContent = seconds.toString().padStart(2, '0');
        }
    }

    // Update immediately, then every second
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// ============================================================
// MODULE 2: DRIVER STANDINGS
// ============================================================

async function fetchDriverStandings(year) {
    const container = document.getElementById('accordion-container');
    if (!container) return;

    container.innerHTML = '<div class="p-10 text-center"><div class="loader mx-auto"></div></div>';

    try {
        let res = await fetch(`${API_BASE}${year}/driverStandings`);
        let json = await res.json();
        
        // Check for valid data - NO fallback to previous year
        if (!json.MRData || !json.MRData.StandingsTable.StandingsLists[0]) {
            container.innerHTML = `<div class="p-4 text-center" style="color: #a1a1aa;">No standings data available for ${year}.</div>`;
            return;
        }

        const drivers = json.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        
        // No preview banner - just show the data
        let html = '<div class="p-3 pt-0 pb-4 space-y-2">';

        // Team to generic image mapping - includes Cadillac and Audi
        const teamImageMap = {
            'alfa': 'Alfa',
            'alpine': 'Alpine',
            'aston_martin': 'Aston',
            'ferrari': 'Ferrari',
            'haas': 'Haas',
            'sauber': 'Kick',
            'mclaren': 'McLaren',
            'mercedes': 'Merc',
            'rb': 'RBF1',
            'alphatauri': 'RBF1',
            'red_bull': 'RedBull',
            'williams': 'Williams',
            'cadillac': 'Cadillac',
            'audi': 'Kick'
        };

        drivers.forEach((d) => {
            const driverId = d.Driver.driverId;
            const teamData = d.Constructors[0] || { name: "Unattached", constructorId: "default" };
            const teamColor = getTeamColor(teamData);
            
            // Get team-based generic images
            const teamKey = teamImageMap[teamData.constructorId] || 'RedBull';
            const circleImgUrl = `img/helmets/${teamKey}V2Fix.png`;
            const largeImgUrl = `img/drivers/Generic${teamKey}.png`;
            
            // Get flag image HTML
            const flagHtml = getFlagHtml(d.Driver.nationality, 'small');
            
            // Driver photo offset to avoid blocking number
            const photoOffsets = {
                'piastri': '-15px',
                'hamilton': '-15px',
                'albon': '-15px',
                'sainz': '-15px',
                'bearman': '-15px',
                'lawson': '-15px',
                'tsunoda': '-15px',
                'gasly': '-15px',
                'russell': '-15px',
                'leclerc': '-15px',
                'antonelli': '-15px',
                'hulkenberg': '-15px',
                'ocon': '-15px',
                'colapinto': '-20px',
                'hadjar': '10px'
            };
            const photoOffset = photoOffsets[driverId] || '0px';
            
            // Position styling for top 3 - using inline styles
            let positionStyle = 'color: #a1a1aa;';
            let positionBgStyle = 'background-color: #27272a;';
            if (d.position === '1') { 
                positionStyle = 'color: #facc15;'; // yellow-400
                positionBgStyle = 'background-color: rgba(250, 204, 21, 0.2);'; 
            } else if (d.position === '2') { 
                positionStyle = 'color: #d1d5db;'; // gray-300
                positionBgStyle = 'background-color: rgba(156, 163, 175, 0.2);'; 
            } else if (d.position === '3') { 
                positionStyle = 'color: #d97706;'; // amber-600
                positionBgStyle = 'background-color: rgba(217, 119, 6, 0.2);'; 
            }

            html += `
            <div class="driver-card rounded-lg overflow-hidden border hover:border-zinc-600 transition-all duration-300" style="background-color: #1a1a1f; border-color: #27272a;">
                <!-- Collapsed Card Header -->
                <button onclick="toggleDriver('${driverId}')" class="w-full flex items-center gap-3 p-3 text-left group" style="background-color: transparent; border: none; cursor: pointer;">
                    <!-- Position Badge -->
                    <div class="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style="${positionBgStyle}">
                        <span class="text-sm font-bold" style="${positionStyle}">${d.position}</span>
                    </div>
                    
                    <!-- Driver Mini Photo -->
                    <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style="border: 2px solid ${teamColor};">
                        <img src="${circleImgUrl}" class="w-full h-full object-cover object-top" onerror="this.src='${defaultDriverImage}'">
                    </div>
                    
                    <!-- Driver Info -->
                    <div class="flex-grow min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="f1-text text-sm">
                                ${d.Driver.givenName} <span class="uppercase">${d.Driver.familyName}</span>
                            </span>
                        </div>
                       <div class="flex items-center gap-2">
                            <a href="${getTeamUrl(teamData.constructorId)}" onclick="event.stopPropagation();" class="text-[10px] uppercase font-semibold tracking-wide transition" style="color: #a1a1aa;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#a1a1aa'">${teamData.name}</a>
                                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold" style="background-color: ${teamColor}; color: white;">${d.Driver.code || ''}</span>
                        </div>
                    </div>
                    
                    <!-- Points -->
                    <div class="text-right flex-shrink-0 min-w-[50px]">
                        <span class="text-base font-bold" style="color: #ffffff;">${d.points}</span>
                        <span class="text-[8px] block uppercase font-semibold" style="color: #a1a1aa;">PTS</span>
                    </div>
                    
                    <!-- Expand Arrow -->
                    <div id="chevron-${driverId}" class="expand-arrow w-5 flex-shrink-0 transition-transform duration-300" style="color: #52525b;">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </button>
                
                <!-- Expanded Content (Hidden by default) -->
                <div id="panel-${driverId}" class="accordion-content hidden overflow-hidden transition-all duration-300">
                    <div class="relative" style="background: linear-gradient(135deg, ${teamColor}22, transparent 60%);">
                        <!-- Nationality Flag - Upper Left -->
                        <div class="absolute left-3 top-3 z-20">
                            ${getFlagHtml(d.Driver.nationality, 'large')}
                        </div>
                        
                        <!-- Large Driver Number Background -->
                        <div class="absolute right-2 top-4 text-[100px] font-black select-none leading-none z-0" style="color: ${teamColor}; opacity: 0.15;">
                            ${d.Driver.permanentNumber || ''}
                        </div>
                        
                        <!-- Driver Image -->
                        <div class="h-72 w-full relative overflow-hidden">
                            <div class="absolute inset-x-0 bottom-0 h-32 z-10" style="background: linear-gradient(to top, #1a1a1f, transparent);"></div>
                            <img src="${largeImgUrl}" 
                                 class="w-full h-full object-cover object-top z-0"
                                 style="object-position: center ${photoOffset};"
                                 onerror="this.src='${defaultDriverImage}'">
                        </div>
                        
                        <!-- Stats Grid -->
                        <div class="relative z-20 p-4 -mt-16">
                            <div class="grid grid-cols-2 gap-2 text-center">
                                <div class="p-2 rounded" style="background-color: rgba(24, 24, 27, 0.9); border: 1px solid #3f3f46;">
                                    <span class="block text-[9px] uppercase font-bold" style="color: #71717a;">Wins</span>
                                    <span class="font-mono text-sm font-bold" style="color: #ffffff;">${d.wins}</span>
                                </div>
                                <div class="p-2 rounded" style="background-color: rgba(24, 24, 27, 0.9); border: 1px solid #3f3f46;">
                                    <span class="block text-[9px] uppercase font-bold" style="color: #71717a;">Podiums</span>
                                    <span class="font-mono text-sm font-bold" style="color: #ffffff;">${d.podiums || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Re-apply dark theme to dynamically loaded content
        if (typeof applyDarkTheme === 'function') applyDarkTheme();

    } catch (e) {
        console.error('Driver standings fetch error:', e);
        container.innerHTML = `<div class="p-4 text-center" style="color: #f87171;">Error loading standings</div>`;
    }
}

function toggleDriver(driverId) {
    const allPanels = document.querySelectorAll('.accordion-content');
    const allChevrons = document.querySelectorAll('[id^="chevron-"]');
    
    // Close all panels and reset chevrons
    allPanels.forEach(panel => {
        if (panel.id !== `panel-${driverId}`) {
            panel.classList.add('hidden');
        }
    });
    allChevrons.forEach(chevron => {
        if (chevron.id !== `chevron-${driverId}`) {
            chevron.classList.remove('rotate-180');
        }
    });
    
    const targetPanel = document.getElementById(`panel-${driverId}`);
    const targetChevron = document.getElementById(`chevron-${driverId}`);
    
    if (targetPanel) {
        const isHidden = targetPanel.classList.contains('hidden');
        targetPanel.classList.toggle('hidden');
        
        if (targetChevron) {
            targetChevron.classList.toggle('rotate-180', isHidden);
        }
        
        if (isHidden) {
            setTimeout(() => {
                targetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
}

// Flag image URL - uses local images (download with sync_flags.php first)
function getFlagUrl(nationality) {
    const countryCodeMap = {
        // Current & Recent Grid
        "Dutch": "nl",
        "British": "gb",
        "Monegasque": "mc",
        "Spanish": "es",
        "Mexican": "mx",
        "Australian": "au",
        "German": "de",
        "French": "fr",
        "Thai": "th",
        "Canadian": "ca",
        "Japanese": "jp",
        "Chinese": "cn",
        "American": "us",
        "Finnish": "fi",
        "Brazilian": "br",
        "Danish": "dk",
        "Italian": "it",
        "New Zealander": "nz",
        "Argentine": "ar",
        "Swiss": "ch",
        // Historic
        "Belgian": "be",
        "Austrian": "at",
        "Polish": "pl",
        "Russian": "ru",
        "Swedish": "se",
        "Indonesian": "id",
        "Indian": "in",
        "Venezuelan": "ve",
        "Colombian": "co",
        "South African": "za",
        "Portuguese": "pt",
        "Irish": "ie",
        "Hungarian": "hu",
        "Czech": "cz",
        "Malaysian": "my",
        "Estonian": "ee",
        "Uruguayan": "uy",
        "Chilean": "cl",
        "Moroccan": "ma",
        "Singaporean": "sg",
        "Korean": "kr",
        "Emirati": "ae",
        "Israeli": "il",
        "Turkish": "tr"
    };
    const code = countryCodeMap[nationality] || 'gb';
    // Use local flags - falls back to CDN if local not found
    return `img/flags/${code}.png`;
}

// Get flag HTML (image-based, works in all browsers including Edge)
function getFlagHtml(nationality, size = 'normal') {
    const url = getFlagUrl(nationality);
    const cdnFallback = `https://flagcdn.com/w80/${url.split('/').pop()}`;
    // Sizes: normal = 24x16px, large = 64x44px
    const sizeClass = size === 'large' ? 'w-16 h-11' : 'w-6 h-4';
    return `<img src="${url}" alt="${nationality}" class="${sizeClass} object-cover rounded shadow-lg" onerror="this.src='${cdnFallback}'">`; 
}

// ============================================================
// MODULE 3: CONSTRUCTOR STANDINGS (Left Panel)
// ============================================================

// Team logo URLs - using local files (download with sync_logos.php first)
function getTeamLogo(constructorId) {
    // Local path - logos should be downloaded to img/logos/
    return `img/logos/${constructorId}.png`;
}

async function fetchConstructorStandings(year) {
    const container = document.getElementById('team-leaders');
    if (!container) return;

    try {
        let res = await fetch(`${API_BASE}${year}/constructorStandings`);
        let json = await res.json();
        
        // Check for valid data - NO fallback to previous year
        if (!json.MRData || !json.MRData.StandingsTable.StandingsLists[0]) {
            container.innerHTML = `<div class="text-xs p-3" style="color: #a1a1aa;">No data available for ${year}</div>`;
            return;
        }

        const constructors = json.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
        
        // No preview banner - just show the data
        let html = '<div class="p-3 pb-4 space-y-2">';

        constructors.forEach((c, index) => {
            const teamColor = getTeamColor(c.Constructor);
            const constructorId = c.Constructor.constructorId;
            
            // Position change (from API if available)
            const posChange = c.positionChange || 0;
            
            // Position change chevron
            let chevronHtml = '';
            if (posChange > 0) {
                chevronHtml = `<div class="flex flex-col items-center" style="color: #22c55e;">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd"></path></svg>
                    <span class="text-[9px] font-bold">${posChange}</span>
                </div>`;
            } else if (posChange < 0) {
                chevronHtml = `<div class="flex flex-col items-center" style="color: #ef4444;">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    <span class="text-[9px] font-bold">${Math.abs(posChange)}</span>
                </div>`;
            } else {
                chevronHtml = `<div class="flex flex-col items-center" style="color: #a1a1aa;">
                    <span class="text-[10px] font-bold">—</span>
                </div>`;
            }
            
            // Position badge styling
            let positionStyle = 'color: #a1a1aa;';
            let positionBgStyle = 'background-color: #27272a;';
            if (index === 0) { 
                positionStyle = 'color: #facc15;';
                positionBgStyle = 'background-color: rgba(250, 204, 21, 0.2);'; 
            } else if (index === 1) { 
                positionStyle = 'color: #d1d5db;';
                positionBgStyle = 'background-color: rgba(156, 163, 175, 0.2);'; 
            } else if (index === 2) { 
                positionStyle = 'color: #d97706;';
                positionBgStyle = 'background-color: rgba(217, 119, 6, 0.2);'; 
            }
            
            html += `
                <div class="constructor-card rounded-lg overflow-hidden border transition-all duration-300" style="background-color: #1a1a1f; border-color: #27272a;">
                    <div class="flex items-center gap-2 p-3">
                        <!-- Position Change Chevron -->
                        <div class="w-5 flex-shrink-0 flex justify-center">
                            ${chevronHtml}
                        </div>
                        
                        <!-- Position Badge -->
                        <div class="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style="${positionBgStyle}">
                            <span class="text-xs font-bold" style="${positionStyle}">${c.position}</span>
                        </div>
                        
                        <!-- Team Color Bar -->
                        <div class="w-1 h-8 rounded-full flex-shrink-0" style="background-color: ${teamColor};"></div>
                        
                        <!-- Team Name Capsule -->
                        <div class="flex-grow min-w-0">
                            <a href="${getTeamUrl(constructorId)}" class="block">
                                <div class="flex items-center justify-center py-1.5 rounded-md hover:opacity-80 transition" style="background-color: ${teamColor}; width: 120px;">
                                    <span class="text-[10px] font-bold uppercase tracking-wide truncate px-2" style="color: white;">${c.Constructor.name}</span>
                                </div>
                            </a>
                        </div>
                        
                        <!-- Points -->
                        <div class="text-right flex-shrink-0">
                            <span class="text-sm font-bold" style="color: #ffffff;">${c.points}</span>
                            <span class="text-[8px] block uppercase font-semibold" style="color: #a1a1aa;">PTS</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Re-apply dark theme to dynamically loaded content
        if (typeof applyDarkTheme === 'function') applyDarkTheme();

    } catch (e) {
        console.error('Constructor standings fetch error:', e);
        container.innerHTML = `<div class="text-xs" style="color: #f87171;">Error loading</div>`;
    }
}

// Theme toggle
function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    
    if (html.getAttribute('data-theme') === 'light') {
        html.removeAttribute('data-theme');
        if (icon) icon.innerText = 'ðŸŒ™';
    } else {
        html.setAttribute('data-theme', 'light');
        if (icon) icon.innerText = '☀️';
    }
}

// ============================================================
// MODULE: RESULTS PAGE
// ============================================================

async function fetchResults(year) {
    const container = document.getElementById('center-display');
    if (!container) return;

    container.innerHTML = `
        <div class="p-20 text-center">
            <div class="loader mx-auto mb-4"></div>
            <span style="color: #a1a1aa;" class="text-sm">Loading ${year} Results...</span>
        </div>
    `;

    try {
        // Use local database API for results
        const res = await fetch(`${API_BASE}${year}/results`);
        const json = await res.json();
        
        if (!json.MRData || !json.MRData.RaceTable.Races || json.MRData.RaceTable.Races.length === 0) {
            container.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <h2 class="text-2xl font-bold mb-2" style="color: #e2e8f0;">No Results Yet</h2>
                        <p style="color: #a1a1aa;">Race results for ${year} will appear here once races are completed.</p>
                    </div>
                </div>
            `;
            return;
        }

        const races = json.MRData.RaceTable.Races;
        renderResultsView(container, races, year);

    } catch (e) {
        console.error('Results fetch error:', e);
        container.innerHTML = `
            <div class="p-10 text-center" style="color: #ef4444;">Error loading results.</div>
        `;
    }
}

function renderResultsView(container, races, year) {
    let html = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold" style="color: #e2e8f0;">${year} Race Results</h2>
                <span class="text-sm" style="color: #a1a1aa;">${races.length} Races Completed</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;

    races.forEach((race, index) => {
        const results = race.Results || [];
        const podium = results.slice(0, 3);
        
        // Find fastest lap
        const fastestLapDriver = results.find(r => r.FastestLap && r.FastestLap.rank === '1');
        const fastestLapTime = fastestLapDriver?.FastestLap?.Time?.time || '—';
        const fastestLapName = fastestLapDriver ? `${fastestLapDriver.Driver.givenName} ${fastestLapDriver.Driver.familyName}` : '—';
        
        // Check if fastest lap driver finished in top 10 (gets +1 point)
        let fastestLapPointHtml = '';
        if (fastestLapDriver) {
            const fastestLapPosition = parseInt(fastestLapDriver.position);
            if (fastestLapPosition <= 10) {
                fastestLapPointHtml = `<span class="font-bold" style="color: #22c55e;">(+1)</span>`;
            } else {
                fastestLapPointHtml = `<span class="font-bold" style="color: #71717a;">(0)</span>`;
            }
        }
        
        // Get race info
        const locationName = getLocationName(race.raceName);
        const circuitName = race.Circuit?.circuitName || 'Unknown Circuit';
        const totalLaps = results[0]?.laps || '—';
        const round = race.round;
        const hasSprint = race.Sprint ? true : false;
        
        // Sprint badge HTML
        const sprintBadge = hasSprint ? `<span class="text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block" style="background-color: #dc2626; color: #ffffff;">SPRINT</span>` : '';
        
        html += `
            <div class="result-card rounded-xl overflow-hidden transition-all duration-300" style="background-color: #1a1a1f; border: 2px solid #dc2626;">
                <!-- Card Header -->
                <div class="flex justify-between items-start p-4 pb-2">
                    <div class="flex-1 min-w-0 pr-2">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs font-bold px-2 py-0.5 rounded" style="background-color: #27272a; color: #a1a1aa;">R${round}</span>
                            <h3 class="text-lg font-bold" style="color: #e2e8f0;">${locationName.toUpperCase()}</h3>
                        </div>
                        <p class="text-xs" style="color: #71717a;">${circuitName}</p>
                        ${sprintBadge}
                    </div>
                    <div class="text-right flex-shrink-0">
                        <a href="race.php?season=${year}&round=${round}" class="text-[10px] font-bold uppercase tracking-wide hover:underline cursor-pointer whitespace-nowrap" style="color: #dc2626;">Full Result →</a>
                        <div class="mt-1">
                            <span class="text-xs font-bold" style="color: #a1a1aa;">LAPS</span>
                            <div class="text-lg font-mono font-bold" style="color: #e2e8f0;">${totalLaps}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Podium Section -->
                <div class="px-4 py-3">
                    <div class="flex justify-center items-end gap-2">
                        ${renderPodiumPosition(podium[1], 2)}
                        ${renderPodiumPosition(podium[0], 1)}
                        ${renderPodiumPosition(podium[2], 3)}
                    </div>
                </div>
                
                <!-- Fastest Lap Section -->
                <div class="px-4 py-3 border-t" style="border-color: #27272a; background-color: rgba(139, 92, 246, 0.05);">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4" style="color: #a855f7;" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                            </svg>
                            <span class="text-xs font-bold uppercase" style="color: #a855f7;">Fastest Lap</span>
                        </div>
                        <div class="text-right">
                            <span class="text-sm font-mono font-bold" style="color: #e2e8f0;">${fastestLapTime}</span>
                            <span class="text-xs block" style="color: #a1a1aa;">${fastestLapName} ${fastestLapPointHtml}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function renderPodiumPosition(driver, position) {
    if (!driver) {
        return `
            <div class="flex flex-col items-center" style="width: 100px;">
                <div class="w-full h-16 rounded-t-lg flex items-end justify-center pb-2" style="background-color: #27272a;">
                    <span class="text-2xl font-black" style="color: rgba(255,255,255,0.2);">${position}</span>
                </div>
                <div class="text-center mt-2">
                    <span class="text-xs" style="color: #71717a;">—</span>
                </div>
            </div>
        `;
    }
    
    const teamColor = getTeamColor(driver.Constructor);
    const driverCode = driver.Driver.code || driver.Driver.familyName.substring(0, 3).toUpperCase();
    const driverName = driver.Driver.familyName;
    const teamName = driver.Constructor.name;
    
    // Position styling
    let positionStyle = '';
    let height = 'h-16';
    
    if (position === 1) {
        positionStyle = 'background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);';
        height = 'h-20';
    } else if (position === 2) {
        positionStyle = 'background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);';
        height = 'h-16';
    } else if (position === 3) {
        positionStyle = 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);';
        height = 'h-14';
    }
    
    return `
        <div class="flex flex-col items-center" style="width: 100px;">
            <!-- Driver Code Badge -->
            <div class="px-3 py-1 rounded text-xs font-bold mb-2" style="background-color: ${teamColor}; color: white;">
                ${driverCode}
            </div>
            
            <!-- Podium Stand -->
            <div class="w-full ${height} rounded-t-lg flex items-end justify-center pb-2 relative" style="${positionStyle}">
                <span class="text-2xl font-black" style="color: rgba(0,0,0,0.3);">${position}</span>
            </div>
            
            <!-- Driver Name -->
            <div class="text-center mt-2 w-full">
                <span class="text-xs font-bold block truncate" style="color: #e2e8f0;">${driverName}</span>
                <span class="text-[10px]" style="color: #71717a;">${teamName}</span>
            </div>
        </div>
    `;
}
