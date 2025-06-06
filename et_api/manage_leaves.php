<?php

// Enable CORS for localhost testing

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: http://localhost:5173");



header("Access-Control-Allow-Credentials: true");

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");




// Handle preflight (OPTIONS) request

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(200);

    exit();

}



// Database connection settings

require_once 'config.php'; // Include your database configuration file



// Create database connection

$conn = new mysqli($servername, $username, $password, $dbname);



// Check connection

if ($conn->connect_error) {

    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);

    exit();

}



// Prepare SQL query to fetch leave details and user information

$sql = "

    SELECT 

        l.leave_id,

        l.leave_title,

        l.leave_ground,

        l.leave_track_status,

        l.leave_from_date,

        l.leave_to_date,

        l.leave_comment,

        l.leave_track_created_by,

        l.leave_track_created_at,

        l.leave_track_submitted_to,

        creator.u_fname,

        creator.u_mname,

        creator.u_lname,

        approver.u_fname as submitted_to_fname,

        approver.u_mname as submitted_to_mname,

        approver.u_lname as submitted_to_lname,

        GROUP_CONCAT(d.doc_name SEPARATOR '||') as doc_names,

        GROUP_CONCAT(d.doc_file_url SEPARATOR '||') as doc_urls

    FROM 

        leave_track_details l

    INNER JOIN 

        user_details creator ON l.leave_track_created_by = creator.u_id

    LEFT JOIN

        user_details approver ON l.leave_track_submitted_to = approver.u_id

    LEFT JOIN

        leave_track_documents d ON l.leave_id = d.leave_id

    WHERE 

        l.leave_track_status IS NULL

    GROUP BY

        l.leave_id

    ORDER BY
        l.leave_track_created_at DESC

";



$result = $conn->query($sql);



// Initialize response array

$jsonData = [];



if ($result->num_rows > 0) {

    while ($row = $result->fetch_assoc()) {

        // Convert leave_ground to text

        $leaveGroundText = '';

        switch ($row['leave_ground']) {

            case '0':

                $leaveGroundText = 'Casual Leave';

                break;

            case '1':

                $leaveGroundText = 'Medical Leave';

                break;

            case '2':

                $leaveGroundText = 'Half Day Leave';

                break;

            default:

                $leaveGroundText = 'Unknown';

        }



        $jsonData[] = [

            'leave_id' => $row['leave_id'],

            'user_name' => $row['u_fname'] . ' ' . ($row['u_mname'] ? $row['u_mname'] . ' ' : '') . $row['u_lname'],

            'leave_title' => $row['leave_title'],

            'leave_comment' => $row['leave_comment'],

            'leave_ground' => $leaveGroundText,

            'leave_track_status' => $row['leave_track_status'],

            'leave_track_created_by' => $row['leave_track_created_by'],

            'leave_from_date' => $row['leave_from_date'],

            'leave_to_date' => $row['leave_to_date'],

            'leave_track_created_at' => $row['leave_track_created_at'],

            'leave_track_submitted_to_id' => $row['leave_track_submitted_to'],  // Add this line

            'submitted_to' => $row['submitted_to_fname'] . ' ' .

                ($row['submitted_to_mname'] ? $row['submitted_to_mname'] . ' ' : '') .

                $row['submitted_to_lname'],

            'documents' => !empty($row['doc_names']) ? array_map(

                function ($name, $url) {

                    return ['name' => $name, 'url' => $url];

                },

                explode('||', $row['doc_names']),

                explode('||', $row['doc_urls'])

            ) : []

        ];

    }

} else {

    $jsonData = ['status' => 'error', 'message' => 'No unattained leave requests found'];

}



// Close database connection

$conn->close();



// Send JSON response

header('Content-Type: application/json');

echo json_encode($jsonData);

