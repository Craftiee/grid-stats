<?php
session_start();

// Check if user is authenticated
if (!isset($_SESSION['f1stats_authenticated']) || $_SESSION['f1stats_authenticated'] !== true) {
    header('Location: login.php');
    exit;
}

$currentYear = 2026;

?>
<?php 
$pageTitle = 'GRIDSTATS | The Home of Racing Data';
include 'includes/head.php'; 
?>

    <!-- Page-specific styles for dashboard -->
    <style>

        #season-select {
            position: relative;
            z-index: 100;
            overflow-y: auto;
        }

        #season-select option {
            padding: 8px;
        }
        /* Driver Standings Panel */
        .driver-standings-panel { background-color: #15151a !important; }
        .driver-standings-header { background-color: #15151a !important; }
        .driver-card { background-color: #1a1a1f !important; }
        
        /* Constructor Panel */
        .constructor-panel { background-color: #15151a !important; }
        .constructor-header { background-color: #15151a !important; }
        .constructor-card { background-color: #1a1a1f !important; }
        
        /* Center Panel */
        .center-panel { background-color: #18181b !important; }

        #season-select {
    background-color: #000000;
    color: #ffffff;
}

#season-select option {
    padding: 6px 8px;
    background-color: #000000;
    color: #ffffff;
}

#season-select option:hover,
#season-select option:focus,
#season-select option:checked {
    background-color: #dc2626;
    color: #ffffff;
}
    </style>

<body class="antialiased min-h-screen flex flex-col" style="background-color: #050505; color: #e2e8f0; font-family: 'Titillium Web', system-ui, sans-serif;">

    <?php $activePage = 'dashboard'; include 'includes/navbar.php'; ?>

    <div class="container mx-auto mt-6 px-4 flex-grow pb-6">
        
        <div class="flex flex-col md:flex-row gap-4">
            
            <!-- LEFT COLUMN: Constructor Standings + News -->
            <div class="hidden md:flex flex-col w-full md:w-80 flex-shrink-0 gap-4">
                
                <!-- Constructor Standings Panel -->
                <div class="constructor-panel flex-col z-20 rounded-xl" style="background-color: #15151a; border: 1px solid #3f3f46;">
                    <div id="constructor-container" class="p-0 relative">
                        <!-- Header -->
                        <div class="z-20 constructor-header px-3 pt-3 pb-2 flex justify-between items-center h-[52px] rounded-t-xl" style="background-color: #15151a;">
                            <h3 class="text-xs font-bold tracking-widest uppercase" style="color: #e2e8f0;">
                                Constructors
                            </h3>
                        </div>
                        <div id="team-leaders">
                            <!-- Loading state - will be populated by JS -->
                            <div class="flex justify-center py-8">
                                <div class="loader"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent News Panel -->
                <div class="news-panel flex-col z-20">
                    <!-- Header -->
                    <div class="px-1 pb-3 flex justify-between items-center">
                        <h3 class="text-xs font-bold tracking-widest uppercase" style="color: #e2e8f0;">
                            Recent News
                        </h3>
                        <a href="#" class="text-[10px] font-bold uppercase tracking-wide hover:underline" style="color: #dc2626;">View All →</a>
                    </div>
                    
                    <!-- News Cards (Floating style - no panel background) -->
                    <div id="news-container" class="flex flex-col gap-3">
                        <!-- Placeholder - No news -->
                        <div class="rounded-lg p-6 text-center" style="background-color: #1a1a1f; border: 1px solid #27272a;">
                            <svg class="w-8 h-8 mx-auto mb-2" style="color: #3f3f46;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                            </svg>
                            <p class="text-xs font-medium" style="color: #71717a;">No current news</p>
                        </div>
                    </div>
                </div>
                
            </div>

            <!-- CENTER PANEL: Schedule & Results -->
            <div class="flex-1 flex flex-col relative z-10 min-w-0 center-panel rounded-xl" style="background-color: #18181b; border: 1px solid #27272a;">
                <!-- Tab Switcher Bar -->
                <div class="z-20 px-6 pt-4 pb-3 flex justify-center" style="background-color: #18181b; border-radius: 12px 12px 0 0;">
                    <div id="center-tab-bar" class="relative flex rounded-lg overflow-hidden" style="background-color: #27272a;">
                        <!-- Sliding Background -->
                        <div id="tab-slider" class="absolute top-0 left-0 h-full w-1/2 rounded-lg transition-transform duration-300 ease-out" style="background-color: #dc2626;"></div>
                        <!-- Schedule Tab -->
                        <button id="tab-schedule" onclick="switchCenterTab('schedule')" class="relative z-10 px-16 py-2 text-sm font-bold uppercase tracking-wider transition-colors duration-300" style="color: #ffffff;">
                            Schedule
                        </button>
                        <!-- Results Tab -->
                        <button id="tab-results" onclick="switchCenterTab('results')" class="relative z-10 px-16 py-2 text-sm font-bold uppercase tracking-wider transition-colors duration-300" style="color: #a1a1aa;">
                            Results
                        </button>
                    </div>
                </div>
                
                <div id="center-display" class="p-0 flex flex-col">
                     <div class="p-20 text-center">
                        <div class="loader mx-auto mb-4"></div>
                        <span class="text-sm" style="color: #a1a1aa;">Loading Season Data...</span>
                     </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Driver Standings + Forum -->
            <div class="hidden md:flex flex-col w-full md:w-[400px] flex-shrink-0 gap-4">
                
                <!-- Driver Standings Panel -->
<div class="driver-standings-panel flex flex-col z-30 shadow-2xl rounded-xl" style="background-color: #15151a; border: 1px solid #3f3f46; height: 780px;">
    <!-- Header OUTSIDE the scroll container -->
    <div class="driver-standings-header px-3 pt-3 pb-2 flex justify-between items-center h-[52px]" style="background-color: #15151a; border-radius: 12px 12px 0 0;">
        <h2 class="text-xs font-bold tracking-widest uppercase" style="color: #e2e8f0;">
            Driver Standings
        </h2>
        <!-- Custom Year Dropdown -->
        <div class="relative" id="year-dropdown-container">
            <button type="button" onclick="toggleYearDropdown()" id="year-dropdown-btn" 
                    style="background-color: #000000; color: #ffffff; border: 1px solid #3f3f46; font-size: 10px; font-weight: bold; padding: 4px 12px 4px 8px; border-radius: 4px; text-transform: uppercase; cursor: pointer; min-width: 60px; text-align: left; position: relative;">
                <span id="selected-year"><?= $currentYear ?></span>
                <svg class="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 transition-transform" id="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div id="year-dropdown-list" class="hidden absolute right-0 mt-1 rounded overflow-hidden z-50" 
                 style="background-color: #000000; border: 1px solid #3f3f46; max-height: 130px; overflow-y: auto; min-width: 60px;">
                <?php for ($y = 2026; $y >= 2018; $y--): ?>
                    <div class="year-option px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer transition-colors hover:bg-red-600" 
                         style="color: #ffffff;" 
                         data-value="<?= $y ?>" 
                         onclick="selectYear(<?= $y ?>)"><?= $y ?></div>
                <?php endfor; ?>
            </div>
        </div>
        <!-- Hidden select for compatibility -->
<?php $currentYear = 2026; // Set to newest year ?>
<select id="season-select" class="hidden">
    <?php for ($y = 2026; $y >= 2018; $y--): ?>
        <option value="<?= $y ?>" <?= $y == $currentYear ? 'selected' : '' ?>><?= $y ?></option>
    <?php endfor; ?>
</select>
    </div>
    <!-- Scrolling container for driver list only -->
    <div id="accordion-container" class="flex-grow overflow-y-auto custom-scroll p-0 relative">
        <!-- Loading state -->
        <div class="flex justify-center py-20">
            <div class="loader"></div>
        </div>
    </div>
</div>
                
                <!-- Recent Forum Panel -->
                <div class="forum-panel flex-col z-20 rounded-xl" style="background-color: #15151a; border: 1px solid #3f3f46;">
                    <!-- Header -->
                    <div class="px-3 pt-3 pb-2 flex justify-between items-center">
                        <h3 class="text-xs font-bold tracking-widest uppercase" style="color: #e2e8f0;">
                            Recent Posts
                        </h3>
                        <a href="#" class="text-[10px] font-bold uppercase tracking-wide hover:underline" style="color: #dc2626;">View Forum →</a>
                    </div>
                    
                    <!-- Forum Posts -->
                    <div id="forum-container" class="p-3 pt-0">
                        <!-- Placeholder - No posts -->
                        <div class="rounded-lg p-6 text-center" style="background-color: #1a1a1f; border: 1px solid #27272a;">
                            <svg class="w-8 h-8 mx-auto mb-2" style="color: #3f3f46;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
                            </svg>
                            <p class="text-xs font-medium" style="color: #71717a;">No current posts</p>
                        </div>
                    </div>
                </div>
                
            </div>

        </div>
    </div>

    <script>
        // Custom Year Dropdown Functions
        function toggleYearDropdown() {
            const list = document.getElementById('year-dropdown-list');
            const arrow = document.getElementById('dropdown-arrow');
            list.classList.toggle('hidden');
            arrow.classList.toggle('rotate-180');
        }

        function selectYear(year) {
            // Update display
            document.getElementById('selected-year').textContent = year;
            // Update hidden select
            document.getElementById('season-select').value = year;
            // Close dropdown
            document.getElementById('year-dropdown-list').classList.add('hidden');
            document.getElementById('dropdown-arrow').classList.remove('rotate-180');
            // Trigger data refresh
            changeSeason();
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const container = document.getElementById('year-dropdown-container');
            if (container && !container.contains(e.target)) {
                document.getElementById('year-dropdown-list').classList.add('hidden');
                document.getElementById('dropdown-arrow').classList.remove('rotate-180');
            }
        });
    </script>
    <script src="js/app.js?v=94"></script>
</body>
</html>
