<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
header("Access-Control-Max-Age: 3600")

;
// Include database configuration
require_once 'config.php';
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
        exit;
    }
    $user_id = $auth['user_id'];
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Authentication server error: ' . $e->getMessage()
    ]);
    exit;
}

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    echo json_encode(["success" => false, "message" => "No input data received"]);
    exit;
}

$start_date = $data->start_date ?? null;
$end_date = $data->end_date ?? null;

if (!$start_date || !$end_date) {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit;
}

// Query to get attendance records
$query = "SELECT DATE(login_timestamp) AS attended_date, 
                 COUNT(login_timestamp) > 0 AS hasLogin,
                 MAX(CASE WHEN logout_timestamp IS NOT NULL THEN 1 ELSE 0 END) AS is_logged_out
          FROM attendance_details
          WHERE user_id = ? 
          AND DATE(login_timestamp) BETWEEN ? AND ? 
          GROUP BY attended_date
          ORDER BY attended_date";

$stmt = $conn->prepare($query);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Query preparation failed: " . $conn->error]);
    exit;
}

$stmt->bind_param("iss", $user_id, $start_date, $end_date);
$stmt->execute();
$result = $stmt->get_result();

$attendance_map = [];
while ($row = $result->fetch_assoc()) {
    $attendance_map[$row['attended_date']] = [
        "hasLogin" => (bool) $row['hasLogin'],
        "is_logged_out" => (bool) $row['is_logged_out']
    ];
}

$stmt->close();
$conn->close();

// Generate all dates within range
$attendance_data = [];
$period = new DatePeriod(
    new DateTime($start_date),
    new DateInterval('P1D'),
    (new DateTime($end_date))->modify('+1 day') // Include end_date
);

foreach ($period as $date) {
    $formatted_date = $date->format("Y-m-d");
    $isSunday = ($date->format("w") == 0); // Sunday check

    $attendance_data[] = [
        "date" => $formatted_date,
        "hasLogin" => $attendance_map[$formatted_date]['hasLogin'] ?? false,
        "is_logged_out" => $attendance_map[$formatted_date]['is_logged_out'] ?? false,
        "isHoliday" => false,  // Always false as per request
        "isSunday" => $isSunday
    ];
}

echo json_encode([
    'success' => true,
    'attendance' => $attendance_data
]);
