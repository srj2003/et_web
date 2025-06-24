<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['userId'] ?? null;

if (!$userId) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing userId in request.'
    ]);
    exit();
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get all assignments for this user, unique by (proj_role_id, u_id)
    $stmt = $pdo->prepare('SELECT * FROM project_assignments WHERE u_id = :userId');
    $stmt->execute(['userId' => $userId]);
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Filter to unique (proj_role_id, u_id) pairs
    $unique = [];
    $results = [];
    foreach ($assignments as $row) {
        $key = $row['proj_role_id'] . '-' . $row['u_id'];
        if (!isset($unique[$key])) {
            $unique[$key] = true;
            $results[] = $row;
        }
    }

    echo json_encode([
        'status' => 'success',
        'data' => $results
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
