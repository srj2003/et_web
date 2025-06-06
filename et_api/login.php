<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
date_default_timezone_set('Asia/Kolkata');
require_once 'config.php'; // Include your database configuration file

// Handle preflight requests (OPTIONS method)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Continue with the rest of your PHP code...
?>
<?php
// api.php

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set response header to JSON
header('Content-Type: application/json');

// Initialize response array
$response = [
    'status' => 'error',
    'message' => 'Invalid request',
    'data' => []
];

// Function to validate request method
function handleRequest($method)
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
        exit();
    }
}

handleRequest('POST');

// Get JSON input
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (json_last_error() === JSON_ERROR_NONE && isset($data['u_identify']) && isset($data['u_pass'])) {
    $u_identify = trim($data['u_identify']);
    $u_pass = md5(trim($data['u_pass']));

    // Database connection
    $con = new mysqli($servername, $username, $password, $dbname);

    if ($con->connect_error) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection failed'
        ]);
        exit();
    }

    // Updated query to join with assigned_role table
    $query = "SELECT ud.*, ar.role_id 
             FROM user_details ud 
             LEFT JOIN assigned_role ar 
             ON ud.u_id = ar.u_id 
             AND ar.ass_role_del = 0 
             WHERE (ud.u_email = ? OR ud.u_mob = ?) 
             AND ud.u_pass = ?
             ORDER BY ar.ass_role_created_at DESC
             LIMIT 1";

    $stmt = $con->prepare($query);

    if ($stmt) {
        $stmt->bind_param('sss', $u_identify, $u_identify, $u_pass);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();

            // Validate login
            if ($user['u_active'] == 0) {
                $response['message'] = 'Account deactivated';
            } else {
                // Set session variables
                $_SESSION['userid'] = $user['u_id'];
                $_SESSION['useremail'] = $user['u_email'];
                $_SESSION['role_id'] = $user['role_id'];
                $_SESSION['last_activity'] = time();

                $response = [
                    'status' => 'success',
                    'message' => 'Login successful',
                    'data' => [
                        'userid' => $user['u_id'],
                        'useremail' => $user['u_email'],
                        'role_id' => $user['role_id']
                    ],
                    'session' => [
                        'id' => session_id(),
                        'name' => SESSION_NAME
                    ]
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

// Send JSON response
echo json_encode($response);
?>