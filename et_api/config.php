<?php

// config.php



// Database Configuration


$servername = 'geomaticxevs.in';

$username = 'geoma7i3_demo_user';

$password = 'eT@dEm0##25';

$dbname = 'geoma7i3_demo_et_dms';



// Session Configuration

define('SESSION_LIFETIME', 1800); // 30 minutes in seconds

define('SESSION_NAME', 'ET_SESSION');



// Initialize session

session_start();



// CORS headers

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");

header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

header("Content-Type: application/json");



// Define public routes that don't need session verification

$public_routes = ['login.php'];



// Auto verify session for all non-public routes

$current_file = basename($_SERVER['PHP_SELF']);

if (!in_array($current_file, $public_routes)) {

    // Handle OPTIONS request

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

        http_response_code(200);

        exit();

    }



    // Verify session exists and matches database

    // Get session ID from request headers

    $headers = getallheaders();

    $frontend_session_id = isset($headers['Session-Id']) ? $headers['Session-Id'] : null;

    $frontend_user_id = isset($headers['User-Id']) ? $headers['User-Id'] : null;



    if (!$frontend_session_id || !$frontend_user_id) {

        http_response_code(401);

        echo json_encode([

            'status' => 'error',

            'message' => 'No session credentials provided',

            'code' => 401

        ]);

        exit();

    }



    // Check session in database

    $conn = new mysqli($servername, $username, $password, $dbname);

    $query = "SELECT * FROM user_sessions WHERE session_id = ? AND user_id = ? 

              ORDER BY login_time DESC LIMIT 1";



    $stmt = $conn->prepare($query);

    $stmt->bind_param('si', $frontend_session_id, $frontend_user_id);

    $stmt->execute();

    $result = $stmt->get_result();



    if ($result->num_rows === 0) {

        http_response_code(401);

        echo json_encode([

            'status' => 'error',

            'message' => 'Invalid session',

            'code' => 401

        ]);

        exit();

    }



    // Update last activity

    $_SESSION['last_activity'] = time();

}



// Helper functions

function sendJsonResponse($data, $status = 'success', $code = 200)
{

    $response = [

        'status' => $status,

        'data' => $data,

        'session' => [

            'id' => session_id(),

            'name' => SESSION_NAME

        ]

    ];


    http_response_code($code);

    echo json_encode($response);

    exit();

}