<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php'; // Include your database configuration file
require_once 'auth.php';

// Authenticate user using PDO (for token check only)
try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit();
    }
    $user_id = $auth['user_id'];
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Authentication server error: ' . $e->getMessage()
    ]);
    exit();
}

// Database connection settings
require_once 'config.php'; // Include your database configuration file

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Prepare SQL query
$sql = "SELECT * FROM expense_track_details WHERE expense_track_created_by = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

// Initialize response array
$jsonData = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Convert `expense_status` to human-readable text
        $status = match ($row['expense_track_status']) {
            null => "Pending",
            0 => "Rejected",
            1 => "Approved",
            default => "Unknown"
        };

        // Format JSON response
        $jsonData[] = [
            'expense_id' => $row['expense_track_id'],
            'expense_title' => $row['expense_track_title'],
            'expense_type' => $row['expense_type_id'],
            'expense_amount' => $row['expense_total_amount'],
            'expense_status' => $status,
            'expense_date' => $row['expense_track_created_at'],
            'expense_comment' => $row['expense_track_app_rej_remarks'],
        ];
    }
} else {
    $jsonData = ['status' => 'error', 'message' => 'No expense records found'];
}

// Close database connection
$conn->close();

// Send JSON response
echo json_encode($jsonData);
?>