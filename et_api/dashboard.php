<?php

header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow POST and GET requests
header("Access-Control-Allow-Headers: Content-Type, Authorization");


// Handle preflight OPTIONS request

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


// Get JSON input

$json = file_get_contents('php://input');

$data = json_decode($json, true);



// Verify if requested userId matches session userId

if (!isset($data['userId']) || $data['userId'] != $_SESSION['userid']) {

    $response['message'] = 'Unauthorized access or invalid user ID';

    echo json_encode($response);

    exit();

}



// Database connection settings

require_once 'config.php'; // Include your database configuration file



// Create connection

$conn = new mysqli($servername, $username, $password, $dbname);



// Check connection

if ($conn->connect_error) {

    die(json_encode(['error' => "Connection failed: " . $conn->connect_error]));
}



// SQL query to fetch user details
$sql = "SELECT 
            ud.*,
            (SELECT COUNT(*) 
             FROM attendance_details ad 
             WHERE ad.user_id = ud.u_id 
             AND ad.is_logged_out = 0 
             AND DATE(ad.login_timestamp) BETWEEN DATE_FORMAT(CURDATE(),'%Y-%m-01') 
             AND CURDATE()
            ) as not_logged_out_count
        FROM user_details ud
        WHERE ud.u_id = ? AND ud.u_is_del = 0";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $data['userId']);
$stmt->execute();
$result = $stmt->get_result();



if ($result->num_rows > 0) {

    $row = $result->fetch_assoc();

    // Remove sensitive information

    unset($row['u_pass']);

    unset($row['u_cv']);

    echo json_encode([

        'status' => 'success',

        'data' => $row

    ]);
} else {

    echo json_encode([

        'status' => 'error',

        'message' => 'User not found'

    ]);
}



$conn->close();
?>
