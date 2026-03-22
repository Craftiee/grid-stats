<?php
session_start();

// Check authentication
if (!isset($_SESSION['f1stats_authenticated']) || $_SESSION['f1stats_authenticated'] !== true) {
    header('Location: login.php');
    exit;
}

// Get driver ID from URL if viewing individual driver
$driverId = isset($_GET['id']) ? htmlspecialchars($_GET['id']) : null;

$pageTitle = $driverId ? 'Driver Profile | GRIDSTATS' : 'Drivers | GRIDSTATS';
include 'includes/head.php';
?>

<body class="antialiased min-h-screen flex flex-col" style="background-color: #050505; color: #e2e8f0; font-family: 'Titillium Web', system-ui, sans-serif;">

    <?php $activePage = 'drivers'; include 'includes/navbar.php'; ?>

    <div class="container mx-auto mt-6 px-4 flex-grow pb-6">

        <?php if (!$driverId): ?>
        <!-- ALL DRIVERS LIST VIEW -->
        <div class="glass-panel rounded-xl p-8">
            <!-- Header - Centered -->
            <div class="flex flex-col items-center mb-6">
                <h1 class="text-4xl font-black text-white italic tracking-wide mb-8">FORMULA 1 DRIVERS</h1>

                <!-- Section Divider -->
                <div class="w-[80%] flex items-center gap-4 mb-6">
                    <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest whitespace-nowrap">Current Drivers</span>
                    <div class="flex-grow h-px bg-zinc-700"></div>
                </div>

                <!-- Current Champion/Leader Card -->
                <a id="champion-card-link" href="#" class="group w-full max-w-[700px] block">
                    <div class="flex items-stretch rounded-2xl overflow-hidden transition-all duration-300 group-hover:ring-1 group-hover:ring-zinc-700">
                        <!-- Left Capsule Extension - Year & Label -->
                        <div id="champion-left-capsule" class="flex flex-col items-center justify-center px-6 py-5 min-w-[140px] relative" style="background-color: #111113;">
                            <div id="champion-year" class="text-2xl font-black text-white tracking-tight leading-none mb-1">—</div>
                            <div id="champion-label" class="text-[9px] uppercase font-bold tracking-[0.15em] text-zinc-500 whitespace-nowrap">Driver Champion</div>
                            <!-- Subtle right edge fade -->
                            <div class="absolute right-0 top-0 bottom-0 w-px bg-zinc-800"></div>
                        </div>
                        <!-- Main Card Body -->
                        <div class="stat-card flex-grow flex items-center gap-6 px-6 py-5 rounded-none border-0" style="border: none !important;">
                            <!-- Left side with color bar and driver info -->
                            <div class="flex items-center gap-4 flex-grow">
                                <div id="champion-color-bar" class="w-1.5 h-10 rounded-full transition-colors duration-500" style="background-color: #27272a;"></div>
                                <div class="flex-grow">
                                    <div id="champion-name" class="text-lg font-bold text-white group-hover:translate-x-1 transition-transform duration-200">Loading...</div>
                                    <div id="champion-team" class="text-xs text-zinc-500 mt-0.5"></div>
                                </div>
                            </div>
                            <!-- Right side with permanent number -->
                            <div class="text-right">
                                <div id="champion-number" class="text-4xl font-black" style="color: #ffffff; opacity: 0.2;"></div>
                            </div>
                        </div>
                    </div>
                </a>
            </div>

            <!-- Drivers Grid (Champion will be hidden via JS) -->
            <div id="drivers-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Will be populated by JavaScript -->
                <div class="text-zinc-500 text-sm col-span-2 text-center py-8">Loading drivers...</div>
            </div>

            <!-- Past Drivers Section -->
            <div class="flex items-center gap-4 mt-10 mb-6">
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest whitespace-nowrap">Past Drivers</span>
                <div class="flex-grow h-px bg-zinc-700"></div>
            </div>

            <!-- Search and Filters -->
            <div class="mb-6 space-y-4">
                <!-- Search Bar -->
                <div class="relative">
                    <input type="text" id="driver-search" placeholder="Search drivers by name..."
                           class="w-full px-4 py-3 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                           style="background-color: #111113; border: 1px solid #27272a;">
                    <svg class="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>

                <!-- Filter Chips -->
                <div class="flex flex-wrap gap-2 items-center">
                    <span class="text-xs text-zinc-600 font-bold uppercase tracking-wider">Filters:</span>

                    <!-- Decade Filter -->
                    <div class="relative">
                        <button id="decade-filter-btn" onclick="toggleFilter('decade')"
                                class="filter-chip px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                style="background-color: #18181b; border: 1px solid #3f3f46; color: #a1a1aa;">
                            Decade <span id="decade-count" class="hidden ml-1 px-1.5 rounded-full" style="background-color: #dc2626; color: white;"></span>
                            <svg class="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div id="decade-filter-menu" class="hidden absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg py-2 z-50 max-h-64 overflow-y-auto"
                             style="background-color: #1a1a1f; border: 1px solid #3f3f46;">
                            <!-- Will be populated by JS -->
                        </div>
                    </div>

                    <!-- Team Filter -->
                    <div class="relative">
                        <button id="team-filter-btn" onclick="toggleFilter('team')"
                                class="filter-chip px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                style="background-color: #18181b; border: 1px solid #3f3f46; color: #a1a1aa;">
                            Team <span id="team-count" class="hidden ml-1 px-1.5 rounded-full" style="background-color: #dc2626; color: white;"></span>
                            <svg class="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div id="team-filter-menu" class="hidden absolute top-full left-0 mt-2 w-64 rounded-md shadow-lg py-2 z-50 max-h-64 overflow-y-auto"
                             style="background-color: #1a1a1f; border: 1px solid #3f3f46;">
                            <!-- Will be populated by JS -->
                        </div>
                    </div>

                    <!-- Nationality Filter -->
                    <div class="relative">
                        <button id="nationality-filter-btn" onclick="toggleFilter('nationality')"
                                class="filter-chip px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                style="background-color: #18181b; border: 1px solid #3f3f46; color: #a1a1aa;">
                            Nationality <span id="nationality-count" class="hidden ml-1 px-1.5 rounded-full" style="background-color: #dc2626; color: white;"></span>
                            <svg class="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div id="nationality-filter-menu" class="hidden absolute top-full left-0 mt-2 w-64 rounded-md shadow-lg py-2 z-50 max-h-64 overflow-y-auto"
                             style="background-color: #1a1a1f; border: 1px solid #3f3f46;">
                            <!-- Will be populated by JS -->
                        </div>
                    </div>

                    <!-- World Champions Filter -->
                    <button id="champions-filter-btn" onclick="toggleChampionsFilter()"
                            class="filter-chip px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                            style="background-color: #18181b; border: 1px solid #3f3f46; color: #a1a1aa;">
                        <svg class="inline w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        World Champions
                    </button>

                    <!-- Clear Filters -->
                    <button id="clear-filters-btn" onclick="clearAllFilters()"
                            class="hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:bg-red-700"
                            style="background-color: #dc2626; color: white;">
                        Clear All
                    </button>
                </div>
            </div>

            <!-- Past Drivers Grid -->
            <div id="past-drivers-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="text-zinc-500 text-sm col-span-2 text-center py-8">Loading past drivers...</div>
            </div>

            <!-- Pagination Controls -->
            <div class="flex justify-center items-center gap-4">
                <span class="text-xs text-zinc-500">Show per page:</span>
                <select id="entries-per-page" onchange="changeEntriesPerPage()"
                        class="px-3 py-1.5 rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                        style="background-color: #18181b; border: 1px solid #3f3f46; color: #e2e8f0;">
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
                <span id="entries-info" class="text-xs text-zinc-500"></span>
            </div>

        </div>

        <?php else: ?>
        <!-- INDIVIDUAL DRIVER VIEW (Future Implementation) -->
        <div class="glass-panel rounded-xl p-8 text-center">
            <h1 class="text-3xl font-black text-red-500 mb-4">Driver Profile</h1>
            <p class="text-zinc-500 mb-6">Individual driver pages coming soon.</p>
            <a href="/drivers" class="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition">View All Drivers</a>
        </div>
        <?php endif; ?>

    </div>

    <!-- Footer -->
    <footer class="border-t border-zinc-800 py-6 mt-auto">
        <div class="container mx-auto px-4 text-center text-zinc-600 text-xs">
            GRIDSTATS © 2025 | Not affiliated with Formula 1 or FIA
        </div>
    </footer>

    <script>
    function toggleSettings() {
        const menu = document.getElementById('settings-dropdown');
        menu.classList.toggle('hidden');
    }

    window.onclick = function(event) {
        if (!event.target.closest('.relative.ml-1')) {
            const menu = document.getElementById('settings-dropdown');
            if (menu && !menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
            }
        }
    }

    const API_BASE = '<?php echo (strpos($_SERVER['HTTP_HOST'], 'local') !== false) ? 'http://f1stats.local/api/local/' : 'https://grid-stats.com/api/local/'; ?>';
    const currentDriverId = '<?php echo $driverId; ?>';

    // Team colors mapping
    const teamColors = {
        "red_bull": "#3671C6",
        "ferrari": "#E80020",
        "mclaren": "#FF8000",
        "mercedes": "#27F4D2",
        "aston_martin": "#229971",
        "alpine": "#eb58a5",
        "williams": "#64C4FF",
        "rb": "#6692FF",
        "audi": "#FF4D00",
        "haas": "#B6BABD",
        "cadillac": "#FFD700"
    };

    // Load champion/leader data
    async function loadChampionData() {
        const currentYear = new Date().getFullYear();

        try {
            // First, check if current season has completed races
            const currentSeasonRes = await fetch(`${API_BASE}${currentYear}/driverStandings`);
            const currentSeasonData = await currentSeasonRes.json();

            if (currentSeasonData.MRData &&
                currentSeasonData.MRData.StandingsTable.StandingsLists &&
                currentSeasonData.MRData.StandingsTable.StandingsLists.length > 0 &&
                currentSeasonData.MRData.StandingsTable.StandingsLists[0].DriverStandings &&
                currentSeasonData.MRData.StandingsTable.StandingsLists[0].DriverStandings.length > 0) {

                const leader = currentSeasonData.MRData.StandingsTable.StandingsLists[0].DriverStandings[0];

                // Check if season has started (leader has points)
                if (parseInt(leader.points) > 0) {
                    // Season has started - show current leader
                    updateChampionCard(currentYear, leader, true);
                } else {
                    // Season hasn't started - show previous champion
                    const lastCompletedSeason = currentYear - 1;
                    const prevSeasonRes = await fetch(`${API_BASE}${lastCompletedSeason}/driverStandings`);
                    const prevSeasonData = await prevSeasonRes.json();

                    if (prevSeasonData.MRData &&
                        prevSeasonData.MRData.StandingsTable.StandingsLists[0] &&
                        prevSeasonData.MRData.StandingsTable.StandingsLists[0].DriverStandings[0]) {

                        const champion = prevSeasonData.MRData.StandingsTable.StandingsLists[0].DriverStandings[0];
                        updateChampionCard(lastCompletedSeason, champion, false);
                    }
                }

                // Hide champion from grid
                hideDriverFromGrid(currentSeasonData.MRData.StandingsTable.StandingsLists[0].DriverStandings[0].Driver.driverId);
            }
        } catch (error) {
            console.error('Error loading champion data:', error);
            const nameEl = document.getElementById('champion-name');
            if (nameEl) nameEl.textContent = 'Data unavailable';
        }
    }

    function updateChampionCard(year, driverData, isCurrentLeader) {
        const yearEl = document.getElementById('champion-year');
        const labelEl = document.getElementById('champion-label');
        const nameEl = document.getElementById('champion-name');
        const teamEl = document.getElementById('champion-team');
        const colorEl = document.getElementById('champion-color-bar');
        const numberEl = document.getElementById('champion-number');
        const linkEl = document.getElementById('champion-card-link');

        const fullName = `${driverData.Driver.givenName} ${driverData.Driver.familyName}`;
        const teamId = driverData.Constructors[0].constructorId;
        const teamName = driverData.Constructors[0].name;
        const permanentNumber = driverData.Driver.permanentNumber || '—';

        if (yearEl) yearEl.textContent = year;
        if (labelEl) labelEl.textContent = isCurrentLeader ? 'Current Leader' : 'Driver Champion';
        if (nameEl) nameEl.textContent = fullName;
        if (teamEl) teamEl.textContent = teamName;
        if (colorEl) colorEl.style.backgroundColor = teamColors[teamId] || '#FFFFFF';
        if (numberEl) numberEl.textContent = permanentNumber;
        if (linkEl) linkEl.href = `/drivers/${driverData.Driver.driverId}`;
    }

    function hideDriverFromGrid(driverId) {
        const driverCard = document.querySelector(`[data-driver-id="${driverId}"]`);
        if (driverCard) {
            driverCard.style.display = 'none';
        }
    }

    // Load all drivers
    async function loadDrivers() {
        const currentYear = new Date().getFullYear();

        try {
            const res = await fetch(`${API_BASE}${currentYear}/driverStandings`);
            const data = await res.json();

            if (data.MRData &&
                data.MRData.StandingsTable.StandingsLists &&
                data.MRData.StandingsTable.StandingsLists.length > 0 &&
                data.MRData.StandingsTable.StandingsLists[0].DriverStandings &&
                data.MRData.StandingsTable.StandingsLists[0].DriverStandings.length > 0) {

                const drivers = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
                const container = document.getElementById('drivers-grid');

                if (container) {
                    container.innerHTML = drivers.map(d => {
                        const teamId = d.Constructors[0].constructorId;
                        const teamColor = teamColors[teamId] || '#FFFFFF';
                        const fullName = `${d.Driver.givenName} ${d.Driver.familyName}`;

                        return `
                            <a href="/drivers/${d.Driver.driverId}" data-driver-id="${d.Driver.driverId}" class="driver-card stat-card rounded-lg p-6 hover:bg-zinc-800/50 transition group">
                                <div class="flex items-center gap-4">
                                    <div class="w-2 h-12 rounded" style="background-color: ${teamColor};"></div>
                                    <div class="flex-grow">
                                        <div class="text-lg font-bold text-white group-hover:translate-x-1 transition-transform">${fullName}</div>
                                        <div class="text-xs text-zinc-500">${d.Constructors[0].name}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-3xl font-black" style="color: ${teamColor}; opacity: 0.2;">${d.Driver.permanentNumber || '—'}</div>
                                    </div>
                                </div>
                            </a>
                        `;
                    }).join('');
                }
            }
        } catch (error) {
            console.error('Error loading drivers:', error);
            const container = document.getElementById('drivers-grid');
            if (container) {
                container.innerHTML = '<div class="text-zinc-500 col-span-2 text-center">Error loading drivers</div>';
            }
        }
    }

    // Past Drivers functionality
    let allPastDrivers = [];
    let filteredPastDrivers = [];
    let currentFilters = {
        search: '',
        decades: new Set(),
        teams: new Set(),
        nationalities: new Set(),
        championsOnly: false
    };
    let entriesPerPage = 25;

    // Toggle filter dropdown
    function toggleFilter(filterType) {
        const menu = document.getElementById(`${filterType}-filter-menu`);
        const allMenus = ['decade', 'team', 'nationality'].map(f => document.getElementById(`${f}-filter-menu`));

        allMenus.forEach(m => {
            if (m !== menu && m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
            }
        });

        if (menu) {
            menu.classList.toggle('hidden');
        }
    }

    // Toggle champions filter
    function toggleChampionsFilter() {
        currentFilters.championsOnly = !currentFilters.championsOnly;
        const btn = document.getElementById('champions-filter-btn');

        if (currentFilters.championsOnly) {
            btn.style.backgroundColor = '#dc2626';
            btn.style.color = 'white';
            btn.style.borderColor = '#dc2626';
        } else {
            btn.style.backgroundColor = '#18181b';
            btn.style.color = '#a1a1aa';
            btn.style.borderColor = '#3f3f46';
        }

        applyFilters();
    }

    // Clear all filters
    function clearAllFilters() {
        currentFilters.search = '';
        currentFilters.decades.clear();
        currentFilters.teams.clear();
        currentFilters.nationalities.clear();
        currentFilters.championsOnly = false;

        // Clear search input
        const searchInput = document.getElementById('driver-search');
        if (searchInput) searchInput.value = '';

        // Reset champions filter button
        const championsBtn = document.getElementById('champions-filter-btn');
        if (championsBtn) {
            championsBtn.style.backgroundColor = '#18181b';
            championsBtn.style.color = '#a1a1aa';
            championsBtn.style.borderColor = '#3f3f46';
        }

        // Uncheck all filter checkboxes
        document.querySelectorAll('.decade-checkbox, .team-checkbox, .nationality-checkbox').forEach(cb => {
            cb.checked = false;
        });

        updateFilterUI();
        applyFilters();
    }

    // Update filter button UI
    function updateFilterUI() {
        const filterMap = {
            'decade': 'decades',
            'team': 'teams',
            'nationality': 'nationalities'
        };

        Object.keys(filterMap).forEach(filterType => {
            const filterKey = filterMap[filterType];
            const count = currentFilters[filterKey].size;
            const countEl = document.getElementById(`${filterType}-count`);
            const btn = document.getElementById(`${filterType}-filter-btn`);

            if (count > 0) {
                countEl.textContent = count;
                countEl.classList.remove('hidden');
                btn.style.backgroundColor = '#dc2626';
                btn.style.color = 'white';
                btn.style.borderColor = '#dc2626';
            } else {
                countEl.classList.add('hidden');
                btn.style.backgroundColor = '#18181b';
                btn.style.color = '#a1a1aa';
                btn.style.borderColor = '#3f3f46';
            }
        });

        const hasFilters = currentFilters.decades.size > 0 ||
                          currentFilters.teams.size > 0 ||
                          currentFilters.nationalities.size > 0 ||
                          currentFilters.championsOnly ||
                          currentFilters.search !== '';

        const clearBtn = document.getElementById('clear-filters-btn');
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', !hasFilters);
        }
    }

    // Apply filters
    function applyFilters() {
        console.log('Applying filters:', {
            search: currentFilters.search,
            decades: Array.from(currentFilters.decades),
            teams: Array.from(currentFilters.teams),
            nationalities: Array.from(currentFilters.nationalities),
            championsOnly: currentFilters.championsOnly
        });

        filteredPastDrivers = allPastDrivers.filter(driver => {
            // Champions filter OVERRIDES all other filters
            if (currentFilters.championsOnly) {
                return driver.is_champion === true;
            }

            // Search filter
            if (currentFilters.search) {
                const searchLower = currentFilters.search.toLowerCase();
                const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
                if (!fullName.includes(searchLower)) {
                    return false;
                }
            }

            // Decade filter
            if (currentFilters.decades.size > 0) {
                if (!driver.debut_year) return false;
                const driverDecade = Math.floor(parseInt(driver.debut_year) / 10) * 10;
                if (!currentFilters.decades.has(driverDecade.toString())) {
                    return false;
                }
            }

            // Team filter
            if (currentFilters.teams.size > 0) {
                if (!driver.teams || !Array.isArray(driver.teams)) return false;
                const hasMatchingTeam = driver.teams.some(team => currentFilters.teams.has(team));
                if (!hasMatchingTeam) {
                    return false;
                }
            }

            // Nationality filter
            if (currentFilters.nationalities.size > 0) {
                if (!driver.nationality || !currentFilters.nationalities.has(driver.nationality)) {
                    return false;
                }
            }

            return true;
        });

        console.log(`Filtered ${filteredPastDrivers.length} drivers from ${allPastDrivers.length} total`);
        if (currentFilters.championsOnly) {
            console.log('Champions found:', filteredPastDrivers.map(d => `${d.first_name} ${d.last_name}`));
        }

        updateFilterUI();
        updateEntriesDropdown();
        displayPastDrivers();
    }

    // Update entries dropdown based on available results
    function updateEntriesDropdown() {
        const dropdown = document.getElementById('entries-per-page');
        const total = filteredPastDrivers.length;

        // Update options visibility
        Array.from(dropdown.options).forEach(option => {
            const value = parseInt(option.value);
            option.disabled = value > total && total > 0;
        });

        // Reset to 25 if current selection is disabled
        if (parseInt(dropdown.value) > total && total > 0) {
            dropdown.value = '25';
            entriesPerPage = 25;
        }
    }

    // Change entries per page
    function changeEntriesPerPage() {
        entriesPerPage = parseInt(document.getElementById('entries-per-page').value);
        displayPastDrivers();
    }

    // Display past drivers
    function displayPastDrivers() {
        const container = document.getElementById('past-drivers-grid');
        const infoEl = document.getElementById('entries-info');

        const driversToShow = filteredPastDrivers.slice(0, entriesPerPage);
        const total = filteredPastDrivers.length;

        if (driversToShow.length === 0) {
            container.innerHTML = '<div class="text-zinc-500 col-span-2 text-center py-8">No drivers found matching your filters</div>';
            infoEl.textContent = '0 drivers';
            return;
        }

        container.innerHTML = driversToShow.map(driver => {
            const teamColor = driver.primary_color || '#FFFFFF';
            const fullName = `${driver.first_name} ${driver.last_name}`;
            const championBadge = driver.is_champion ? '<svg class="inline w-4 h-4 ml-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' : '';

            return `
                <a href="/drivers/${driver.driver_id}" class="driver-card stat-card rounded-lg p-5 hover:bg-zinc-800/50 transition group">
                    <div class="flex items-center gap-4">
                        <div class="w-1.5 h-10 rounded-full" style="background-color: ${teamColor};"></div>
                        <div class="flex-grow">
                            <div class="text-base font-bold text-white group-hover:translate-x-1 transition-transform">
                                ${fullName}${championBadge}
                            </div>
                            <div class="text-xs text-zinc-500 mt-0.5">${driver.nationality || 'Unknown'}</div>
                            <div class="text-[10px] text-zinc-600 mt-0.5">${driver.debut_year ? driver.debut_year + ' debut' : ''}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-black" style="color: ${teamColor}; opacity: 0.2;">${driver.permanent_number || '—'}</div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        infoEl.textContent = `Showing ${driversToShow.length} of ${total} driver${total !== 1 ? 's' : ''}`;
    }

    // Load past drivers from database
    async function loadPastDrivers() {
        try {
            const url = '<?php echo (strpos($_SERVER['HTTP_HOST'], 'local') !== false) ? 'http://f1stats.local' : 'https://grid-stats.com'; ?>/get_past_drivers.php';
            console.log('Fetching past drivers from:', url);

            const response = await fetch(url);
            console.log('Response status:', response.status);

            const text = await response.text();
            console.log('Response text:', text);

            const data = JSON.parse(text);
            console.log('Parsed data:', data);

            if (data.success) {
                allPastDrivers = data.drivers;
                filteredPastDrivers = [...allPastDrivers];

                console.log(`Loaded ${allPastDrivers.length} past drivers`);

                // Populate filter options
                populateFilterOptions();
                displayPastDrivers();
            } else {
                console.error('Failed to load past drivers:', data.error);
                if (data.trace) console.error('Trace:', data.trace);
                document.getElementById('past-drivers-grid').innerHTML =
                    `<div class="text-zinc-500 col-span-2 text-center py-8">Error: ${data.error}</div>`;
            }
        } catch (error) {
            console.error('Error loading past drivers:', error);
            document.getElementById('past-drivers-grid').innerHTML =
                `<div class="text-zinc-500 col-span-2 text-center py-8">Error: ${error.message}</div>`;
        }
    }

    // Populate filter dropdowns
    function populateFilterOptions() {
        // Get unique decades
        const decades = new Set();
        allPastDrivers.forEach(d => {
            if (d.debut_year) {
                decades.add(Math.floor(parseInt(d.debut_year) / 10) * 10);
            }
        });

        const decadeMenu = document.getElementById('decade-filter-menu');
        decadeMenu.innerHTML = Array.from(decades).sort((a, b) => b - a).map(decade => `
            <label class="flex items-center px-4 py-2 hover:bg-white/5 cursor-pointer text-sm" style="color: #e2e8f0;">
                <input type="checkbox" value="${decade}" data-decade="${decade}" class="decade-checkbox mr-2 accent-red-600">
                ${decade}s
            </label>
        `).join('');

        // Add event listeners to decade checkboxes
        document.querySelectorAll('.decade-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                toggleDecadeFilter(this.dataset.decade);
            });
        });

        // Get unique teams
        const teams = new Set();
        allPastDrivers.forEach(d => {
            if (d.teams && Array.isArray(d.teams)) {
                d.teams.forEach(team => {
                    if (team) teams.add(team);
                });
            }
        });

        const teamMenu = document.getElementById('team-filter-menu');
        teamMenu.innerHTML = Array.from(teams).sort().map(team => {
            const safeTeam = team.replace(/'/g, "\\'");
            return `
                <label class="flex items-center px-4 py-2 hover:bg-white/5 cursor-pointer text-sm" style="color: #e2e8f0;">
                    <input type="checkbox" value="${safeTeam}" data-team="${safeTeam}" class="team-checkbox mr-2 accent-red-600">
                    ${team}
                </label>
            `;
        }).join('');

        // Add event listeners to team checkboxes
        document.querySelectorAll('.team-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                toggleTeamFilter(this.dataset.team);
            });
        });

        // Get unique nationalities
        const nationalities = new Set();
        allPastDrivers.forEach(d => {
            if (d.nationality) nationalities.add(d.nationality);
        });

        const nationalityMenu = document.getElementById('nationality-filter-menu');
        nationalityMenu.innerHTML = Array.from(nationalities).sort().map(nationality => {
            const safeNationality = nationality.replace(/'/g, "\\'");
            return `
                <label class="flex items-center px-4 py-2 hover:bg-white/5 cursor-pointer text-sm" style="color: #e2e8f0;">
                    <input type="checkbox" value="${safeNationality}" data-nationality="${safeNationality}" class="nationality-checkbox mr-2 accent-red-600">
                    ${nationality}
                </label>
            `;
        }).join('');

        // Add event listeners to nationality checkboxes
        document.querySelectorAll('.nationality-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                toggleNationalityFilter(this.dataset.nationality);
            });
        });
    }

    // Toggle individual filters
    function toggleDecadeFilter(decade) {
        decade = decade.toString();
        if (currentFilters.decades.has(decade)) {
            currentFilters.decades.delete(decade);
        } else {
            currentFilters.decades.add(decade);
        }
        console.log('Decades filter:', Array.from(currentFilters.decades));
        applyFilters();
    }

    function toggleTeamFilter(team) {
        if (currentFilters.teams.has(team)) {
            currentFilters.teams.delete(team);
        } else {
            currentFilters.teams.add(team);
        }
        console.log('Teams filter:', Array.from(currentFilters.teams));
        applyFilters();
    }

    function toggleNationalityFilter(nationality) {
        if (currentFilters.nationalities.has(nationality)) {
            currentFilters.nationalities.delete(nationality);
        } else {
            currentFilters.nationalities.add(nationality);
        }
        console.log('Nationalities filter:', Array.from(currentFilters.nationalities));
        applyFilters();
    }

    // Search functionality
    document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.getElementById('driver-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentFilters.search = e.target.value;
                applyFilters();
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.filter-chip') && !e.target.closest('[id$="-filter-menu"]')) {
                ['decade', 'team', 'nationality'].forEach(filterType => {
                    const menu = document.getElementById(`${filterType}-filter-menu`);
                    if (menu && !menu.classList.contains('hidden')) {
                        menu.classList.add('hidden');
                    }
                });
            }
        });
    });

    // Load data on page load
    document.addEventListener('DOMContentLoaded', function() {
        if (!currentDriverId) {
            loadDrivers().then(() => loadChampionData());
            loadPastDrivers();
        }
    });
    </script>

</body>
</html>
