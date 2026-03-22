<?php
session_start();
if (!isset($_SESSION['f1stats_authenticated']) || $_SESSION['f1stats_authenticated'] !== true) { header('Location: /login'); exit; }
if (!isset($_SESSION['f1stats_admin']) || $_SESSION['f1stats_admin'] !== true) { header('Location: /'); exit; }

$pdo = null; $dbError = null;
try { $pdo = new PDO("mysql:host=localhost;dbname=f1stats;charset=utf8mb4", 'root', 'F1StatsAdminWicks7399@'); $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); } catch (PDOException $e) { $dbError = $e->getMessage(); }

$message = ''; $messageType = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $pdo) {
    $action = $_POST['action'] ?? '';
    try {
        switch ($action) {
            case 'add_race':
                $stmt = $pdo->prepare("INSERT INTO races (season_year, round, name, circuit_id, race_date, race_time, qualifying_date, qualifying_time, sprint_date, sprint_time) VALUES (?,?,?,?,?,?,?,?,?,?)");
                $stmt->execute([$_POST['season_year'], $_POST['round'], $_POST['name'], $_POST['circuit_id'], $_POST['race_date'], $_POST['race_time']?:null, $_POST['qualifying_date']?:null, $_POST['qualifying_time']?:null, $_POST['sprint_date']?:null, $_POST['sprint_time']?:null]);
                $message = "Race added!"; $messageType = 'success'; break;
            case 'update_race':
                $stmt = $pdo->prepare("UPDATE races SET name=?, circuit_id=?, race_date=?, race_time=?, qualifying_date=?, qualifying_time=?, sprint_date=?, sprint_time=?, completed=? WHERE id=?");
                $stmt->execute([$_POST['name'], $_POST['circuit_id'], $_POST['race_date'], $_POST['race_time']?:null, $_POST['qualifying_date']?:null, $_POST['qualifying_time']?:null, $_POST['sprint_date']?:null, $_POST['sprint_time']?:null, isset($_POST['completed'])?1:0, $_POST['race_id']]);
                $message = "Race updated!"; $messageType = 'success'; break;
            case 'toggle_completed':
                $pdo->prepare("UPDATE races SET completed = NOT completed WHERE id=?")->execute([$_POST['race_id']]);
                $message = "Status toggled!"; $messageType = 'success'; break;
            case 'update_constructor':
                $stmt = $pdo->prepare("UPDATE constructors SET name=?, full_name=?, color_primary=?, color=?, logo_url=? WHERE id=?");
                $stmt->execute([$_POST['name'], $_POST['full_name']?:null, $_POST['color_primary'], $_POST['color_primary'], $_POST['logo_url']?:null, $_POST['id']]);
                $message = "Constructor updated!"; $messageType = 'success'; break;
            case 'update_driver':
                $stmt = $pdo->prepare("UPDATE drivers SET first_name=?, last_name=?, permanent_number=?, code=?, nationality_id=?, photo_url=?, active=? WHERE id=?");
                $stmt->execute([$_POST['first_name'], $_POST['last_name'], $_POST['permanent_number']?:null, strtoupper(substr($_POST['last_name'],0,3)), $_POST['nationality_id']?:null, $_POST['photo_url']?:null, isset($_POST['active'])?1:0, $_POST['id']]);
                $message = "Driver updated!"; $messageType = 'success'; break;
            case 'add_driver':
                $driverId = strtolower(preg_replace('/[^a-z0-9]/','_',$_POST['last_name']));
                $stmt = $pdo->prepare("INSERT INTO drivers (driver_id, first_name, last_name, permanent_number, code, nationality_id, active) VALUES (?,?,?,?,?,?,1)");
                $stmt->execute([$driverId, $_POST['first_name'], $_POST['last_name'], $_POST['permanent_number']?:null, strtoupper(substr($_POST['last_name'],0,3)), $_POST['nationality_id']?:null]);
                $message = "Driver added!"; $messageType = 'success'; break;
            case 'update_circuit':
                $stmt = $pdo->prepare("UPDATE circuits SET name=?, locality=?, country=?, timezone_offset=?, length_km=?, turns=?, elevation_m=? WHERE id=?");
                $stmt->execute([$_POST['name'], $_POST['locality']?:null, $_POST['country']?:null, $_POST['timezone_offset']?:0, $_POST['length_km']?:null, $_POST['turns']?:null, $_POST['elevation_m']?:null, $_POST['id']]);
                $message = "Circuit updated!"; $messageType = 'success'; break;
            case 'update_season':
                $stmt = $pdo->prepare("UPDATE seasons SET total_rounds=?, champion_driver_id=?, champion_constructor_id=? WHERE season_year=?");
                $stmt->execute([$_POST['total_rounds']?:null, $_POST['champion_driver_id']?:null, $_POST['champion_constructor_id']?:null, $_POST['season_year']]);
                $message = "Season updated!"; $messageType = 'success'; break;
            case 'add_season':
                $pdo->prepare("INSERT INTO seasons (season_year, total_rounds) VALUES (?,?)")->execute([$_POST['season_year'], $_POST['total_rounds']?:null]);
                $message = "Season added!"; $messageType = 'success'; break;
            case 'clear_cache':
                $dir = __DIR__.'/api/cache/'; $c=0; if(is_dir($dir)){foreach(glob($dir.'*.json') as $f){unlink($f);$c++;}}
                $message = "Cache cleared ($c files)"; $messageType = 'success'; break;
        }
    } catch (PDOException $e) { $message = "Error: ".$e->getMessage(); $messageType = 'error'; }
}

