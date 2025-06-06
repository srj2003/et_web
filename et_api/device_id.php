<?php
// Start session
session_start();

// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');

// Set timezone
date_default_timezone_set('Asia/Kolkata');

// Include database configuration
require_once 'config.php'; // Replace with your actual database configuration file

// Handle preflight requests (OPTIONS method)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Initialize response array
$response = [
    'status' => 'error',
    'message' => 'Invalid request',
    'data' => []
];

// Establish database connection
$con = new mysqli($servername, $username, $password, $dbname);

// Check database connection
if ($con->connect_error) {
    $response['message'] = 'Database connection failed: ' . $con->connect_error;
    echo json_encode($response);
    exit;
}

// Handle POST request (login)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get raw JSON input
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);

    // Validate JSON input
    if (json_last_error() === JSON_ERROR_NONE && isset($data['u_identify']) && isset($data['u_pass']) && isset($data['device_id'])) {
        $u_identify = trim($data['u_identify']);
        $u_pass = md5(trim($data['u_pass'])); // Hash the password
        $device_id = trim($data['device_id']); // Get the device ID

        // Query to fetch user details
        $query = "SELECT * FROM user_details WHERE (u_email = ? OR u_mob = ?) AND u_pass = ?";
        $stmt = $con->prepare($query);

        if ($stmt) {
            $stmt->bind_param('sss', $u_identify, $u_identify, $u_pass);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();

                // Check if the user is active
                if ($user['u_active'] == 0) {
                    $response['message'] = 'You are deactivated! Need admin permission for login!';
                } else {
                    // Check if device_id is already stored
                    if (empty($user['device_id'])) {
                        // First login: Store the device ID
                        $updateQuery = "UPDATE user_details SET device_id = ? WHERE u_id = ?";
                        $updateStmt = $con->prepare($updateQuery);
                        if ($updateStmt) {
                            $updateStmt->bind_param('si', $device_id, $user['u_id']);
                            $updateStmt->execute();
                            $updateStmt->close();
                        }
                    } elseif ($user['device_id'] !== $device_id) {
                        // Device mismatch
                        $response['message'] = 'Login is restricted to the first device used.';
                        echo json_encode($response);
                        exit;
                    }

                    // Prepare success response
                    $response['status'] = 'success';
                    $response['message'] = 'Login successful';
                    $response['data'] = [
                        'userid' => $user['u_id'],
                        'useremail' => $user['u_email'],
                        'usermob' => $user['u_mob'],
                        'userfullname' => $user['u_fname'] . " " . $user['u_mname'] . " " . $user['u_lname'],
                        'user_city' => $user['u_city'],
                        'user_state' => $user['u_state'],
                        'user_country' => $user['u_country'],
                        'user_zip_code' => $user['u_zip_code'],
                        'user_street_address' => $user['u_street_addr'],
                        'role_id' => $user['role_id'] ?? null,
                        'device_id' => $user['device_id']
                    ];
                }
            } else {
                $response['message'] = 'Invalid login credentials';
            }

            $stmt->close();
        } else {
            $response['message'] = 'Database query preparation failed';
        }
    } else {
        $response['message'] = 'Invalid JSON input';
    }
} else {
    $response['message'] = 'Only POST requests are allowed';
}

// Send JSON response
echo json_encode($response);
?>