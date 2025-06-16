<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include config and token verifier
require_once 'config.php';
require_once 'auth.php';

$response = [
    'status' => 'error',
    'message' => 'Invalid request',
    'data' => null
];

try {
    // PDO connection
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verify token using PDO version
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }

    $authenticated_user_id = $auth['user_id'];

    // Get the JSON input
    $data = json_decode(file_get_contents("php://input"), true);

    // Validate input
    if (!isset($data["user_id"], $data["date"], $data["project_name"], $data["work_details"])) {
        echo json_encode([
            "status" => "error",
            "message" => "Missing required fields"
        ]);
        exit;
    }

    // Verify that the authenticated user matches the requested user_id
    if ($authenticated_user_id != $data["user_id"]) {
        echo json_encode([
            "status" => "error",
            "message" => "Unauthorized access"
        ]);
        exit;
    }

    // Insert work report
    $stmt = $pdo->prepare("
        INSERT INTO work_reports (
            user_id, 
            date, 
            project_name, 
            work_details,
            created_at
        ) VALUES (
            :user_id, 
            :date, 
            :project_name, 
            :work_details,
            NOW()
        )
    ");

    $stmt->execute([
        ":user_id" => $data["user_id"],
        ":date" => $data["date"],
        ":project_name" => $data["project_name"],
        ":work_details" => $data["work_details"]
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Work report added successfully"
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
    exit;
}
?>