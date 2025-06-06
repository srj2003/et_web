<?php
// Allow CORS
header("Access-Control-Allow-Origin: *"); // Use a specific domain in production
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include DB configuration
require_once 'config.php';

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

// Query to get active employees
$sql = "SELECT u_id, CONCAT(u_fname, ' ', IFNULL(u_mname, ''), ' ', u_lname) AS name FROM user_details WHERE u_active = 1";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Query failed: " . $conn->error
    ]);
    exit;
}

$employees = [];

while ($row = $result->fetch_assoc()) {
    $employees[] = [
        'u_id' => $row['u_id'],
        'name' => trim(preg_replace('/\s+/', ' ', $row['name']))
    ];
}

// Close connection
$conn->close();

// Return JSON response
echo json_encode([
    "status" => "success",
    "employees" => $employees
]);
?>
