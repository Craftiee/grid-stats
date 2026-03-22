<?php
// get_other_teams.php - Fetch other teams (not current season) with filtering support
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/api/config.php';

try {
    $pdo = getDbConnection();

    $currentYear = date('Y');

    // Get all constructors that are NOT in the current season
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            c.constructor_id,
            c.name,
            c.color_primary,
            n.name as nationality
        FROM constructors c
        LEFT JOIN nationalities n ON c.nationality_id = n.id
        WHERE c.constructor_id NOT IN (
            SELECT constructor_id FROM season_constructors WHERE season_year = ? AND active = 1
        )
        ORDER BY c.name ASC
    ");

    $stmt->execute([$currentYear]);
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Enrich each team with additional data
    foreach ($teams as &$team) {
        // Get first entry year
        $firstEntryStmt = $pdo->prepare("
            SELECT MIN(season_year) as first_entry_year
            FROM season_constructors
            WHERE constructor_id = ?
        ");
        $firstEntryStmt->execute([$team['constructor_id']]);
        $firstEntryResult = $firstEntryStmt->fetch();
        $team['first_entry_year'] = $firstEntryResult['first_entry_year'] ?? null;

        // Check if constructor champion (won a season)
        $championStmt = $pdo->prepare("
            SELECT COUNT(*) as champion_count
            FROM constructor_standings cs
            JOIN races r ON cs.race_id = r.id
            WHERE cs.constructor_id = ?
            AND cs.position = 1
            AND r.round = (
                SELECT MAX(r2.round)
                FROM races r2
                WHERE r2.season_year = r.season_year
                AND r2.completed = 1
            )
        ");
        $championStmt->execute([$team['constructor_id']]);
        $championResult = $championStmt->fetch();
        $team['is_champion'] = ($championResult['champion_count'] ?? 0) > 0;
    }
    unset($team);

    echo json_encode([
        'success' => true,
        'teams' => $teams,
        'total' => count($teams)
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