$races=$constructors=$drivers=$circuits=$seasons=$nationalities=[];
if ($pdo) {
    try {
        $races = $pdo->query("SELECT r.*, c.name as circuit_name FROM races r LEFT JOIN circuits c ON r.circuit_id = c.id ORDER BY r.season_year DESC, r.round")->fetchAll(PDO::FETCH_ASSOC);
        $constructors = $pdo->query("SELECT * FROM constructors WHERE active=1 ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
        $drivers = $pdo->query("SELECT d.*, n.name as nationality_name, se.constructor_id, c.name as team_name, COALESCE(c.color_primary,c.color,'#666') as team_color FROM drivers d LEFT JOIN nationalities n ON d.nationality_id=n.id LEFT JOIN season_entries se ON d.driver_id=se.driver_id AND se.season_year=2025 AND se.active=1 LEFT JOIN constructors c ON se.constructor_id=c.constructor_id WHERE d.active=1 ORDER BY d.last_name")->fetchAll(PDO::FETCH_ASSOC);
        $circuits = $pdo->query("SELECT * FROM circuits ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
        $seasons = $pdo->query("SELECT * FROM seasons ORDER BY season_year DESC")->fetchAll(PDO::FETCH_ASSOC);
        $nationalities = $pdo->query("SELECT * FROM nationalities ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) { $dbError = $e->getMessage(); }
}
$pageTitle = 'Admin Panel | GRIDSTATS';
include 'includes/head.php';
?>
<style>
.admin-card{background:#18181b;border:1px solid #27272a;border-radius:8px}
.admin-input{background:#09090b;border:1px solid #3f3f46;color:#e4e4e7;padding:8px 12px;border-radius:6px;width:100%;font-size:14px}
.admin-input:focus{outline:none;border-color:#dc2626}
.admin-btn{padding:8px 16px;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer;border:none}
.admin-btn-primary{background:#dc2626;color:#fff}.admin-btn-primary:hover{background:#b91c1c}
.admin-btn-secondary{background:#27272a;color:#e4e4e7}.admin-btn-secondary:hover{background:#3f3f46}
.admin-btn-sm{padding:4px 10px;font-size:12px}
.tab-btn{padding:12px 20px;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#71717a;border-bottom:2px solid transparent;background:none;cursor:pointer}
.tab-btn:hover{color:#a1a1aa}.tab-btn.active{color:#dc2626;border-bottom-color:#dc2626}
.data-table{width:100%;border-collapse:collapse}
.data-table th{text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#52525b;border-bottom:1px solid #27272a}
.data-table td{padding:10px 12px;font-size:13px;color:#d4d4d8;border-bottom:1px solid #27272a}
.data-table tr:hover{background:rgba(255,255,255,.02)}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase}
.badge-green{background:rgba(34,197,94,.15);color:#4ade80}.badge-gray{background:rgba(113,113,122,.2);color:#a1a1aa}.badge-yellow{background:rgba(234,179,8,.15);color:#facc15}
.color-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.form-label{display:block;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#71717a;margin-bottom:6px}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);align-items:center;justify-content:center;z-index:100}.modal.active{display:flex}
.modal-content{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;margin:16px}
</style>
<body class="antialiased min-h-screen" style="background:#09090b;color:#e4e4e7;font-family:'Titillium Web',system-ui,sans-serif">
<?php $activePage='admin'; include 'includes/navbar.php'; ?>
<div class="container mx-auto px-4 py-6">
<div class="flex items-center justify-between mb-6">
<div><h1 class="text-2xl font-black text-white">Admin Panel</h1><p class="text-sm text-zinc-500">Database: f1stats • <?=count($races)?> races, <?=count($drivers)?> drivers</p></div>
<form method="POST"><input type="hidden" name="action" value="clear_cache"><button class="admin-btn admin-btn-secondary">Clear Cache</button></form>
</div>
<?php if($message):?><div class="mb-4 p-3 rounded-lg text-sm <?=$messageType==='success'?'bg-green-900/30 border border-green-700 text-green-400':'bg-red-900/30 border border-red-700 text-red-400'?>"><?=htmlspecialchars($message)?></div><?php endif;?>
<?php if($dbError):?><div class="mb-4 p-3 rounded-lg text-sm bg-red-900/30 border border-red-700 text-red-400"><?=$dbError?></div><?php endif;?>
<div class="flex gap-1 mb-4 border-b border-zinc-800 overflow-x-auto">
<button onclick="showTab('races')" class="tab-btn active" data-tab="races">Races</button>
<button onclick="showTab('drivers')" class="tab-btn" data-tab="drivers">Drivers</button>
<button onclick="showTab('constructors')" class="tab-btn" data-tab="constructors">Constructors</button>
<button onclick="showTab('circuits')" class="tab-btn" data-tab="circuits">Circuits</button>
<button onclick="showTab('seasons')" class="tab-btn" data-tab="seasons">Seasons</button>
</div>
<div class="admin-card">
<div id="tab-races" class="tab-content p-4">
<div class="flex justify-between items-center mb-4">
<div class="flex items-center gap-3"><h2 class="text-lg font-bold text-white">Race Schedule</h2>
<select id="filter-season" onchange="filterRaces(this.value)" class="admin-input" style="width:auto;padding:6px 10px;font-size:12px"><option value="">All</option><?php foreach(array_unique(array_column($races,'season_year')) as $y):?><option value="<?=$y?>" <?=$y==2025?'selected':''?>><?=$y?></option><?php endforeach;?></select></div>
<button onclick="openModal('add-race-modal')" class="admin-btn admin-btn-primary admin-btn-sm">+ Add Race</button>
</div>
<div class="overflow-x-auto"><table class="data-table" id="races-table"><thead><tr><th>Year</th><th>R</th><th>Race</th><th>Circuit</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr></thead><tbody>
<?php foreach($races as $r):?><tr data-year="<?=$r['season_year']?>">
<td class="font-mono text-zinc-500"><?=$r['season_year']?></td><td class="font-mono"><?=$r['round']?></td>
<td class="font-medium text-white"><?=htmlspecialchars($r['name'])?><?php if($r['sprint_date']):?><span class="badge badge-yellow ml-1">Sprint</span><?php endif;?></td>
<td class="text-zinc-400"><?=htmlspecialchars($r['circuit_name']??'-')?></td><td class="font-mono"><?=$r['race_date']?></td>
<td class="font-mono text-zinc-500"><?=$r['race_time']?substr($r['race_time'],0,5):'TBA'?></td>
<td><span class="badge <?=$r['completed']?'badge-gray':'badge-green'?>"><?=$r['completed']?'Done':'Upcoming'?></span></td>
<td class="text-right space-x-1"><button onclick='editRace(<?=json_encode($r)?>)' class="text-blue-400 text-xs">Edit</button>
<form method="POST" class="inline"><input type="hidden" name="action" value="toggle_completed"><input type="hidden" name="race_id" value="<?=$r['id']?>"><button class="text-yellow-400 text-xs">Toggle</button></form></td>
</tr><?php endforeach;?></tbody></table></div></div>

<div id="tab-drivers" class="tab-content p-4 hidden">
<div class="flex justify-between items-center mb-4"><h2 class="text-lg font-bold text-white">Drivers (<?=count($drivers)?> active)</h2>
<button onclick="openModal('add-driver-modal')" class="admin-btn admin-btn-primary admin-btn-sm">+ Add Driver</button></div>
<div class="overflow-x-auto"><table class="data-table"><thead><tr><th>#</th><th>Driver</th><th>Code</th><th>2025 Team</th><th>Nationality</th><th></th></tr></thead><tbody>
<?php foreach($drivers as $d):?><tr>
<td class="font-mono font-bold"><?=$d['permanent_number']??'-'?></td>
<td class="font-medium text-white"><?=htmlspecialchars($d['first_name'].' '.strtoupper($d['last_name']))?></td>
<td class="font-mono text-zinc-400"><?=$d['code']?></td>
<td><?php if($d['team_name']):?><span class="color-dot mr-1" style="background:<?=$d['team_color']?>"></span><?=htmlspecialchars($d['team_name'])?><?php else:?><span class="text-zinc-500">-</span><?php endif;?></td>
<td class="text-zinc-400"><?=htmlspecialchars($d['nationality_name']??'-')?></td>
<td class="text-right"><button onclick='editDriver(<?=json_encode($d)?>)' class="text-blue-400 text-xs">Edit</button></td>
</tr><?php endforeach;?></tbody></table></div></div>

<div id="tab-constructors" class="tab-content p-4 hidden">
<h2 class="text-lg font-bold text-white mb-4">Constructors (<?=count($constructors)?> active)</h2>
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
<?php foreach($constructors as $t):?><form method="POST" class="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
<input type="hidden" name="action" value="update_constructor"><input type="hidden" name="id" value="<?=$t['id']?>">
<div class="flex items-center gap-2 mb-3"><div class="w-1 h-8 rounded" style="background:<?=$t['color_primary']??$t['color']??'#666'?>"></div>
<input type="text" name="name" value="<?=htmlspecialchars($t['name'])?>" class="flex-1 bg-transparent border-none text-white font-bold p-0 focus:outline-none">
<input type="color" name="color_primary" value="<?=$t['color_primary']??$t['color']??'#666666'?>" class="w-8 h-8 rounded cursor-pointer border-0"></div>
<div class="mb-3"><label class="form-label">Full Name</label><input type="text" name="full_name" value="<?=htmlspecialchars($t['full_name']??'')?>" class="admin-input" style="padding:6px 8px;font-size:12px"></div>
<div class="mb-3"><label class="form-label">Logo URL</label><input type="text" name="logo_url" value="<?=htmlspecialchars($t['logo_url']??'')?>" class="admin-input" style="padding:6px 8px;font-size:12px"></div>
<button type="submit" class="admin-btn admin-btn-primary admin-btn-sm w-full">Save</button>
</form><?php endforeach;?></div></div>

<div id="tab-circuits" class="tab-content p-4 hidden">
<h2 class="text-lg font-bold text-white mb-4">Circuits (<?=count($circuits)?>)</h2>
<div class="overflow-x-auto"><table class="data-table"><thead><tr><th>Circuit</th><th>Location</th><th>Country</th><th>Length</th><th>Turns</th><th>UTC</th><th></th></tr></thead><tbody>
<?php foreach($circuits as $c):?><tr>
<td class="font-medium text-white"><?=htmlspecialchars($c['name'])?></td>
<td class="text-zinc-400"><?=htmlspecialchars($c['locality']??'-')?></td>
<td><?=htmlspecialchars($c['country']??'-')?></td>
<td class="font-mono"><?=$c['length_km']?number_format($c['length_km'],3).' km':'-'?></td>
<td class="font-mono"><?=$c['turns']??'-'?></td>
<td class="font-mono text-zinc-500"><?=$c['timezone_offset']>=0?'+':''?><?=$c['timezone_offset']?></td>
<td class="text-right"><button onclick='editCircuit(<?=json_encode($c)?>)' class="text-blue-400 text-xs">Edit</button></td>
</tr><?php endforeach;?></tbody></table></div></div>

<div id="tab-seasons" class="tab-content p-4 hidden">
<div class="flex justify-between items-center mb-4"><h2 class="text-lg font-bold text-white">Seasons (<?=count($seasons)?>)</h2>
<button onclick="openModal('add-season-modal')" class="admin-btn admin-btn-primary admin-btn-sm">+ Add Season</button></div>
<div class="overflow-x-auto"><table class="data-table"><thead><tr><th>Year</th><th>Rounds</th><th>Driver Champion</th><th>Constructor Champion</th><th></th></tr></thead><tbody>
<?php foreach($seasons as $s):?><tr>
<td class="font-mono font-bold text-white"><?=$s['season_year']?></td>
<td class="font-mono"><?=$s['total_rounds']??'-'?></td>
<td><?=$s['champion_driver_id']?htmlspecialchars($s['champion_driver_id']):'<span class="text-zinc-500">-</span>'?></td>
<td><?=$s['champion_constructor_id']?htmlspecialchars($s['champion_constructor_id']):'<span class="text-zinc-500">-</span>'?></td>
<td class="text-right"><button onclick='editSeason(<?=json_encode($s)?>)' class="text-blue-400 text-xs">Edit</button></td>
</tr><?php endforeach;?></tbody></table></div></div>
</div></div>

<div id="add-race-modal" class="modal"><div class="modal-content"><h3 class="text-lg font-bold text-white mb-4">Add Race</h3>
<form method="POST" class="space-y-3"><input type="hidden" name="action" value="add_race">
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Season</label><select name="season_year" class="admin-input" required><option value="2025">2025</option><option value="2026">2026</option></select></div><div><label class="form-label">Round</label><input type="number" name="round" class="admin-input" required min="1" max="30"></div></div>
<div><label class="form-label">Race Name</label><input type="text" name="name" class="admin-input" required placeholder="Australian Grand Prix"></div>
<div><label class="form-label">Circuit</label><select name="circuit_id" class="admin-input" required><?php foreach($circuits as $c):?><option value="<?=$c['id']?>"><?=htmlspecialchars($c['name'])?></option><?php endforeach;?></select></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Race Date</label><input type="date" name="race_date" class="admin-input" required></div><div><label class="form-label">Race Time (UTC)</label><input type="time" name="race_time" class="admin-input"></div></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Quali Date</label><input type="date" name="qualifying_date" class="admin-input"></div><div><label class="form-label">Quali Time</label><input type="time" name="qualifying_time" class="admin-input"></div></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Sprint Date</label><input type="date" name="sprint_date" class="admin-input"></div><div><label class="form-label">Sprint Time</label><input type="time" name="sprint_time" class="admin-input"></div></div>
<div class="flex gap-2 pt-2"><button type="button" onclick="closeModal('add-race-modal')" class="admin-btn admin-btn-secondary flex-1">Cancel</button><button type="submit" class="admin-btn admin-btn-primary flex-1">Add</button></div>
</form></div></div>

<div id="edit-race-modal" class="modal"><div class="modal-content"><h3 class="text-lg font-bold text-white mb-4">Edit Race</h3>
<form method="POST" class="space-y-3"><input type="hidden" name="action" value="update_race"><input type="hidden" name="race_id" id="edit-race-id">
<div><label class="form-label">Race Name</label><input type="text" name="name" id="edit-race-name" class="admin-input" required></div>
<div><label class="form-label">Circuit</label><select name="circuit_id" id="edit-race-circuit" class="admin-input"><?php foreach($circuits as $c):?><option value="<?=$c['id']?>"><?=htmlspecialchars($c['name'])?></option><?php endforeach;?></select></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Race Date</label><input type="date" name="race_date" id="edit-race-date" class="admin-input" required></div><div><label class="form-label">Race Time</label><input type="time" name="race_time" id="edit-race-time" class="admin-input"></div></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Quali Date</label><input type="date" name="qualifying_date" id="edit-race-quali-date" class="admin-input"></div><div><label class="form-label">Quali Time</label><input type="time" name="qualifying_time" id="edit-race-quali-time" class="admin-input"></div></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Sprint Date</label><input type="date" name="sprint_date" id="edit-race-sprint-date" class="admin-input"></div><div><label class="form-label">Sprint Time</label><input type="time" name="sprint_time" id="edit-race-sprint-time" class="admin-input"></div></div>
<div><label class="flex items-center gap-2"><input type="checkbox" name="completed" id="edit-race-completed" class="accent-red-600"><span class="text-sm">Completed</span></label></div>
<div class="flex gap-2 pt-2"><button type="button" onclick="closeModal('edit-race-modal')" class="admin-btn admin-btn-secondary flex-1">Cancel</button><button type="submit" class="admin-btn admin-btn-primary flex-1">Save</button></div>
</form></div></div>

<div id="add-driver-modal" class="modal"><div class="modal-content"><h3 class="text-lg font-bold text-white mb-4">Add Driver</h3>
<form method="POST" class="space-y-3"><input type="hidden" name="action" value="add_driver">
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">First Name</label><input type="text" name="first_name" class="admin-input" required></div><div><label class="form-label">Last Name</label><input type="text" name="last_name" class="admin-input" required></div></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Number</label><input type="number" name="permanent_number" class="admin-input"></div><div><label class="form-label">Nationality</label><select name="nationality_id" class="admin-input"><option value="">-</option><?php foreach($nationalities as $n):?><option value="<?=$n['id']?>"><?=htmlspecialchars($n['name'])?></option><?php endforeach;?></select></div></div>
<div class="flex gap-2 pt-2"><button type="button" onclick="closeModal('add-driver-modal')" class="admin-btn admin-btn-secondary flex-1">Cancel</button><button type="submit" class="admin-btn admin-btn-primary flex-1">Add</button></div>
</form></div></div>

<div id="edit-driver-modal" class="modal"><div class="modal-content"><h3 class="text-lg font-bold text-white mb-4">Edit Driver</h3>
<form method="POST" class="space-y-3"><input type="hidden" name="action" value="update_driver"><input type="hidden" name="id" id="edit-driver-id">
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">First Name</label><input type="text" name="first_name" id="edit-driver-first" class="admin-input" required></div><div><label class="form-label">Last Name</label><input type="text" name="last_name" id="edit-driver-last" class="admin-input" required></div></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Number</label><input type="number" name="permanent_number" id="edit-driver-number" class="admin-input"></div><div><label class="form-label">Nationality</label><select name="nationality_id" id="edit-driver-nationality" class="admin-input"><option value="">-</option><?php foreach($nationalities as $n):?><option value="<?=$n['id']?>"><?=htmlspecialchars($n['name'])?></option><?php endforeach;?></select></div></div>
<div><label class="form-label">Photo URL</label><input type="text" name="photo_url" id="edit-driver-photo" class="admin-input"></div>
<div><label class="flex items-center gap-2"><input type="checkbox" name="active" id="edit-driver-active" class="accent-red-600" checked><span class="text-sm">Active</span></label></div>
<div class="flex gap-2 pt-2"><button type="button" onclick="closeModal('edit-driver-modal')" class="admin-btn admin-btn-secondary flex-1">Cancel</button><button type="submit" class="admin-btn admin-btn-primary flex-1">Save</button></div>
</form></div></div>

<div id="edit-circuit-modal" class="modal"><div class="modal-content"><h3 class="text-lg font-bold text-white mb-4">Edit Circuit</h3>
<form method="POST" class="space-y-3"><input type="hidden" name="action" value="update_circuit"><input type="hidden" name="id" id="edit-circuit-id">
<div><label class="form-label">Name</label><input type="text" name="name" id="edit-circuit-name" class="admin-input" required></div>
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Locality</label><input type="text" name="locality" id="edit-circuit-locality" class="admin-input"></div><div><label class="form-label">Country</label><input type="text" name="country" id="edit-circuit-country" class="admin-input"></div></div>
<div class="grid grid-cols-3 gap-3"><div><label class="form-label">Length (km)</label><input type="number" step="0.001" name="length_km" id="edit-circuit-length" class="admin-input"></div><div><label class="form-label">Turns</label><input type="number" name="turns" id="edit-circuit-turns" class="admin-input"></div><div><label class="form-label">UTC</label><input type="number" name="timezone_offset" id="edit-circuit-tz" class="admin-input" min="-12" max="14"></div></div>
<div><label class="form-label">Elevation (m)</label><input type="number" name="elevation_m" id="edit-circuit-elev" class="admin-input"></div>
<div class="flex gap-2 pt-2"><button type="button" onclick="closeModal('edit-circuit-modal')" class="admin-btn admin-btn-secondary flex-1">Cancel</button><button type="submit" class="admin-btn admin-btn-primary flex-1">Save</button></div>
</form></div></div>

<div id="add-season-modal" class="modal"><div class="modal-content"><h3 class="text-lg font-bold text-white mb-4">Add Season</h3>
<form method="POST" class="space-y-3"><input type="hidden" name="action" value="add_season">
<div class="grid grid-cols-2 gap-3"><div><label class="form-label">Year</label><input type="number" name="season_year" class="admin-input" required min="1950" max="2030"></div><div><label class="form-label">Total Rounds</label><input type="number" name="total_rounds" class="admin-input"></div></div>
<div class="flex gap-2 pt-2"><button type="button" onclick="closeModal('add-season-modal')" class="admin-btn admin-btn-secondary flex-1">Cancel</button><button type="submit" class="admin-btn admin-btn-primary flex-1">Add</button></div>
</form></div></div>

<div id="edit-season-modal" class="modal"><div class="modal-content"><h3 class="text-lg font-bold text-white mb-4">Edit Season</h3>
<form method="POST" class="space-y-3"><input type="hidden" name="action" value="update_season"><input type="hidden" name="season_year" id="edit-season-year">
<div><label class="form-label">Year</label><input type="text" id="edit-season-year-display" class="admin-input" disabled></div>
<div><label class="form-label">Total Rounds</label><input type="number" name="total_rounds" id="edit-season-rounds" class="admin-input"></div>
<div><label class="form-label">Driver Champion (driver_id)</label><input type="text" name="champion_driver_id" id="edit-season-driver" class="admin-input" placeholder="verstappen"></div>
<div><label class="form-label">Constructor Champion (constructor_id)</label><input type="text" name="champion_constructor_id" id="edit-season-constructor" class="admin-input" placeholder="red_bull"></div>
<div class="flex gap-2 pt-2"><button type="button" onclick="closeModal('edit-season-modal')" class="admin-btn admin-btn-secondary flex-1">Cancel</button><button type="submit" class="admin-btn admin-btn-primary flex-1">Save</button></div>
</form></div></div>

<script>
function showTab(t){document.querySelectorAll('.tab-content').forEach(e=>e.classList.add('hidden'));document.querySelectorAll('.tab-btn').forEach(e=>e.classList.remove('active'));document.getElementById('tab-'+t).classList.remove('hidden');document.querySelector('[data-tab="'+t+'"]').classList.add('active');}
function filterRaces(y){document.querySelectorAll('#races-table tbody tr').forEach(r=>{r.style.display=(!y||r.dataset.year===y)?'':'none'});}
function openModal(id){document.getElementById(id).classList.add('active');}
function closeModal(id){document.getElementById(id).classList.remove('active');}
document.querySelectorAll('.modal').forEach(m=>{m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)})});
function editRace(d){document.getElementById('edit-race-id').value=d.id;document.getElementById('edit-race-name').value=d.name;document.getElementById('edit-race-circuit').value=d.circuit_id||'';document.getElementById('edit-race-date').value=d.race_date;document.getElementById('edit-race-time').value=d.race_time||'';document.getElementById('edit-race-quali-date').value=d.qualifying_date||'';document.getElementById('edit-race-quali-time').value=d.qualifying_time||'';document.getElementById('edit-race-sprint-date').value=d.sprint_date||'';document.getElementById('edit-race-sprint-time').value=d.sprint_time||'';document.getElementById('edit-race-completed').checked=d.completed==1;openModal('edit-race-modal');}
function editDriver(d){document.getElementById('edit-driver-id').value=d.id;document.getElementById('edit-driver-first').value=d.first_name;document.getElementById('edit-driver-last').value=d.last_name;document.getElementById('edit-driver-number').value=d.permanent_number||'';document.getElementById('edit-driver-nationality').value=d.nationality_id||'';document.getElementById('edit-driver-photo').value=d.photo_url||'';document.getElementById('edit-driver-active').checked=d.active==1;openModal('edit-driver-modal');}
function editCircuit(d){document.getElementById('edit-circuit-id').value=d.id;document.getElementById('edit-circuit-name').value=d.name;document.getElementById('edit-circuit-locality').value=d.locality||'';document.getElementById('edit-circuit-country').value=d.country||'';document.getElementById('edit-circuit-length').value=d.length_km||'';document.getElementById('edit-circuit-turns').value=d.turns||'';document.getElementById('edit-circuit-tz').value=d.timezone_offset||0;document.getElementById('edit-circuit-elev').value=d.elevation_m||'';openModal('edit-circuit-modal');}
function editSeason(d){document.getElementById('edit-season-year').value=d.season_year;document.getElementById('edit-season-year-display').value=d.season_year;document.getElementById('edit-season-rounds').value=d.total_rounds||'';document.getElementById('edit-season-driver').value=d.champion_driver_id||'';document.getElementById('edit-season-constructor').value=d.champion_constructor_id||'';openModal('edit-season-modal');}
document.addEventListener('DOMContentLoaded',()=>filterRaces('2025'));
</script>
</body></html>
