<?php
// get_past_drivers.php - Fetch past drivers with filtering support
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/api/config.php';

try {
    $pdo = getDbConnection();

    $currentYear = date('Y');

    // Simplified query - get all drivers with their basic info
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            d.driver_id,
            d.first_name,
            d.last_name,
            d.code,
            d.permanent_number,
            d.date_of_birth,
            n.name as nationality
        FROM drivers d
        LEFT JOIN nationalities n ON d.nationality_id = n.id
        WHERE d.driver_id NOT IN (
            SELECT driver_id FROM season_entries WHERE season_year = ? AND active = 1
        )
        ORDER BY d.last_name ASC
    ");

    $stmt->execute([$currentYear]);
    $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Now enrich each driver with additional data
    foreach ($drivers as &$driver) {
        // Get debut year
        $debutStmt = $pdo->prepare("
            SELECT MIN(season_year) as debut_year
            FROM season_entries
            WHERE driver_id = ?
        ");
        $debutStmt->execute([$driver['driver_id']]);
        $debutResult = $debutStmt->fetch();
        $driver['debut_year'] = $debutResult['debut_year'] ?? null;

        // Get teams
        $teamsStmt = $pdo->prepare("
            SELECT DISTINCT COALESCE(sc.display_name, c.name) as team_name
            FROM season_entries se
            JOIN constructors c ON se.constructor_id = c.constructor_id
            LEFT JOIN season_constructors sc ON c.constructor_id = sc.constructor_id AND sc.season_year = se.season_year
            WHERE se.driver_id = ?
            ORDER BY se.season_year DESC
        ");
        $teamsStmt->execute([$driver['driver_id']]);
        $teamsResult = $teamsStmt->fetchAll(PDO::FETCH_COLUMN);
        $driver['teams'] = array_values(array_unique($teamsResult));

        // Get primary color (most recent team)
        $colorStmt = $pdo->prepare("
            SELECT COALESCE(sc.color_override, c.color_primary) as primary_color
            FROM season_entries se
            JOIN constructors c ON se.constructor_id = c.constructor_id
            LEFT JOIN season_constructors sc ON c.constructor_id = sc.constructor_id AND sc.season_year = se.season_year
            WHERE se.driver_id = ?
            ORDER BY se.season_year DESC
            LIMIT 1
        ");
        $colorStmt->execute([$driver['driver_id']]);
        $colorResult = $colorStmt->fetch();
        $driver['primary_color'] = $colorResult['primary_color'] ?? '#FFFFFF';

        // Check if world champion (won a season)
        $championStmt = $pdo->prepare("
            SELECT COUNT(*) as champion_count
            FROM driver_standings ds
            JOIN races r ON ds.race_id = r.id
            WHERE ds.driver_id = ?
            AND ds.position = 1
            AND r.round = (
                SELECT MAX(r2.round)
                FROM races r2
                WHERE r2.season_year = r.season_year
                AND r2.completed = 1
            )
        ");
        $championStmt->execute([$driver['driver_id']]);
        $championResult = $championStmt->fetch();
        $driver['is_champion'] = ($championResult['champion_count'] ?? 0) > 0;
    }
    unset($driver);

    echo json_encode([
        'success' => true,
        'drivers' => $drivers,
        'total' => count($drivers)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
