<?php
// Test file to check constructors API
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Constructors API Test</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
        pre { background: #000; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .success { color: #0f0; }
        .error { color: #f00; }
        h2 { color: #ff8000; }
    </style>
</head>
<body>
    <h1>Constructors API Test</h1>

    <h2>1. Direct Database Query</h2>
    <?php
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=f1stats;charset=utf8mb4", 'root', 'F1StatsAdminWicks7399@');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $stmt = $pdo->query("SELECT COUNT(*) as count FROM constructors");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "<p class='success'>✓ Total constructors in database: " . $result['count'] . "</p>";

        $stmt2 = $pdo->query("SELECT constructor_id, name, color_primary, championships FROM constructors LIMIT 10");
        echo "<p class='success'>✓ Sample constructors:</p><pre>";
        while($row = $stmt2->fetch(PDO::FETCH_ASSOC)) {
            echo "  - " . $row['name'] . " (" . $row['constructor_id'] . ") - " . $row['championships'] . " titles\n";
        }
        echo "</pre>";
    } catch(Exception $e) {
        echo "<p class='error'>✗ Database error: " . $e->getMessage() . "</p>";
    }
    ?>

    <h2>2. API Response Test</h2>
    <p>Fetching from: <code>http://f1stats.local/api/local/constructors</code></p>
    <div id="api-result">Loading...</div>

    <script>
        fetch('http://f1stats.local/api/local/constructors')
            .then(res => {
                console.log('Response status:', res.status);
                return res.json();
            })
            .then(data => {
                console.log('API response:', data);
                const resultDiv = document.getElementById('api-result');
                if (data.constructors) {
                    resultDiv.innerHTML = `
                        <p class="success">✓ API returned ${data.constructors.length} constructors</p>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <p class="error">✗ Unexpected API response structure</p>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
                }
            })
            .catch(error => {
                console.error('API error:', error);
                document.getElementById('api-result').innerHTML = `
                    <p class="error">✗ API Error: ${error.message}</p>
                `;
            });
    </script>
</body>
</html>
