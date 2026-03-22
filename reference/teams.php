<?php
session_start();

// Check authentication
if (!isset($_SESSION['f1stats_authenticated']) || $_SESSION['f1stats_authenticated'] !== true) {
    header('Location: login.php');
    exit;
}

// Get team ID from URL
$teamId = isset($_GET['id']) ? htmlspecialchars($_GET['id']) : null;

// Team data mapping
$teamData = [
    'red_bull' => [
        'name' => 'Red Bull Racing',
        'fullName' => 'Oracle Red Bull Racing',
        'base' => 'Milton Keynes, United Kingdom',
        'teamPrincipal' => 'Christian Horner',
        'chassis' => 'RB21',
        'powerUnit' => 'Honda RBPT',
        'firstEntry' => '2005',
        'worldChampionships' => 6,
        'color' => '#3671C6',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/red-bull-racing-logo.png',
        'website' => 'https://www.redbullracing.com'
    ],
    'ferrari' => [
        'name' => 'Ferrari',
        'fullName' => 'Scuderia Ferrari HP',
        'base' => 'Maranello, Italy',
        'teamPrincipal' => 'FrÃ©dÃ©ric Vasseur',
        'chassis' => 'SF-25',
        'powerUnit' => 'Ferrari',
        'firstEntry' => '1950',
        'worldChampionships' => 16,
        'color' => '#E80020',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/ferrari-logo.png',
        'website' => 'https://www.ferrari.com/en-US/formula1'
    ],
    'mclaren' => [
        'name' => 'McLaren',
        'fullName' => 'McLaren Formula 1 Team',
        'base' => 'Woking, United Kingdom',
        'teamPrincipal' => 'Andrea Stella',
        'chassis' => 'MCL39',
        'powerUnit' => 'Mercedes',
        'firstEntry' => '1966',
        'worldChampionships' => 8,
        'color' => '#FF8000',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/mclaren-logo.png',
        'website' => 'https://www.mclaren.com/racing/'
    ],
    'mercedes' => [
        'name' => 'Mercedes',
        'fullName' => 'Mercedes-AMG Petronas Formula One Team',
        'base' => 'Brackley, United Kingdom',
        'teamPrincipal' => 'Toto Wolff',
        'chassis' => 'W16',
        'powerUnit' => 'Mercedes',
        'firstEntry' => '2010',
        'worldChampionships' => 8,
        'color' => '#27F4D2',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/mercedes-logo.png',
        'website' => 'https://www.mercedesamgf1.com'
    ],
    'aston_martin' => [
        'name' => 'Aston Martin',
        'fullName' => 'Aston Martin Aramco Formula One Team',
        'base' => 'Silverstone, United Kingdom',
        'teamPrincipal' => 'Andy Cowell',
        'chassis' => 'AMR25',
        'powerUnit' => 'Mercedes',
        'firstEntry' => '2021',
        'worldChampionships' => 0,
        'color' => '#229971',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/aston-martin-logo.png',
        'website' => 'https://www.astonmartinf1.com'
    ],
    'alpine' => [
        'name' => 'Alpine',
        'fullName' => 'BWT Alpine Formula One Team',
        'base' => 'Enstone, United Kingdom',
        'teamPrincipal' => 'Oliver Oakes',
        'chassis' => 'A525',
        'powerUnit' => 'Renault',
        'firstEntry' => '2021',
        'worldChampionships' => 0,
        'color' => '#0093CC',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/alpine-logo.png',
        'website' => 'https://www.alpine-cars.co.uk/formula-1.html'
    ],
    'williams' => [
        'name' => 'Williams',
        'fullName' => 'Williams Racing',
        'base' => 'Grove, United Kingdom',
        'teamPrincipal' => 'James Vowles',
        'chassis' => 'FW47',
        'powerUnit' => 'Mercedes',
        'firstEntry' => '1978',
        'worldChampionships' => 9,
        'color' => '#64C4FF',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/williams-logo.png',
        'website' => 'https://www.williamsf1.com'
    ],
    'rb' => [
        'name' => 'RB',
        'fullName' => 'Visa Cash App RB Formula One Team',
        'base' => 'Faenza, Italy',
        'teamPrincipal' => 'Laurent Mekies',
        'chassis' => 'VCARB 02',
        'powerUnit' => 'Honda RBPT',
        'firstEntry' => '2024',
        'worldChampionships' => 0,
        'color' => '#6692FF',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/rb-logo.png',
        'website' => 'https://www.visacashapprb.com'
    ],
    'audi' => [
        'name' => 'Audi',
        'fullName' => 'Audi Revolut F1 Team',
        'base' => 'Hinwil, Switzerland',
        'teamPrincipal' => 'Jonathan Wheatley',
        'chassis' => 'R26',
        'powerUnit' => 'Audi',
        'firstEntry' => '2026',
        'worldChampionships' => 0,
        'color' => '#C0C0C0',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2026/audi-logo.png',
        'website' => 'https://www.audi.com/en/sport/motorsport/formula-1.html'
    ],
    'haas' => [
        'name' => 'Haas',
        'fullName' => 'MoneyGram Haas F1 Team',
        'base' => 'Kannapolis, United States',
        'teamPrincipal' => 'Ayao Komatsu',
        'chassis' => 'VF-25',
        'powerUnit' => 'Ferrari',
        'firstEntry' => '2016',
        'worldChampionships' => 0,
        'color' => '#B6BABD',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2024/haas-f1-team-logo.png',
        'website' => 'https://www.haasf1team.com'
    ],
    'cadillac' => [
        'name' => 'Cadillac',
        'fullName' => 'Cadillac Formula 1 Team',
        'base' => 'Silverstone, United Kingdom',
        'teamPrincipal' => 'Graeme Lowdon',
        'chassis' => 'CAD26',
        'powerUnit' => 'Ferrari',
        'firstEntry' => '2026',
        'worldChampionships' => 0,
        'color' => '#FFD700',
        'logo' => 'https://media.formula1.com/content/dam/fom-website/teams/2026/cadillac-logo.png',
        'website' => 'https://www.cadillacf1team.com'
    ]
];

