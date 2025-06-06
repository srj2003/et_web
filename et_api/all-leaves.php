<?php

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Headers: *");

header('Content-Type: application/json');



// Database connection settings

require_once 'config.php';



// Create connection

$conn = new mysqli($servername, $username, $password, $dbname);



// Check connection

if ($conn->connect_error) {

    echo json_encode(['error' => 'Connection failed: ' . $conn->connect_error]);

    exit();

}



// SQL query to fetch all leaves with employee names

$sql = "SELECT lt.*, ud.u_fname, ud.u_lname 

        FROM leave_track_details lt

        LEFT JOIN user_details ud ON lt.leave_track_created_by = ud.u_id
        ORDER BY lt.leave_track_created_at DESC";

$result = $conn->query($sql);



$jsonData = array();

if ($result->num_rows > 0) {

    while ($row = $result->fetch_assoc()) {

        // Map leave_ground values to human-readable text

        $leaveType = "";

        switch ($row['leave_ground']) {

            case 0:

                $leaveType = "Casual Leave";

                break;

            case 1:

                $leaveType = "Medical Leave";

                break;

            case 2:

                $leaveType = "Half Day Leave";

                break;

            default:

                $leaveType = "Unknown";

        }



        // Map leave_track_status values to human-readable text

        $status = "";

        switch ($row['leave_track_status']) {

            case null:

                $status = "Unattended";

                break;

            case 0:

                $status = "Rejected";

                break;

            case 1:

                $status = "Approved";

                break;

            case 2:

                $status = "Suspended";

                break;

            default:

                $status = "Unknown";

        }



        // Combine first and last name

        $employeeName = trim($row['u_fname'] . ' ' . $row['u_lname']);



        // Format the data for JSON response

        $jsonData[] = array(

            'leave_id' => $row['leave_id'],

            'leave_title' => $row['leave_title'],

            'leave_ground' => $row['leave_ground'],

            'leave_ground_text' => $leaveType,

            'leave_from_date' => $row['leave_from_date'],

            'leave_to_date' => $row['leave_to_date'],

            'leave_comment' => $row['leave_comment'],

            'leave_acpt_rql_remarks' => $row['leave_acpt_rql_remarks'],

            'leave_track_status' => $row['leave_track_status'],

            'leave_track_status_text' => $status,

            'leave_track_created_by' => $row['leave_track_created_by'],

            'employee_name' => $employeeName,

            'leave_track_created_at' => $row['leave_track_created_at'],

            'leave_track_updated_at' => $row['leave_track_updated_at'],

            'leave_track_submitted_to' => $row['leave_track_submitted_to'],

            'leave_track_approved_rejected_by' => $row['leave_track_approved_rejected_by'],

            'leave_track_approved_rejected_at' => $row['leave_track_approved_rejected_at']

            


        );

    }

}



// Close connection

$conn->close();



// Output JSON

echo json_encode($jsonData);

