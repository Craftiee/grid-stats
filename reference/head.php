<?php
// includes/head.php
// Shared head content for all pages
// Usage: $pageTitle = 'Page Name'; include 'includes/head.php';

$pageTitle = $pageTitle ?? 'GRIDSTATS';
?>
<!DOCTYPE html>
<html lang="en" style="background-color: #050505; color: #e2e8f0;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($pageTitle); ?></title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="GRIDSTATS - Your ultimate Top-Line Racing statistics hub.">
    <meta name="keywords" content="F1, Formula 1, F1 stats, F1 standings, race schedule, driver standings, constructor standings, Formula One statistics">
    <meta name="author" content="GRIDSTATS">
    <meta name="robots" content="index, follow">

    <!-- Open Graph (Facebook, LinkedIn) -->
    <meta property="og:title" content="<?php echo htmlspecialchars($pageTitle); ?>">
    <meta property="og:description" content="Your ultimate Top-Line Racing statistics hub.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://grid-stats.com">
    <meta property="og:image" content="https://grid-stats.com/og-image.png">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($pageTitle); ?>">
    <meta name="twitter:description" content="Your ultimate Top-Line Racing statistics hub.">
    <meta name="twitter:image" content="https://grid-stats.com/og-image.png">
    
    <!-- CRITICAL: Prevent flash of unstyled content -->
    <style id="critical-first">
        html, body { background-color: #050505 !important; color: #e2e8f0 !important; }
        nav { background-color: #18181b !important; }
        .glass-panel { background-color: #18181b !important; }
    </style>
    
    <!-- Load Google Fonts FIRST -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600;1,700&display=swap" rel="stylesheet">
    
    <!-- Tailwind -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            corePlugins: {
                preflight: false
            },
            theme: {
                fontFamily: {
                    'sans': ['Titillium Web', 'system-ui', '-apple-system', 'sans-serif'],
                },
                extend: {
                    colors: {
                        'f1-red': '#FF1801',
                    }
                }
            }
        }
    </script>
    
    <!-- Global Styles -->
    <style>
        /* CSS Reset */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button { background: transparent; border: none; cursor: pointer; font: inherit; color: inherit; }
        select { background-color: #050505; color: #e2e8f0; border: 1px solid #27272a; }
        a { color: inherit; text-decoration: none; }
        img { max-width: 100%; display: block; }
        
        /* Force Titillium Web everywhere */
        html, body, *, *::before, *::after {
            font-family: 'Titillium Web', system-ui, -apple-system, sans-serif !important;
        }

        /* Force scrollbar always visible */
        html {
            overflow-y: scroll;
            background-color: #050505 !important;
            color: #e2e8f0 !important;
        }
        
        /* Body */
        body { 
            background-color: #050505 !important;
            color: #e2e8f0 !important;
            line-height: 1.5;
        }

        /* Shared navbar styles */
        <?php include 'navbar-styles.php'; ?>

        /* Main Glass Panel */
        .glass-panel {
            background-color: #18181b !important;
            border: 1px solid #27272a !important;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1) !important;
        }

        /* Navigation */
        nav {
            background-color: #18181b !important;
            border-bottom: 1px solid #27272a !important;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #dc2626; border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        
        /* Loader */
        .loader {
            border: 3px solid #27272a !important;
            border-top: 3px solid #ef4444 !important;
            border-radius: 50% !important;
            width: 20px !important;
            height: 20px !important;
            animation: spin 1s linear infinite !important;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Motorsport Dropdown Styles */
        #motorsport-btn:hover {
            border-color: #52525b !important;
        }
        
        #motorsport-btn.active {
            background-color: rgba(220, 38, 38, 0.15) !important;
            border-color: #dc2626 !important;
        }
        
        #motorsport-btn.active #motorsport-arrow {
            stroke: #dc2626;
            transform: rotate(180deg);
        }
        
        .motorsport-option:hover {
            background-color: rgba(220, 38, 38, 0.1) !important;
        }

        /* Stat Card (used on teams page) */
        .stat-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
            border: 1px solid #27272a;
        }

        .team-color-bar {
            height: 4px;
            border-radius: 2px;
        }
    </style>
</head>