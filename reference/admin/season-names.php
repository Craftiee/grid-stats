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

$message = '';
$messageType = '';

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'update_season_name':
                $stmt = $pdo->prepare("
                    UPDATE season_constructors 
                    SET display_name = NULLIF(?, ''),
                        color_override = NULLIF(?, '')
                    WHERE season_year = ? AND constructor_id = ?
                ");
                $stmt->execute([
                    $_POST['display_name'],
                    $_POST['color_override'],
                    $_POST['season_year'],
                    $_POST['constructor_id']
                ]);
                $message = "Season name updated for " . $_POST['constructor_id'] . " (" . $_POST['season_year'] . ")";
                $messageType = 'success';
                break;
                
            case 'bulk_update':
                $updates = json_decode($_POST['updates'], true);
                if ($updates) {
                    $stmt = $pdo->prepare("
                        UPDATE season_constructors 
                        SET display_name = NULLIF(?, '')
                        WHERE season_year = ? AND constructor_id = ?
                    ");
                    foreach ($updates as $update) {
                        $stmt->execute([
                            $update['display_name'],
                            $update['season_year'],
                            $update['constructor_id']
                        ]);
                    }
                    $message = "Bulk update completed!";
                    $messageType = 'success';
                }
                break;
        }
    }
}

// Get selected year (default to current)
$selectedYear = $_GET['year'] ?? date('Y');

// Fetch available seasons
$seasons = $pdo->query("SELECT DISTINCT season_year FROM season_constructors ORDER BY season_year DESC")->fetchAll(PDO::FETCH_COLUMN);

