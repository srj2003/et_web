<?php

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Headers: *");

header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

header("Access-Control-Allow-Headers: Content-Type, Authorization");

header('Content-Type: application/json');



error_reporting(E_ALL);

ini_set('display_errors', 1);



if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(200);

    exit();

}



require_once 'config.php';



try {

    // Debug log to check headers

    error_log('Received headers: ' . print_r(getallheaders(), true));



    // Get and verify token first

    $tokenData = verifyToken();



    // Debug log token data

    error_log('Token data: ' . print_r($tokenData, true));



    $json = file_get_contents('php://input');

    $data = json_decode($json, true);



    if (!isset($data['userId'])) {

        throw new Exception('User ID is required');

    }



    // Verify token matches requested user

    if ($tokenData['user_id'] != $data['userId']) {

        throw new Exception('Unauthorized access: Token user ID does not match requested user ID');

    }



    $conn = new mysqli($servername, $username, $password, $dbname);



    if ($conn->connect_error) {

        throw new Exception("Connection failed: " . $conn->connect_error);

    }



    // Proceed with user data fetch

    $user_sql = "SELECT 

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



    $stmt = $conn->prepare($user_sql);

    if (!$stmt) {

        throw new Exception("Prepare failed: " . $conn->error);

    }



    $stmt->bind_param("i", $data['userId']);

    if (!$stmt->execute()) {

        throw new Exception("Execute failed: " . $stmt->error);

    }



    $result = $stmt->get_result();



    if ($result->num_rows > 0) {

        $row = $result->fetch_assoc();

        unset($row['u_pass']);

        unset($row['u_cv']);



        echo json_encode([

            'status' => 'success',

            'data' => $row

        ]);

    } else {

        throw new Exception('User not found');

    }



    $stmt->close();

    $conn->close();



} catch (Exception $e) {

    http_response_code(401);

    echo json_encode([

        'status' => 'error',

        'message' => $e->getMessage()

    ]);

}

?>