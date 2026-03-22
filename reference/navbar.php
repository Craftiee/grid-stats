<?php
// includes/navbar.php
// Shared navigation bar for all pages
// Usage: $activePage = 'dashboard'; include 'includes/navbar.php';

$activePage = $activePage ?? 'dashboard';
?>
<nav class="z-50" style="background-color: #18181b; border-bottom: 1px solid #27272a;">
    <div class="container mx-auto px-4">
        <div class="flex justify-between items-end h-24 pb-4"> 
            
            <!-- Logo + Motorsport Selector -->
            <div class="flex-shrink-0 flex items-end mb-2 gap-4">
                <a href="/" class="no-underline">
                    <h1 class="text-5xl font-black italic cursor-pointer select-none tracking-[0.15em] relative z-10"
                        style="transform: skewX(-10deg);">
                        <span class="text-red-600 inline-block">GRID</span>
                        <span class="inline-block stats-text">STATS</span>
                        <div class="absolute -bottom-1 left-0 h-1.5 w-full bg-red-600 skew-x-12"></div>
                    </h1>
                </a>
                
                <!-- Motorsport Dropdown -->
                <div class="relative mb-1" id="motorsport-dropdown-container">
                    <button onclick="toggleMotorsportDropdown()" id="motorsport-btn" 
                            class="flex items-center gap-2 px-3 py-1.5 rounded transition-all duration-200"
                            style="background-color: transparent; border: 1px solid #3f3f46;">
                        <span class="text-sm font-semibold" style="color: #e2e8f0;">Formula One</span>
                        <svg id="motorsport-arrow" class="w-4 h-4 transition-transform duration-200" fill="none" stroke="#71717a" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    
                    <!-- Dropdown Menu -->
                    <div id="motorsport-menu" class="hidden absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50"
                         style="background-color: #1a1a1f; border: 1px solid #3f3f46;">
                        <a href="#" onclick="selectMotorsport('f1'); return false;" 
                           class="motorsport-option block px-4 py-2 text-sm font-medium transition-colors duration-150"
                           style="color: #e2e8f0;">
                            Formula One
                        </a>
                    </div>
                </div>
            </div>

            <div class="nav-container hidden md:flex items-center gap-1 mb-1 relative rounded-lg p-1" style="background-color: #18181b;">
                
                <a href="/" class="nav-btn <?php echo $activePage === 'news' ? 'active' : ''; ?> px-4 py-2 text-sm font-semibold transition uppercase tracking-wide">News</a>
                
                <a href="/" class="nav-btn <?php echo $activePage === 'dashboard' ? 'active' : ''; ?> px-4 py-2 text-sm font-semibold transition uppercase tracking-wide">Dashboard</a>

                <a href="/drivers" class="nav-btn <?php echo $activePage === 'drivers' ? 'active' : ''; ?> px-4 py-2 text-sm font-semibold transition uppercase tracking-wide">Drivers</a>
                <a href="/teams" class="nav-btn <?php echo $activePage === 'teams' ? 'active' : ''; ?> px-4 py-2 text-sm font-semibold transition uppercase tracking-wide">Teams</a>
                <a href="/" class="nav-btn <?php echo $activePage === 'stats' ? 'active' : ''; ?> px-4 py-2 text-sm font-semibold transition uppercase tracking-wide">Stats</a>
                <a href="/" class="nav-btn <?php echo $activePage === 'forum' ? 'active' : ''; ?> px-4 py-2 text-sm font-semibold transition uppercase tracking-wide">Forum</a>

                <div class="relative ml-1">
                    <button onclick="toggleSettings()" class="nav-btn p-2 rounded transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </button>

                    <div id="settings-dropdown" class="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50" style="background-color: #18181b; border: 1px solid #27272a;">
                        <!-- Beta User Info -->
                        <div class="px-4 py-2 border-b" style="border-color: #27272a;">
                            <span class="text-[10px] font-bold uppercase tracking-wide" style="color: #71717a;">Beta Tester</span>
                            <p class="text-sm font-medium" style="color: #e2e8f0;"><?php echo htmlspecialchars($_SESSION['f1stats_user'] ?? 'Unknown'); ?></p>
                        </div>
                        
                        <?php if (isset($_SESSION['f1stats_admin']) && $_SESSION['f1stats_admin'] === true): ?>
                        <!-- Admin Section -->
                        <a href="/admin" class="block px-4 py-2 text-sm font-medium hover:bg-white/5 transition" style="color: #f59e0b;">
                            <span class="flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                                </svg>
                                Admin Panel
                            </span>
                        </a>
                        <div class="h-px" style="background-color: #27272a;"></div>
                        <?php endif; ?>
                        
                        <a href="#" class="block px-4 py-2 text-sm hover:bg-white/5 transition" style="color: #a1a1aa;">Settings</a>
                        <a href="#" class="block px-4 py-2 text-sm hover:bg-white/5 transition" style="color: #a1a1aa;">Send Feedback</a>
                        <div class="h-px my-1" style="background-color: #27272a;"></div>
                        <a href="/logout" class="block px-4 py-2 text-sm font-medium hover:bg-white/5 transition" style="color: #f87171;">Log Out</a>
                    </div>
                </div>

            </div>

            <div class="md:hidden mb-2">
                <button onclick="toggleMobileMenu()" style="color: #a1a1aa;">
                    <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</nav>

<script>
function toggleMotorsportDropdown() {
    const menu = document.getElementById('motorsport-menu');
    const btn = document.getElementById('motorsport-btn');
    menu.classList.toggle('hidden');
    btn.classList.toggle('active');
}

function selectMotorsport(sport) {
    document.getElementById('motorsport-menu').classList.add('hidden');
    document.getElementById('motorsport-btn').classList.remove('active');
}

function toggleSettings() {
    const menu = document.getElementById('settings-dropdown');
    menu.classList.toggle('hidden');
}

function toggleMobileMenu() {
    // Future: implement mobile menu
    console.log('Mobile menu toggle');
}

// Close dropdowns if clicked outside
window.addEventListener('click', function(event) {
    // Motorsport dropdown
    if (!event.target.closest('#motorsport-dropdown-container')) {
        const menu = document.getElementById('motorsport-menu');
        const btn = document.getElementById('motorsport-btn');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            btn.classList.remove('active');
        }
    }
    // Settings dropdown
    if (!event.target.closest('.relative.ml-1')) {
        const menu = document.getElementById('settings-dropdown');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
    }
});
</script>
