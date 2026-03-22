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
            case 'update_constructor':
                $stmt = $pdo->prepare("
                    UPDATE constructors 
                    SET name = ?, 
                        full_name = ?,
                        color_primary = ?, 
                        helmet_url = ?, 
                        logo_url = ?
                    WHERE constructor_id = ?
                ");
                $stmt->execute([
                    $_POST['name'],
                    $_POST['full_name'],
                    $_POST['color_primary'],
                    $_POST['helmet_url'] ?: null,
                    $_POST['logo_url'] ?: null,
                    $_POST['constructor_id']
                ]);
                $message = "Constructor updated successfully!";
                $messageType = 'success';
                break;
        }
    }
}

// Fetch all constructors
$constructors = $pdo->query("
    SELECT c.*, n.name as nationality_name 
    FROM constructors c 
    LEFT JOIN nationalities n ON c.nationality_id = n.id 
    ORDER BY c.name
")->fetchAll(PDO::FETCH_ASSOC);

$pageTitle = 'Manage Constructors | GRIDSTATS Admin';
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
        .color-preview { width: 40px; height: 40px; border-radius: 8px; border: 2px solid #3f3f46; }
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
                    <a href="constructors.php" class="text-red-500 text-sm font-bold">Constructors</a>
                    <a href="season-names.php" class="text-zinc-400 hover:text-white text-sm">Season Names</a>
                    <a href="../logout.php" class="text-zinc-500 hover:text-red-500 text-sm">Logout</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-bold">Manage Constructors</h1>
            <p class="text-zinc-500 text-sm">Update team colors, helmets, and logos</p>
        </div>

        <?php if ($message): ?>
            <div class="mb-6 p-4 rounded-lg <?= $messageType === 'success' ? 'bg-green-900/30 border border-green-800 text-green-400' : 'bg-red-900/30 border border-red-800 text-red-400' ?>">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <!-- Constructor Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <?php foreach ($constructors as $c): ?>
                <div class="card rounded-xl overflow-hidden">
                    <!-- Header with team color -->
                    <div class="h-2" style="background-color: <?= htmlspecialchars($c['color_primary'] ?? '#ffffff') ?>;"></div>
                    
                    <form method="POST" class="p-6">
                        <input type="hidden" name="action" value="update_constructor">
                        <input type="hidden" name="constructor_id" value="<?= htmlspecialchars($c['constructor_id']) ?>">
                        
                        <!-- Team Header -->
                        <div class="flex items-center gap-4 mb-6">
                            <div class="color-preview" style="background-color: <?= htmlspecialchars($c['color_primary'] ?? '#ffffff') ?>;"></div>
                            <div>
                                <h3 class="font-bold text-lg"><?= htmlspecialchars($c['name']) ?></h3>
                                <p class="text-xs text-zinc-500 uppercase tracking-wider"><?= htmlspecialchars($c['constructor_id']) ?></p>
                            </div>
                        </div>

                        <!-- Preview Row -->
                        <div class="flex gap-4 mb-6">
                            <!-- Helmet Preview -->
                            <div class="flex-1 text-center">
                                <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Helmet</p>
                                <div class="w-16 h-16 mx-auto rounded-full overflow-hidden bg-zinc-800 border-2" style="border-color: <?= htmlspecialchars($c['color_primary'] ?? '#3f3f46') ?>;">
                                    <?php if ($c['helmet_url']): ?>
                                        <img src="../<?= htmlspecialchars($c['helmet_url']) ?>" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\'text-zinc-600 text-xs flex items-center justify-center h-full\'>No img</span>'">
                                    <?php else: ?>
                                        <span class="text-zinc-600 text-xs flex items-center justify-center h-full">No img</span>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <!-- Logo Preview -->
                            <div class="flex-1 text-center">
                                <p class="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Logo</p>
                                <div class="w-16 h-16 mx-auto rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
                                    <?php if ($c['logo_url']): ?>
                                        <img src="../<?= htmlspecialchars($c['logo_url']) ?>" class="max-w-full max-h-full object-contain" onerror="this.parentElement.innerHTML='<span class=\'text-zinc-600 text-xs\'>No img</span>'">
                                    <?php else: ?>
                                        <span class="text-zinc-600 text-xs">No img</span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>

                        <!-- Form Fields -->
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Display Name</label>
                                <input type="text" name="name" value="<?= htmlspecialchars($c['name']) ?>" 
                                       class="input-field w-full px-3 py-2 rounded text-sm">
                            </div>
                            
                            <div>
                                <label class="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Full Name</label>
                                <input type="text" name="full_name" value="<?= htmlspecialchars($c['full_name'] ?? '') ?>" 
                                       class="input-field w-full px-3 py-2 rounded text-sm">
                            </div>

                            <div>
                                <label class="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Primary Color</label>
                                <div class="flex gap-2">
                                    <input type="color" name="color_primary" value="<?= htmlspecialchars($c['color_primary'] ?? '#ffffff') ?>" 
                                           class="w-12 h-10 rounded cursor-pointer border-0">
                                    <input type="text" value="<?= htmlspecialchars($c['color_primary'] ?? '#ffffff') ?>" 
                                           class="input-field flex-1 px-3 py-2 rounded text-sm font-mono"
                                           onchange="this.previousElementSibling.value = this.value"
                                           oninput="this.previousElementSibling.value = this.value">
                                </div>
                            </div>

                            <div>
                                <label class="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Helmet URL</label>
                                <input type="text" name="helmet_url" value="<?= htmlspecialchars($c['helmet_url'] ?? '') ?>" 
                                       placeholder="img/helmets/TeamV2Fix.png"
                                       class="input-field w-full px-3 py-2 rounded text-sm font-mono">
                            </div>

                            <div>
                                <label class="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Logo URL</label>
                                <input type="text" name="logo_url" value="<?= htmlspecialchars($c['logo_url'] ?? '') ?>" 
                                       placeholder="img/logos/team.png"
                                       class="input-field w-full px-3 py-2 rounded text-sm font-mono">
                            </div>
                        </div>

                        <button type="submit" class="btn-primary w-full mt-6 py-2 rounded font-bold text-white text-sm uppercase tracking-wider transition">
                            Save Changes
                        </button>
                    </form>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <script>
        // Sync color input with text input
        document.querySelectorAll('input[type="color"]').forEach(colorInput => {
            colorInput.addEventListener('input', function() {
                this.nextElementSibling.value = this.value;
            });
        });
    </script>
</body>
</html>
