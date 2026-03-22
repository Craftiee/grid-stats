<?php
// includes/navbar-styles.php
// Shared navigation styles for all pages
?>
/* Logo STATS text */
.stats-text {
    color: #ffffff !important;
    -webkit-text-stroke: 0 !important;
}

/* Force consistent nav height */
nav {
    height: 96px;
    min-height: 96px;
    max-height: 96px;
}

nav > .container > div {
    height: 96px;
}

/* Nav Buttons */
.nav-btn { 
    color: #a1a1aa !important;
    position: relative;
    transition: all 0.2s ease;
    text-decoration: none;
}
.nav-btn:hover { 
    color: #e2e8f0 !important;
}
.nav-btn.active { 
    background-color: #FF1801 !important; 
    color: #ffffff !important;
    border-radius: 4px;
}

/* Dropdown */
#settings-dropdown {
    background-color: #18181b !important;
    border: 1px solid #27272a !important;
    color: #e2e8f0 !important;
}
#settings-dropdown button:hover, #settings-dropdown a:hover {
    background-color: rgba(255, 255, 255, 0.05) !important;
}

/* Navbar container */
.nav-container {
    background-color: #18181b !important;
}

/* Motorsport Dropdown */
#motorsport-btn.active {
    border-color: #dc2626 !important;
}

#motorsport-btn.active #motorsport-arrow {
    stroke: #dc2626;
    transform: rotate(180deg);
}

.motorsport-option:hover {
    background-color: rgba(220, 38, 38, 0.1) !important;
}