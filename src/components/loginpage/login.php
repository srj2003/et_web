<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
date_default_timezone_set('Asia/Kolkata');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

$response = [
    'status' => 'error',
    'message' => 'Invalid request',
    'data' => null,
    'token' => null
];

$con = new mysqli($servername, $username, $password, $dbname);

if ($con->connect_error) {
    $response['message'] = 'Database connection failed: ' . $con->connect_error;
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);

    if (json_last_error() === JSON_ERROR_NONE && isset($data['u_identify']) && isset($data['u_pass'])) {
        $u_identify = trim($data['u_identify']);
        $u_pass = md5(trim($data['u_pass']));

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

                if ($user['u_active'] == 0) {
                    $response['message'] = 'You are deactivated! Need admin permission for login!';
                } else {
                    // Generate random token
                    $token = bin2hex(random_bytes(32));

                    // Store token in database
                    $tokenStmt = $con->prepare("INSERT INTO tokens (user_id, token, created_at, expires_at) 
                                              VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY))");

                    if ($tokenStmt) {
                        $tokenStmt->bind_param("is", $user['u_id'], $token);
                        $tokenStmt->execute();
                        $tokenStmt->close();

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
                            'role_id' => $user['role_id']
                        ];
                        $response['token'] = $token;
                    } else {
                        $response['message'] = 'Token generation failed';
                    }
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

$con->close();
echo json_encode($response);
?>