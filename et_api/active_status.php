<?php

header("Content-Type: application/json");

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Methods: GET, POST");

header("Access-Control-Allow-Headers: Content-Type");

date_default_timezone_set('Asia/Kolkata');

// Include database configuration

require_once 'config.php';



try {

    // Create connection

    $conn = new mysqli($servername, $username, $password, $dbname);



    // Check connection

    if ($conn->connect_error) {

        throw new Exception("Connection failed: " . $conn->connect_error);

    }



    // Query to fetch all user details and the most recent login_timestamp

    $query = "

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

            ud.u_cv,

            ud.u_created_at,

            ud.u_updated_at,

            ud.u_active,

            ad.is_logged_out,

            ad.login_timestamp AS most_recent_login

        FROM user_details ud

        INNER JOIN (

            SELECT user_id, is_logged_out, login_timestamp

            FROM attendance_details

            WHERE login_timestamp = (

                SELECT MAX(login_timestamp)

                FROM attendance_details ad2

                WHERE ad2.user_id = attendance_details.user_id

            )

        ) ad ON ud.u_id = ad.user_id

        WHERE ud.u_is_del = 0";



    $result = $conn->query($query);



    if ($result) {

        $users = array();

        while ($row = $result->fetch_assoc()) {

            $users[] = $row;

        }

        echo json_encode(['status' => 'success', 'data' => $users], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    } else {

        throw new Exception("Query failed: " . $conn->error);

    }



    // Close connection

    $conn->close();

} catch (Exception $e) {

    echo json_encode([

        'status' => 'error',

        'message' => $e->getMessage()

    ]);

}

