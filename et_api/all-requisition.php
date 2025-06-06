<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

// Database connection settings
require_once 'config.php';

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['error' => 'Connection failed: ' . $conn->connect_error]);
    exit();
}

// SQL query to fetch all requisitions
$sql = "SELECT erd.*, 
               ud.u_fname, ud.u_mname, ud.u_lname,
               submitted.u_fname as submitted_to_fname,
               submitted.u_mname as submitted_to_mname,
               submitted.u_lname as submitted_to_lname,
               approved.u_fname as approved_by_fname,
               approved.u_mname as approved_by_mname,
               approved.u_lname as approved_by_lname
        FROM expense_requisition_details erd
        LEFT JOIN user_details ud ON erd.requisition_created_by = ud.u_id 
        LEFT JOIN user_details submitted ON erd.requisition_submitted_to = submitted.u_id
        LEFT JOIN user_details approved ON erd.requisition_approved_rejected_by = approved.u_id
        ORDER BY erd.requisition_id DESC";
$result = $conn->query($sql);

$jsonData = array();
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Format the data for JSON response
        $jsonData[] = array(
            'requisition_id' => (int) $row['requisition_id'],
            'requisition_title' => $row['requisition_title'],
            'requisition_type' => (int) $row['requisition_type'],
            'requisition_date' => $row['requisition_date'],
            'requisition_comment' => $row['requisition_comment'],
            'requisition_status' => isset($row['requisition_status']) ? (int) $row['requisition_status'] : null,
            'requisition_created_by' => (int) $row['requisition_created_by'],
            'requisition_created_at' => $row['requisition_created_at'],
            'requisition_updated_at' => $row['requisition_updated_at'],
            'requisition_req_amount' => (float) $row['requisition_req_amount'],
            'requisition_app_amount' => (float) $row['requisition_app_amount'],
            'created_by_full_name' => trim($row['u_fname'] . " " . $row['u_mname'] . " " . $row['u_lname']),
            'submitted_to_full_name' => trim($row['submitted_to_fname'] . " " . $row['submitted_to_mname'] . " " . $row['submitted_to_lname']),
            'approved_rejected_by_full_name' => trim($row['approved_by_fname'] . " " . $row['approved_by_mname'] . " " . $row['approved_by_lname'])
        );
    }
}

// Close connection
$conn->close();

// Output JSON
echo json_encode($jsonData);
