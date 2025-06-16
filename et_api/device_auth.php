<?php

// Enable CORS for localhost testing
header("Access-Control-Allow-Origin: *"); // Replace * with your frontend's origin if needed
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Enable error reporting for debugging (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

// Database configuration
require_once 'config.php';

// Set JSON response header
header('Content-Type: application/json');

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Invalid_Request_Method']);
    exit;
}

// Get and validate JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid_JSON_Input']);
    exit;
}

// Validate required parameters
$required_params = ['u_id', 'IMEI', 'mac_address'];
foreach ($required_params as $param) {
    if (!isset($data[$param]) || empty(trim($data[$param]))) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing_or_Empty_Parameters']);
        exit;
    }
}

// Sanitize inputs
$u_id = trim($data['u_id']);
$imei = trim($data['IMEI']);
$mac_address = trim($data['mac_address']);

// Validate MAC address format
if (!preg_match('/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/', $mac_address)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid_MAC_Address']);
    exit;
}

// Validate IMEI format (15 digits)
if (!preg_match('/^\d{15}$/', $imei)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid_IMEI']);
    exit;
}

try {
    // Database connection using variables
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        throw new Exception('DB_Connection_Failed: ' . $conn->connect_error);
    }

    // Set charset
    $conn->set_charset('utf8mb4');

    // Generate device hash
    $device_hash = md5($imei . $mac_address);

    // Check if user exists
    $stmt = $conn->prepare("SELECT device_detail FROM user_details WHERE u_id = ?");
    if (!$stmt) {
        throw new Exception('DB_Query_Preparation_Failed: ' . $conn->error);
    }

    $stmt->bind_param('s', $u_id);
    if (!$stmt->execute()) {
        throw new Exception('DB_Query_Execution_Failed: ' . $stmt->error);
    }

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'User_Not_Found']);
        exit;
    }

    $row = $result->fetch_assoc();
    $existing_hash = $row['device_detail'] ?? null;

    // Handle device verification logic
    if ($existing_hash === null) {
        // Register the device
        $update = $conn->prepare("UPDATE user_details SET device_detail = ? WHERE u_id = ?");
        if (!$update) {
            throw new Exception('DB_Update_Preparation_Failed: ' . $conn->error);
        }

        $update->bind_param('ss', $device_hash, $u_id);

        if ($update->execute()) {
            echo json_encode(['message' => 'Device_Registered']);
        } else {
            throw new Exception('DB_Update_Execution_Failed: ' . $update->error);
        }
        $update->close();
    } elseif ($existing_hash === $device_hash) {
        // Device matches
        echo json_encode(['message' => 'Match_Found']);
    } else {
        // Device mismatch
        http_response_code(403);
        echo json_encode(['message' => 'User_Already_Has_Registered_Device']);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    error_log('Device Verification Error: ' . $e->getMessage());
    echo json_encode(['message' => 'Server_Error', 'error' => $e->getMessage()]);
    exit;
}
?>