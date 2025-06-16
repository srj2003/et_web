<?php

// config.php



// Database Configuration

$servername = 'geomaticxevs.in';

$username = 'geoma7i3_demo_user';

$password = 'eT@dEm0##25';

$dbname = 'geoma7i3_demo_et_dms';



// Set timezone

date_default_timezone_set('Asia/Kolkata');



// CORS headers

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");

header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

header("Content-Type: application/json");



// Handle OPTIONS requests

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(200);

    exit();

}



// Token Configuration

define('TOKEN_LIFETIME', 86400); // 24 hours in seconds



// Token generation function

function generateToken($userId, $roleId)
{

    $tokenData = [

        'user_id' => $userId,

        'role_id' => $roleId,

        'created' => time()

    ];



    return base64_encode(json_encode($tokenData));

}



// Token verification function

function verifyToken()
{

    $headers = getallheaders();



    if (!isset($headers['Authorization'])) {

        http_response_code(401);

        echo json_encode([

            "status" => "error",

            "message" => "Missing Authorization header"

        ]);

        exit();

    }

    try {

        $token = str_replace('Bearer ', '', $headers['Authorization']);

        $tokenData = json_decode(base64_decode($token), true);



        if (!$tokenData || !isset($tokenData['user_id']) || !isset($tokenData['created'])) {

            throw new Exception("Invalid token format");

        }

        // Check token expiry

        if (time() - $tokenData['created'] > TOKEN_LIFETIME) {

            throw new Exception("Token expired");

        }

        return $tokenData;

    } catch (Exception $e) {

        http_response_code(401);

        echo json_encode([

            "status" => "error",

            "message" => $e->getMessage()

        ]);

        exit();

    }

}



// Define public routes that don't need token verification

$public_routes = ['login.php'];



// Auto verify token for non-public routes

$current_file = basename($_SERVER['PHP_SELF']);

if (!in_array($current_file, $public_routes) && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {

    verifyToken();

}



// Helper function for JSON responses

function sendJsonResponse($data, $status = 'success', $code = 200)
{

    http_response_code($code);

    echo json_encode([

        'status' => $status,

        'data' => $data

    ]);

    exit();

}

?>