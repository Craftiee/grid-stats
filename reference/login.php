<?php
session_start();

// Beta tester credentials with roles
$valid_users = [
    'GridStatsTestAcc' => ['password' => 'GridStatsMPGTest', 'admin' => false],
    'GridStatsAdmin' => ['password' => 'GridStatsWicks7399@', 'admin' => true]
];

$error = '';

// Check if already logged in
if (isset($_SESSION['f1stats_authenticated']) && $_SESSION['f1stats_authenticated'] === true) {
    header('Location: index.php');
    exit;
}

// Handle login attempt
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (isset($valid_users[$username]) && $valid_users[$username]['password'] === $password) {
        $_SESSION['f1stats_authenticated'] = true;
        $_SESSION['f1stats_user'] = $username;
        $_SESSION['f1stats_admin'] = $valid_users[$username]['admin'];
        $_SESSION['f1stats_login_time'] = time();
        header('Location: index.php');
        exit;
    } else {
        $error = 'Invalid username or password';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GRIDSTATS | Beta Access</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600;1,700&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #050505;
            font-family: 'Titillium Web', system-ui, sans-serif;
        }
        
        .login-card {
            background-color: #15151a;
            border: 1px solid #3f3f46;
        }
        
        .input-field {
            background-color: #0a0a0a;
            border: 1px solid #27272a;
            color: #e2e8f0;
            transition: border-color 0.2s ease;
        }
        
        .input-field:focus {
            outline: none;
            border-color: #dc2626;
        }
        
        .input-field::placeholder {
            color: #52525b;
        }
        
        .btn-login {
            background-color: #dc2626;
            transition: all 0.2s ease;
        }
        
        .btn-login:hover {
            background-color: #b91c1c;
            transform: translateY(-1px);
        }
        
        .btn-login:active {
            transform: translateY(0);
        }
        
        /* Logo STATS text */
        .stats-text {
            color: #ffffff !important;
            -webkit-text-stroke: 0 !important;
        }
        
        .racing-stripe {
            background: linear-gradient(90deg, 
                transparent 0%, 
                transparent 45%, 
                #dc2626 45%, 
                #dc2626 55%, 
                transparent 55%, 
                transparent 100%
            );
        }
        
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.3); }
            50% { box-shadow: 0 0 40px rgba(220, 38, 38, 0.5); }
        }
        
        .glow-pulse {
            animation: pulse-glow 2s ease-in-out infinite;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col items-center justify-center p-4">
    
    <!-- Background Racing Stripe -->
    <div class="fixed inset-0 racing-stripe opacity-5 pointer-events-none"></div>
    
    <!-- Login Card -->
    <div class="login-card rounded-2xl p-8 w-full max-w-md relative z-10 glow-pulse">
        
        <!-- Logo -->
        <div class="text-center mb-8">
            <h1 class="text-4xl font-black italic cursor-pointer select-none tracking-[0.15em] inline-block"
                style="transform: skewX(-10deg);">
                <span class="text-red-600 inline-block">GRID</span>
                <span class="inline-block stats-text">STATS</span>
            </h1>
            <div class="h-1 w-32 bg-red-600 mx-auto mt-2" style="transform: skewX(-12deg);"></div>
        </div>
        
        <!-- Beta Badge -->
        <div class="flex justify-center mb-6">
            <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" 
                  style="background-color: rgba(220, 38, 38, 0.2); color: #dc2626; border: 1px solid #dc2626;">
                Beta Access Only
            </span>
        </div>
        
        <!-- Error Message -->
        <?php if ($error): ?>
        <div class="mb-4 p-3 rounded-lg text-center text-sm font-medium" 
             style="background-color: rgba(220, 38, 38, 0.1); border: 1px solid #dc2626; color: #f87171;">
            <?php echo htmlspecialchars($error); ?>
        </div>
        <?php endif; ?>
        
        <!-- Login Form -->
        <form method="POST" action="/login">
            <div class="space-y-4">
                
                <!-- Username -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color: #71717a;">
                        Tester ID
                    </label>
                    <input type="text" 
                           name="username" 
                           class="input-field w-full px-4 py-3 rounded-lg text-sm font-medium"
                           placeholder="Enter your tester ID"
                           required
                           autocomplete="username">
                </div>
                
                <!-- Password -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest mb-2" style="color: #71717a;">
                        Access Code
                    </label>
                    <input type="password" 
                           name="password" 
                           class="input-field w-full px-4 py-3 rounded-lg text-sm font-medium"
                           placeholder="Enter your access code"
                           required
                           autocomplete="current-password">
                </div>
                
                <!-- Submit Button -->
                <button type="submit" 
                        class="btn-login w-full py-3 rounded-lg text-white font-bold uppercase tracking-widest text-sm mt-6">
                    Enter Pit Lane
                </button>
                
            </div>
        </form>
        
        <!-- Footer Note -->
        <p class="text-center text-[10px] mt-6" style="color: #52525b;">
            This site is in closed beta testing.<br>
            Contact the development team for access credentials.
        </p>
        
    </div>
    
    <!-- Version Tag -->
    <div class="fixed bottom-4 right-4 text-[10px] font-mono" style="color: #3f3f46;">
        v0.94-beta
    </div>
    
</body>
</html>
