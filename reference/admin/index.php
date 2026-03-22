<?php
session_start();

// Check if user is authenticated
if (!isset($_SESSION['f1stats_authenticated']) || $_SESSION['f1stats_authenticated'] !== true) {
    header('Location: ../login.php');
    exit;
}

// Database connection
try {
    $pdo = new PDO("mysql:host=localhost;dbname=f1stats;charset=utf8mb4", 'root', 'F1StatsAdminWicks7399@');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Get stats
$stats = [
    'constructors' => $pdo->query("SELECT COUNT(*) FROM constructors")->fetchColumn(),
    'drivers' => $pdo->query("SELECT COUNT(*) FROM drivers")->fetchColumn(),
    'races' => $pdo->query("SELECT COUNT(*) FROM races")->fetchColumn(),
    'seasons' => $pdo->query("SELECT COUNT(DISTINCT season_year) FROM season_constructors")->fetchColumn(),
];

$pageTitle = 'Admin Dashboard | GRIDSTATS';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pageTitle ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Titillium Web', sans-serif; background-color: #050505; color: #e2e8f0; }
        .card { background-color: #18181b; border: 1px solid #27272a; }
        .stat-card:hover { border-color: #dc2626; transform: translateY(-2px); }
    </style>
</head>
<body class="min-h-screen">
    <!-- Navigation -->
    <nav class="border-b border-zinc-800 bg-zinc-900/50">
        <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-6">
                    <a href="../index.php" class="text-xl font-bold">
                        <span class="text-red-600">GRID</span><span class="text-white">STATS</span>
                    </a>
                    <span class="text-zinc-500">|</span>
                    <span class="text-zinc-400 font-semibold">Admin Panel</span>
                </div>
                <div class="flex items-center gap-4">
                    <a href="index.php" class="text-red-500 text-sm font-bold">Dashboard</a>
                    <a href="constructors.php" class="text-zinc-400 hover:text-white text-sm">Constructors</a>
                    <a href="season-names.php" class="text-zinc-400 hover:text-white text-sm">Season Names</a>
                    <a href="../logout.php" class="text-zinc-500 hover:text-red-500 text-sm">Logout</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="card stat-card rounded-xl p-6 transition-all duration-200 cursor-pointer" onclick="location.href='constructors.php'">
                <div class="text-4xl font-bold text-red-500 mb-2"><?= $stats['constructors'] ?></div>
                <div class="text-zinc-500 text-sm uppercase tracking-wider">Constructors</div>
            </div>
            <div class="card stat-card rounded-xl p-6 transition-all duration-200">
                <div class="text-4xl font-bold text-blue-500 mb-2"><?= $stats['drivers'] ?></div>
                <div class="text-zinc-500 text-sm uppercase tracking-wider">Drivers</div>
            </div>
            <div class="card stat-card rounded-xl p-6 transition-all duration-200">
                <div class="text-4xl font-bold text-green-500 mb-2"><?= $stats['races'] ?></div>
                <div class="text-zinc-500 text-sm uppercase tracking-wider">Races</div>
            </div>
            <div class="card stat-card rounded-xl p-6 transition-all duration-200 cursor-pointer" onclick="location.href='season-names.php'">
                <div class="text-4xl font-bold text-orange-500 mb-2"><?= $stats['seasons'] ?></div>
                <div class="text-zinc-500 text-sm uppercase tracking-wider">Seasons</div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="card rounded-xl p-6 mb-8">
            <h2 class="text-xl font-bold mb-4">Quick Actions</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="constructors.php" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-red-600 rounded-lg p-4 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                        </div>
                        <div>
                            <div class="font-bold">Manage Constructors</div>
                            <div class="text-xs text-zinc-500">Colors, helmets, logos</div>
                        </div>
                    </div>
                </a>
                <a href="season-names.php" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-orange-600 rounded-lg p-4 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <div>
                            <div class="font-bold">Season Names</div>
                            <div class="text-xs text-zinc-500">Historical team names</div>
                        </div>
                    </div>
                </a>
                <a href="../index.php" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-600 rounded-lg p-4 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                        </div>
                        <div>
                            <div class="font-bold">View Site</div>
                            <div class="text-xs text-zinc-500">Go to main site</div>
                        </div>
                    </div>
                </a>
            </div>
        </div>

        <!-- Recent Activity / Info -->
        <div class="card rounded-xl p-6">
            <h2 class="text-xl font-bold mb-4">Database Setup Info</h2>
            <div class="bg-zinc-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <p class="text-zinc-500 mb-2">-- Run these SQL commands to add new columns:</p>
                <pre class="text-green-400">
ALTER TABLE constructors 
ADD COLUMN IF NOT EXISTS helmet_url VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255) DEFAULT NULL;

ALTER TABLE season_constructors 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_override VARCHAR(7) DEFAULT NULL;
                </pre>
            </div>
        </div>
    </div>
</body>
</html>