// Fetch season_constructors for selected year with base constructor info
$seasonConstructors = $pdo->prepare("
    SELECT sc.*, c.name as base_name, c.color_primary as base_color
    FROM season_constructors sc
    JOIN constructors c ON sc.constructor_id = c.constructor_id
    WHERE sc.season_year = ?
    ORDER BY c.name
");
$seasonConstructors->execute([$selectedYear]);
$seasonConstructors = $seasonConstructors->fetchAll(PDO::FETCH_ASSOC);

// Fetch all constructors for reference
$allConstructors = $pdo->query("SELECT constructor_id, name, color_primary FROM constructors ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);

$pageTitle = 'Season Team Names | GRIDSTATS Admin';
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
        .input-field { background-color: #27272a; border: 1px solid #3f3f46; color: #e2e8f0; }
        .input-field:focus { border-color: #dc2626; outline: none; }
        .btn-primary { background-color: #dc2626; }
        .btn-primary:hover { background-color: #b91c1c; }
        .year-btn { background-color: #27272a; border: 1px solid #3f3f46; }
        .year-btn:hover { border-color: #dc2626; }
        .year-btn.active { background-color: #dc2626; border-color: #dc2626; }
        table { border-collapse: separate; border-spacing: 0; }
        th, td { border-bottom: 1px solid #27272a; }
        tr:hover td { background-color: #1f1f23; }
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
                    <a href="index.php" class="text-zinc-400 hover:text-white text-sm">Dashboard</a>
                    <a href="constructors.php" class="text-zinc-400 hover:text-white text-sm">Constructors</a>
                    <a href="season-names.php" class="text-red-500 text-sm font-bold">Season Names</a>
                    <a href="../logout.php" class="text-zinc-500 hover:text-red-500 text-sm">Logout</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold">Season-Specific Team Names</h1>
                <p class="text-zinc-500 text-sm mt-1">Override team names for historical accuracy (e.g., Alfa Romeo → Kick Sauber → Audi)</p>
            </div>
        </div>

        <?php if ($message): ?>
            <div class="mb-6 p-4 rounded-lg <?= $messageType === 'success' ? 'bg-green-900/30 border border-green-800 text-green-400' : 'bg-red-900/30 border border-red-800 text-red-400' ?>">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <!-- Year Selector -->
        <div class="card rounded-xl p-4 mb-6">
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-zinc-500 text-sm font-semibold mr-2">Select Season:</span>
                <?php foreach ($seasons as $year): ?>
                    <a href="?year=<?= $year ?>" 
                       class="year-btn px-4 py-2 rounded text-sm font-bold transition <?= $year == $selectedYear ? 'active text-white' : 'text-zinc-400' ?>">
                        <?= $year ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Info Box -->
        <div class="card rounded-xl p-4 mb-6 border-l-4 border-l-blue-500">
            <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <div class="text-sm text-zinc-400">
                    <strong class="text-zinc-300">How it works:</strong> 
                    Leave "Display Name" empty to use the default constructor name. 
                    Set a custom name to override it for this specific season.
                    <br><br>
                    <strong class="text-zinc-300">Example:</strong> 
                    For <code class="bg-zinc-800 px-1 rounded">sauber</code>: 
                    2023 → "Alfa Romeo", 2024-2025 → "Kick Sauber", 2026 → "Audi"
                </div>
            </div>
        </div>

        <!-- Season Constructors Table -->
        <div class="card rounded-xl overflow-hidden">
            <table class="w-full">
                <thead>
                    <tr class="bg-zinc-900/50">
                        <th class="text-left px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Constructor ID</th>
                        <th class="text-left px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Default Name</th>
                        <th class="text-left px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Display Name (Override)</th>
                        <th class="text-left px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Color Override</th>
                        <th class="text-center px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($seasonConstructors as $sc): ?>
                        <tr>
                            <form method="POST">
                                <input type="hidden" name="action" value="update_season_name">
                                <input type="hidden" name="season_year" value="<?= $selectedYear ?>">
                                <input type="hidden" name="constructor_id" value="<?= htmlspecialchars($sc['constructor_id']) ?>">
                                
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-3 h-8 rounded" style="background-color: <?= htmlspecialchars($sc['base_color'] ?? '#ffffff') ?>;"></div>
                                        <code class="text-sm font-mono text-zinc-400"><?= htmlspecialchars($sc['constructor_id']) ?></code>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <span class="text-zinc-500"><?= htmlspecialchars($sc['base_name']) ?></span>
                                </td>
                                <td class="px-4 py-3">
                                    <input type="text" name="display_name" 
                                           value="<?= htmlspecialchars($sc['display_name'] ?? '') ?>" 
                                           placeholder="<?= htmlspecialchars($sc['base_name']) ?>"
                                           class="input-field px-3 py-1.5 rounded text-sm w-full max-w-xs">
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <input type="color" name="color_override" 
                                               value="<?= htmlspecialchars($sc['color_override'] ?? $sc['base_color'] ?? '#ffffff') ?>" 
                                               class="w-8 h-8 rounded cursor-pointer border-0">
                                        <input type="text" 
                                               value="<?= htmlspecialchars($sc['color_override'] ?? '') ?>" 
                                               placeholder="Default"
                                               class="input-field px-2 py-1 rounded text-xs font-mono w-24"
                                               onchange="this.previousElementSibling.value = this.value || '<?= htmlspecialchars($sc['base_color'] ?? '#ffffff') ?>'">
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <button type="submit" class="btn-primary px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition">
                                        Save
                                    </button>
                                </td>
                            </form>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- Quick Reference -->
        <div class="card rounded-xl p-6 mt-8">
            <h3 class="font-bold mb-4">Quick Reference: Common Rebrands</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div class="bg-zinc-900/50 rounded-lg p-4">
                    <div class="font-bold text-zinc-300 mb-2">sauber</div>
                    <ul class="space-y-1 text-zinc-500">
                        <li>2018-2019: <span class="text-zinc-300">Sauber</span></li>
                        <li>2020-2023: <span class="text-zinc-300">Alfa Romeo</span></li>
                        <li>2024-2025: <span class="text-zinc-300">Kick Sauber</span></li>
                        <li>2026+: <span class="text-zinc-300">Audi</span></li>
                    </ul>
                </div>
                <div class="bg-zinc-900/50 rounded-lg p-4">
                    <div class="font-bold text-zinc-300 mb-2">rb</div>
                    <ul class="space-y-1 text-zinc-500">
                        <li>2018-2019: <span class="text-zinc-300">Toro Rosso</span></li>
                        <li>2020-2023: <span class="text-zinc-300">AlphaTauri</span></li>
                        <li>2024+: <span class="text-zinc-300">RB / Racing Bulls</span></li>
                    </ul>
                </div>
                <div class="bg-zinc-900/50 rounded-lg p-4">
                    <div class="font-bold text-zinc-300 mb-2">alpine</div>
                    <ul class="space-y-1 text-zinc-500">
                        <li>2018-2020: <span class="text-zinc-300">Renault</span></li>
                        <li>2021+: <span class="text-zinc-300">Alpine</span></li>
                    </ul>
                </div>
                <div class="bg-zinc-900/50 rounded-lg p-4">
                    <div class="font-bold text-zinc-300 mb-2">aston_martin</div>
                    <ul class="space-y-1 text-zinc-500">
                        <li>2018-2018: <span class="text-zinc-300">Force India</span></li>
                        <li>2019-2020: <span class="text-zinc-300">Racing Point</span></li>
                        <li>2021+: <span class="text-zinc-300">Aston Martin</span></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Sync color inputs
        document.querySelectorAll('input[type="color"]').forEach(colorInput => {
            colorInput.addEventListener('input', function() {
                const textInput = this.nextElementSibling;
                if (textInput) textInput.value = this.value;
            });
        });
    </script>
</body>
</html>
