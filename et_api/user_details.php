<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");



require_once 'config.php';
require_once 'auth.php';



try {

    // Connect to the database

    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);



    // Authenticate user

    $auth = verifyTokenPDO($pdo);

    if (!$auth['status']) {

        echo json_encode([

            'status' => 'error',

            'message' => $auth['message']

        ]);

        exit();

    }



    // Query to fetch all user details along with their roles and most recent is_logged_out status

    $stmt = $pdo->prepare("

        SELECT 

            ud.u_id,

            ud.user_id,

            ud.u_fname,

            ud.u_mname,

            ud.u_lname,

            CONCAT(ud.u_fname, ' ', ud.u_mname, ' ', ud.u_lname) AS user,

            ud.u_gender,

            ud.u_email,

            ud.u_mob,

            ud.u_city,

            ud.u_state,

            ud.u_country,

            ud.u_zip_code,

            ud.u_street_addr,

            ud.u_organization,

            

            ud.u_cv,

            ud.u_created_at,

            ud.u_updated_at,

            ud.u_active,

            ur.role_name,

            ad.is_logged_out

            FROM user_details ud

            LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0

            LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0

            LEFT JOIN (

            SELECT a1.user_id, a1.is_logged_out

            FROM attendance_details a1

            INNER JOIN (

                SELECT user_id, MAX(login_timestamp) AS max_login

                FROM attendance_details

                WHERE DATE(login_timestamp) = :today

                GROUP BY user_id

            ) a2 ON a1.user_id = a2.user_id AND a1.login_timestamp = a2.max_login

        ) ad ON ud.u_id = ad.user_id

        WHERE ud.u_is_del = 0;

    ");



    $stmt->execute();



    // Fetch all results

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);



    // Return JSON response

    echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {

    echo json_encode(["error" => $e->getMessage()]);

}