// Get current team data
$team = isset($teamData[$teamId]) ? $teamData[$teamId] : null;
$pageTitle = $team ? $team['name'] . ' | GRIDSTATS' : 'Teams | GRIDSTATS';

// Fetch historical/other constructors from database
$otherTeams = [];
try {
    require_once __DIR__ . '/api/config.php';
    $pdo = getDbConnection();
    $currentIds = array_keys($teamData);
    $placeholders = implode(',', array_fill(0, count($currentIds), '?'));
    $stmt = $pdo->prepare("
        SELECT constructor_id, name, color_primary, 
               (SELECT n.name FROM nationalities n WHERE n.id = c.nationality_id) as nationality
        FROM constructors c
        WHERE constructor_id NOT IN ($placeholders)
        ORDER BY name ASC
    ");
    $stmt->execute($currentIds);
    $otherTeams = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    // Silently fail - other teams section just won't show
}
?>
<?php 
$pageTitle = $team ? $team['name'] . ' | GRIDSTATS' : 'Teams | GRIDSTATS';
include 'includes/head.php'; 
?>

<body class="antialiased min-h-screen flex flex-col" style="background-color: #050505; color: #e2e8f0; font-family: 'Titillium Web', system-ui, sans-serif;">

    <?php $activePage = 'teams'; include 'includes/navbar.php'; ?>

    <div class="container mx-auto mt-6 px-4 flex-grow pb-6">
        
        <?php if ($teamId && $team): ?>
        <!-- SINGLE TEAM VIEW -->
        <div class="glass-panel rounded-xl overflow-hidden">
            
            <!-- Team Header -->
            <div class="relative h-64 overflow-hidden" style="background: linear-gradient(135deg, <?php echo $team['color']; ?>22 0%, transparent 60%);">
                <div class="absolute inset-0 bg-gradient-to-r from-[#18181b] via-transparent to-[#18181b]"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent"></div>
                
                <!-- Team Color Bar -->
                <div class="absolute top-0 left-0 right-0 team-color-bar" style="background-color: <?php echo $team['color']; ?>;"></div>
                
                <div class="absolute inset-0 p-8 flex items-end">
                    <div class="flex items-end gap-6 w-full">
                        <div class="flex-grow">
                            <h1 class="text-5xl font-black text-white italic tracking-tight mb-2"><?php echo strtoupper($team['name']); ?></h1>
                            <p class="text-zinc-400 text-lg"><?php echo $team['fullName']; ?></p>
                        </div>
                        <div class="text-right">
                            <div class="text-[80px] font-black leading-none" style="color: <?php echo $team['color']; ?>; opacity: 0.3;">
                                <?php echo $team['worldChampionships']; ?>
                            </div>
                            <div class="text-xs text-zinc-500 uppercase font-bold tracking-wider">World Titles</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Team Stats -->
            <div class="p-8">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="stat-card rounded-lg p-4">
                        <span class="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Base</span>
                        <span class="text-white font-bold"><?php echo $team['base']; ?></span>
                    </div>
                    <div class="stat-card rounded-lg p-4">
                        <span class="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Team Principal</span>
                        <span class="text-white font-bold"><?php echo $team['teamPrincipal']; ?></span>
                    </div>
                    <div class="stat-card rounded-lg p-4">
                        <span class="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Chassis</span>
                        <span class="text-white font-bold"><?php echo $team['chassis']; ?></span>
                    </div>
                    <div class="stat-card rounded-lg p-4">
                        <span class="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Power Unit</span>
                        <span class="text-white font-bold"><?php echo $team['powerUnit']; ?></span>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div class="stat-card rounded-lg p-4">
                        <span class="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">First Entry</span>
                        <span class="text-white font-bold text-2xl"><?php echo $team['firstEntry']; ?></span>
                    </div>
                    <div class="stat-card rounded-lg p-4">
                        <span class="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Constructor Titles</span>
                        <span class="text-white font-bold text-2xl"><?php echo $team['worldChampionships']; ?></span>
                    </div>
                    <div class="stat-card rounded-lg p-4">
                        <span class="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Official Website</span>
                        <a href="<?php echo $team['website']; ?>" target="_blank" rel="noopener noreferrer" class="text-red-500 hover:text-red-400 font-bold transition">Visit Site â†’</a>
                    </div>
                </div>

                <!-- Current Drivers Section (Placeholder) -->
                <div class="border-t border-zinc-800 pt-8">
                    <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Current Drivers</h3>
                    <div id="team-drivers" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="text-zinc-500 text-sm">Loading driver data...</div>
                    </div>
                </div>

                <!-- Season Performance Section (Placeholder) -->
                <div class="border-t border-zinc-800 pt-8 mt-8">
                    <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">2025 Season Performance</h3>
                    <div id="team-performance" class="text-zinc-500 text-sm">
                        Loading performance data...
                    </div>
                </div>
            </div>
        </div>

        <?php elseif (!$teamId): ?>
        <!-- ALL TEAMS LIST VIEW -->
        <div class="glass-panel rounded-xl p-8">
            <!-- Header - Centered -->
            <div class="flex flex-col items-center mb-6">
                <h1 class="text-4xl font-black text-white italic tracking-wide mb-8">CONSTRUCTOR TEAMS</h1>
                
                <!-- Section Divider -->
                <div class="w-[80%] flex items-center gap-4 mb-6">
                    <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest whitespace-nowrap">Current Teams</span>
                    <div class="flex-grow h-px bg-zinc-700"></div>
                </div>
                
                <!-- Current Champion/Leader Card -->
                <a id="champion-card-link" href="#" class="group w-full max-w-[700px] block">
                    <div class="flex items-stretch rounded-2xl overflow-hidden transition-all duration-300 group-hover:ring-1 group-hover:ring-zinc-700">
                        <!-- Left Capsule Extension - Year & Label -->
                        <div id="champion-left-capsule" class="flex flex-col items-center justify-center px-6 py-5 min-w-[140px] relative" style="background-color: #111113;">
                            <div id="champion-year" class="text-2xl font-black text-white tracking-tight leading-none mb-1">—</div>
                            <div id="champion-label" class="text-[9px] uppercase font-bold tracking-[0.15em] text-zinc-500 whitespace-nowrap">Constructor Champion</div>
                            <!-- Subtle right edge fade -->
                            <div class="absolute right-0 top-0 bottom-0 w-px bg-zinc-800"></div>
                        </div>
                        <!-- Main Card Body -->
                        <div class="stat-card flex-grow flex items-center gap-4 px-6 py-5 rounded-none border-0" style="border: none !important;">
                            <div id="champion-color-bar" class="w-1.5 h-10 rounded-full transition-colors duration-500" style="background-color: #27272a;"></div>
                            <div class="flex-grow">
                                <div id="champion-name" class="text-lg font-bold text-white group-hover:translate-x-1 transition-transform duration-200">Loading...</div>
                                <div id="champion-base" class="text-xs text-zinc-500 mt-0.5"></div>
                            </div>
                            <div class="text-right">
                                <div id="champion-titles" class="text-2xl font-black" style="color: #ffffff;"></div>
                                <div class="text-[9px] text-zinc-600 uppercase tracking-wider">Titles</div>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
            
            <!-- Teams Grid (Champion will be hidden via JS) -->
            <div id="teams-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <?php foreach ($teamData as $id => $t): ?>
                <a href="/teams/<?php echo $id; ?>" data-team-id="<?php echo $id; ?>" class="team-card stat-card rounded-lg p-6 hover:bg-zinc-800/50 transition group">
                    <div class="flex items-center gap-4">
                        <div class="w-2 h-12 rounded" style="background-color: <?php echo $t['color']; ?>;"></div>
                        <div class="flex-grow">
                            <div class="text-lg font-bold text-white group-hover:translate-x-1 transition-transform"><?php echo $t['name']; ?></div>
                            <div class="text-xs text-zinc-500"><?php echo $t['base']; ?></div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-black" style="color: <?php echo $t['color']; ?>;"><?php echo $t['worldChampionships']; ?></div>
                            <div class="text-[9px] text-zinc-600 uppercase">Titles</div>
                        </div>
                    </div>
                </a>
                <?php endforeach; ?>
            </div>

            <!-- Other Teams Section -->
            <div class="flex items-center gap-4 mt-10 mb-6">
                <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest whitespace-nowrap">Past Teams</span>
                <div class="flex-grow h-px bg-zinc-700"></div>
            </div>

            <!-- Search and Filters -->
            <div class="mb-6 space-y-4">
                <!-- Search Bar -->
                <div class="relative">
                    <input type="text" id="team-search" placeholder="Search teams by name..."
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
                        <button id="team-decade-filter-btn" onclick="toggleTeamFilter('decade')"
                                class="filter-chip px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                style="background-color: #18181b; border: 1px solid #3f3f46; color: #a1a1aa;">
                            Decade <span id="team-decade-count" class="hidden ml-1 px-1.5 rounded-full" style="background-color: #dc2626; color: white;"></span>
                            <svg class="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div id="team-decade-filter-menu" class="hidden absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg py-2 z-50 max-h-64 overflow-y-auto"
                             style="background-color: #1a1a1f; border: 1px solid #3f3f46;">
                            <!-- Will be populated by JS -->
                        </div>
                    </div>

                    <!-- Nationality Filter -->
                    <div class="relative">
                        <button id="team-nationality-filter-btn" onclick="toggleTeamFilter('nationality')"
                                class="filter-chip px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                style="background-color: #18181b; border: 1px solid #3f3f46; color: #a1a1aa;">
                            Nationality <span id="team-nationality-count" class="hidden ml-1 px-1.5 rounded-full" style="background-color: #dc2626; color: white;"></span>
                            <svg class="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div id="team-nationality-filter-menu" class="hidden absolute top-full left-0 mt-2 w-64 rounded-md shadow-lg py-2 z-50 max-h-64 overflow-y-auto"
                             style="background-color: #1a1a1f; border: 1px solid #3f3f46;">
                            <!-- Will be populated by JS -->
                        </div>
                    </div>

                    <!-- Constructor Champions Filter -->
                    <button id="team-champions-filter-btn" onclick="toggleTeamChampionsFilter()"
                            class="filter-chip px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                            style="background-color: #18181b; border: 1px solid #3f3f46; color: #a1a1aa;">
                        <svg class="inline w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                        Constructor Champions
                    </button>

                    <!-- Clear Filters -->
                    <button id="team-clear-filters-btn" onclick="clearTeamFilters()"
                            class="hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:bg-red-700"
                            style="background-color: #dc2626; color: white;">
                        Clear All
                    </button>
                </div>
            </div>

            <!-- Other Teams Grid -->
            <div id="other-teams-grid" class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div class="text-zinc-500 text-sm col-span-2 text-center py-8">Loading teams...</div>
            </div>

            <!-- Pagination Controls -->
            <div class="flex justify-center items-center gap-4">
                <span class="text-xs text-zinc-500">Show per page:</span>
                <select id="team-entries-per-page" onchange="changeTeamEntriesPerPage()"
                        class="px-3 py-1.5 rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                        style="background-color: #18181b; border: 1px solid #3f3f46; color: #e2e8f0;">
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
                <span id="team-entries-info" class="text-xs text-zinc-500"></span>
            </div>

        </div>

        <?php else: ?>
        <!-- TEAM NOT FOUND -->
        <div class="glass-panel rounded-xl p-8 text-center">
            <h1 class="text-3xl font-black text-red-500 mb-4">Team Not Found</h1>
            <p class="text-zinc-500 mb-6">The team "<?php echo $teamId; ?>" could not be found.</p>
            <a href="/teams" class="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition">View All Teams</a>
        </div>
        <?php endif; ?>

    </div>

    <!-- Footer -->
    <footer class="border-t border-zinc-800 py-6 mt-auto">
        <div class="container mx-auto px-4 text-center text-zinc-600 text-xs">
            GRIDSTATS Â© 2025 | Not affiliated with Formula 1 or FIA
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
    const currentTeamId = '<?php echo $teamId; ?>';

    // Team colors and data mapping
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

    const teamBases = {
        "red_bull": "Milton Keynes, United Kingdom",
        "ferrari": "Maranello, Italy",
        "mclaren": "Woking, United Kingdom",
        "mercedes": "Brackley, United Kingdom",
        "aston_martin": "Silverstone, United Kingdom",
        "alpine": "Enstone, United Kingdom",
        "williams": "Grove, United Kingdom",
        "rb": "Faenza, Italy",
        "audi": "Hinwil, Switzerland",
        "haas": "Kannapolis, United States",
        "cadillac": "Silverstone, United Kingdom"
    };

    const teamTitles = {
        "red_bull": 6,
        "ferrari": 16,
        "mclaren": 8,
        "mercedes": 8,
        "aston_martin": 0,
        "alpine": 0,
        "williams": 9,
        "rb": 0,
        "audi": 0,
        "haas": 0,
        "cadillac": 0
    };

    // Load champion/leader data
    async function loadChampionData() {
        const currentYear = new Date().getFullYear();
        const lastCompletedSeason = currentYear - 1;
        
        try {
            const res = await fetch(`${API_BASE}${lastCompletedSeason}/constructorStandings`);
            const data = await res.json();
            
            if (data.MRData && 
                data.MRData.StandingsTable.StandingsLists && 
                data.MRData.StandingsTable.StandingsLists.length > 0 &&
                data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings &&
                data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.length > 0) {
                
                const champion = data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings[0];
                updateChampionCard(lastCompletedSeason, champion.Constructor.name, champion.Constructor.constructorId);
                hideTeamFromGrid(champion.Constructor.constructorId);
            }
        } catch (error) {
            console.error('Error loading champion data:', error);
            const nameEl = document.getElementById('champion-name');
            if (nameEl) nameEl.textContent = 'Data unavailable';
        }
    }

    function updateChampionCard(year, name, constructorId) {
        const yearEl = document.getElementById('champion-year');
        const nameEl = document.getElementById('champion-name');
        const colorEl = document.getElementById('champion-color-bar');
        const baseEl = document.getElementById('champion-base');
        const titlesEl = document.getElementById('champion-titles');
        const linkEl = document.getElementById('champion-card-link');
        
        if (yearEl) yearEl.textContent = year;
        if (nameEl) nameEl.textContent = name;
        if (colorEl) colorEl.style.backgroundColor = teamColors[constructorId] || '#FFFFFF';
        if (baseEl) baseEl.textContent = teamBases[constructorId] || '';
        if (titlesEl) {
            titlesEl.textContent = teamTitles[constructorId] || 0;
            titlesEl.style.color = teamColors[constructorId] || '#FFFFFF';
        }
        if (linkEl) linkEl.href = `/teams/${constructorId}`;
    }

    function hideTeamFromGrid(constructorId) {
        const teamCard = document.querySelector(`[data-team-id="${constructorId}"]`);
        if (teamCard) {
            teamCard.style.display = 'none';
        }
    }

    // Load data for individual team page
    if (currentTeamId) {
        fetch(`${API_BASE}2025/driverStandings`)
            .then(res => res.json())
            .then(data => {
                if (data.MRData && data.MRData.StandingsTable.StandingsLists[0]) {
                    const drivers = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
                    const teamDrivers = drivers.filter(d => 
                        d.Constructors.some(c => c.constructorId === currentTeamId)
                    );
                    
                    const container = document.getElementById('team-drivers');
                    if (container && teamDrivers.length > 0) {
                        container.innerHTML = teamDrivers.map(d => `
                            <div class="stat-card rounded-lg p-4 flex items-center gap-4">
                                <div class="text-2xl font-black text-zinc-600">${d.position}</div>
                                <div class="flex-grow">
                                    <div class="text-white font-bold">${d.Driver.givenName} ${d.Driver.familyName}</div>
                                    <div class="text-xs text-zinc-500">#${d.Driver.permanentNumber}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold text-red-500">${d.points}</div>
                                    <div class="text-[9px] text-zinc-600 uppercase">Points</div>
                                </div>
                            </div>
                        `).join('');
                    } else if (container) {
                        container.innerHTML = '<div class="text-zinc-500">No driver data available</div>';
                    }
                }
            })
            .catch(err => {
                console.error('Error loading drivers:', err);
                const container = document.getElementById('team-drivers');
                if (container) container.innerHTML = '<div class="text-zinc-500">Error loading driver data</div>';
            });

        fetch(`${API_BASE}2025/constructorStandings`)
            .then(res => res.json())
            .then(data => {
                if (data.MRData && data.MRData.StandingsTable.StandingsLists[0]) {
                    const standings = data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
                    const team = standings.find(c => c.Constructor.constructorId === currentTeamId);
                    
                    const container = document.getElementById('team-performance');
                    if (container && team) {
                        container.innerHTML = `
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div class="stat-card rounded-lg p-4 text-center">
                                    <div class="text-2xl font-black text-white">${team.position}</div>
                                    <div class="text-[9px] text-zinc-500 uppercase">Championship Position</div>
                                </div>
                                <div class="stat-card rounded-lg p-4 text-center">
                                    <div class="text-2xl font-black text-red-500">${team.points}</div>
                                    <div class="text-[9px] text-zinc-500 uppercase">Points</div>
                                </div>
                                <div class="stat-card rounded-lg p-4 text-center">
                                    <div class="text-2xl font-black text-white">${team.wins}</div>
                                    <div class="text-[9px] text-zinc-500 uppercase">Wins</div>
                                </div>
                                <div class="stat-card rounded-lg p-4 text-center">
                                    <div class="text-2xl font-black text-white">${team.Constructor.nationality}</div>
                                    <div class="text-[9px] text-zinc-500 uppercase">Nationality</div>
                                </div>
                            </div>
                        `;
                    } else if (container) {
                        container.innerHTML = '<div class="text-zinc-500">No performance data available</div>';
                    }
                }
            })
            .catch(err => {
                console.error('Error loading performance:', err);
                const container = document.getElementById('team-performance');
                if (container) container.innerHTML = '<div class="text-zinc-500">Error loading performance data</div>';
            });
    }

    // Load champion data on page load (only on teams list page)
    document.addEventListener('DOMContentLoaded', function() {
        if (!currentTeamId && document.getElementById('champion-card-link')) {
            loadChampionData();
            loadOtherTeams();
        }
    });

    // ========== OTHER TEAMS SEARCH & FILTER FUNCTIONALITY ==========

    let allOtherTeams = [];
    let filteredTeams = [];
    let activeDecades = [];
    let activeNationalities = [];
    let championsOnly = false;
    let currentPage = 1;
    let entriesPerPage = 25;

    // Load other teams from database
    async function loadOtherTeams() {
        try {
            console.log('Fetching constructors from:', `${API_BASE}constructors`);
            const res = await fetch(`${API_BASE}constructors`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log('Constructors data received:', data);

            if (data && data.constructors && data.constructors.length > 0) {
                allOtherTeams = data.constructors;
                console.log(`Loaded ${allOtherTeams.length} teams`);
                populateFilters();
                applyFilters();
            } else {
                console.warn('No constructors found in response');
                document.getElementById('other-teams-grid').innerHTML =
                    '<div class="text-zinc-500 text-sm col-span-2 text-center py-8">No historical teams found in database</div>';
            }
        } catch (error) {
            console.error('Error loading other teams:', error);
            document.getElementById('other-teams-grid').innerHTML =
                `<div class="text-zinc-500 text-sm col-span-2 text-center py-8">Error loading teams: ${error.message}</div>`;
        }
    }

    // Populate filter dropdowns
    function populateFilters() {
        console.log('Populating filters with', allOtherTeams.length, 'teams');

        // Extract unique decades
        const decades = new Set();
        allOtherTeams.forEach(team => {
            if (team.first_entry && team.first_entry !== null) {
                const decade = Math.floor(parseInt(team.first_entry) / 10) * 10;
                if (!isNaN(decade)) {
                    decades.add(decade);
                }
            }
        });

        console.log('Found decades:', Array.from(decades));

        // Populate decade filter
        const decadeMenu = document.getElementById('team-decade-filter-menu');
        if (decadeMenu) {
            if (decades.size > 0) {
                decadeMenu.innerHTML = Array.from(decades).sort((a, b) => b - a).map(decade => `
                    <label class="flex items-center px-4 py-2 hover:bg-zinc-800 cursor-pointer transition">
                        <input type="checkbox" value="${decade}" onchange="toggleDecadeFilter(${decade})"
                               class="mr-2 rounded" style="accent-color: #dc2626;">
                        <span class="text-sm text-zinc-300">${decade}s</span>
                    </label>
                `).join('');
            } else {
                decadeMenu.innerHTML = '<div class="px-4 py-2 text-xs text-zinc-500">No data</div>';
            }
        }

        // Extract unique nationalities
        const nationalities = new Set();
        allOtherTeams.forEach(team => {
            if (team.nationality && team.nationality !== null) {
                nationalities.add(team.nationality);
            }
        });

        console.log('Found nationalities:', Array.from(nationalities));

        // Populate nationality filter
        const nationalityMenu = document.getElementById('team-nationality-filter-menu');
        if (nationalityMenu) {
            if (nationalities.size > 0) {
                nationalityMenu.innerHTML = Array.from(nationalities).sort().map(nat => `
                    <label class="flex items-center px-4 py-2 hover:bg-zinc-800 cursor-pointer transition">
                        <input type="checkbox" value="${nat}" onchange="toggleNationalityFilter('${nat}')"
                               class="mr-2 rounded" style="accent-color: #dc2626;">
                        <span class="text-sm text-zinc-300">${nat}</span>
                    </label>
                `).join('');
            } else {
                nationalityMenu.innerHTML = '<div class="px-4 py-2 text-xs text-zinc-500">No data</div>';
            }
        }
    }

    // Toggle filter dropdowns
    function toggleTeamFilter(filterType) {
        const menus = {
            'decade': document.getElementById('team-decade-filter-menu'),
            'nationality': document.getElementById('team-nationality-filter-menu')
        };

        // Close all other menus
        Object.keys(menus).forEach(key => {
            if (key !== filterType && menus[key]) {
                menus[key].classList.add('hidden');
            }
        });

        // Toggle current menu
        if (menus[filterType]) {
            menus[filterType].classList.toggle('hidden');
        }
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.relative')) {
            document.getElementById('team-decade-filter-menu')?.classList.add('hidden');
            document.getElementById('team-nationality-filter-menu')?.classList.add('hidden');
        }
    });

    // Toggle decade filter
    function toggleDecadeFilter(decade) {
        const index = activeDecades.indexOf(decade);
        if (index > -1) {
            activeDecades.splice(index, 1);
        } else {
            activeDecades.push(decade);
        }
        updateFilterUI();
        applyFilters();
    }

    // Toggle nationality filter
    function toggleNationalityFilter(nationality) {
        const index = activeNationalities.indexOf(nationality);
        if (index > -1) {
            activeNationalities.splice(index, 1);
        } else {
            activeNationalities.push(nationality);
        }
        updateFilterUI();
        applyFilters();
    }

    // Toggle champions filter
    function toggleTeamChampionsFilter() {
        championsOnly = !championsOnly;
        const btn = document.getElementById('team-champions-filter-btn');
        if (btn) {
            if (championsOnly) {
                btn.style.backgroundColor = '#dc2626';
                btn.style.borderColor = '#dc2626';
                btn.style.color = 'white';
            } else {
                btn.style.backgroundColor = '#18181b';
                btn.style.borderColor = '#3f3f46';
                btn.style.color = '#a1a1aa';
            }
        }
        applyFilters();
    }

    // Clear all filters
    function clearTeamFilters() {
        activeDecades = [];
        activeNationalities = [];
        championsOnly = false;
        document.getElementById('team-search').value = '';

        // Reset all checkboxes
        document.querySelectorAll('#team-decade-filter-menu input, #team-nationality-filter-menu input')
            .forEach(cb => cb.checked = false);

        updateFilterUI();
        applyFilters();
    }

    // Update filter UI indicators
    function updateFilterUI() {
        const decadeBtn = document.getElementById('team-decade-filter-btn');
        const decadeCount = document.getElementById('team-decade-count');
        const nationalityBtn = document.getElementById('team-nationality-filter-btn');
        const nationalityCount = document.getElementById('team-nationality-count');
        const clearBtn = document.getElementById('team-clear-filters-btn');
        const championsBtn = document.getElementById('team-champions-filter-btn');

        // Update decade filter
        if (activeDecades.length > 0) {
            decadeBtn.style.backgroundColor = '#dc2626';
            decadeBtn.style.borderColor = '#dc2626';
            decadeBtn.style.color = 'white';
            decadeCount.textContent = activeDecades.length;
            decadeCount.classList.remove('hidden');
        } else {
            decadeBtn.style.backgroundColor = '#18181b';
            decadeBtn.style.borderColor = '#3f3f46';
            decadeBtn.style.color = '#a1a1aa';
            decadeCount.classList.add('hidden');
        }

        // Update nationality filter
        if (activeNationalities.length > 0) {
            nationalityBtn.style.backgroundColor = '#dc2626';
            nationalityBtn.style.borderColor = '#dc2626';
            nationalityBtn.style.color = 'white';
            nationalityCount.textContent = activeNationalities.length;
            nationalityCount.classList.remove('hidden');
        } else {
            nationalityBtn.style.backgroundColor = '#18181b';
            nationalityBtn.style.borderColor = '#3f3f46';
            nationalityBtn.style.color = '#a1a1aa';
            nationalityCount.classList.add('hidden');
        }

        // Update champions filter
        if (championsOnly) {
            championsBtn.style.backgroundColor = '#dc2626';
            championsBtn.style.borderColor = '#dc2626';
            championsBtn.style.color = 'white';
        } else {
            championsBtn.style.backgroundColor = '#18181b';
            championsBtn.style.borderColor = '#3f3f46';
            championsBtn.style.color = '#a1a1aa';
        }

        // Show/hide clear button
        const hasActiveFilters = activeDecades.length > 0 ||
                                 activeNationalities.length > 0 ||
                                 championsOnly ||
                                 document.getElementById('team-search').value.trim() !== '';
        if (clearBtn) {
            clearBtn.classList.toggle('hidden', !hasActiveFilters);
        }
    }

    // Apply filters and search
    function applyFilters() {
        const searchTerm = document.getElementById('team-search').value.toLowerCase().trim();
        console.log('Applying filters - Search:', searchTerm, 'Decades:', activeDecades, 'Nationalities:', activeNationalities, 'Champions only:', championsOnly);

        filteredTeams = allOtherTeams.filter(team => {
            // Search filter
            if (searchTerm && !team.name.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Decade filter
            if (activeDecades.length > 0) {
                if (!team.first_entry) return false;
                const teamDecade = Math.floor(parseInt(team.first_entry) / 10) * 10;
                if (!activeDecades.includes(teamDecade)) {
                    return false;
                }
            }

            // Nationality filter
            if (activeNationalities.length > 0 && !activeNationalities.includes(team.nationality)) {
                return false;
            }

            // Champions filter
            if (championsOnly && (!team.championships || parseInt(team.championships) === 0)) {
                return false;
            }

            return true;
        });

        console.log('Filtered teams count:', filteredTeams.length);
        currentPage = 1;
        renderTeams();
        updateFilterUI();
    }

    // Render teams grid
    function renderTeams() {
        const grid = document.getElementById('other-teams-grid');
        if (!grid) return;

        if (filteredTeams.length === 0) {
            grid.innerHTML = '<div class="text-zinc-500 text-sm col-span-2 text-center py-8">No teams found</div>';
            updateEntriesInfo(0, 0, 0);
            return;
        }

        // Pagination
        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = Math.min(startIndex + entriesPerPage, filteredTeams.length);
        const teamsToShow = filteredTeams.slice(startIndex, endIndex);

        grid.innerHTML = teamsToShow.map(team => `
            <div class="stat-card rounded-lg p-4 hover:bg-zinc-800/50 transition">
                <div class="flex items-center gap-3">
                    <div class="w-1.5 h-10 rounded" style="background-color: ${team.color_primary || '#888'};"></div>
                    <div class="flex-grow">
                        <div class="text-sm font-bold text-white">${team.name}</div>
                        <div class="text-xs text-zinc-500">${team.nationality || 'Unknown'}</div>
                    </div>
                    ${team.championships ? `
                        <div class="text-right">
                            <div class="text-lg font-black" style="color: ${team.color_primary || '#888'};">${team.championships}</div>
                            <div class="text-[8px] text-zinc-600 uppercase">Titles</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        updateEntriesInfo(startIndex + 1, endIndex, filteredTeams.length);
    }

    // Update entries info display
    function updateEntriesInfo(start, end, total) {
        const info = document.getElementById('team-entries-info');
        if (info) {
            info.textContent = `Showing ${start} to ${end} of ${total} teams`;
        }
    }

    // Change entries per page
    function changeTeamEntriesPerPage() {
        const select = document.getElementById('team-entries-per-page');
        entriesPerPage = parseInt(select.value);
        currentPage = 1;
        renderTeams();
    }

    // Search input event listener
    document.getElementById('team-search')?.addEventListener('input', applyFilters);
</script>

</body>
</html>
