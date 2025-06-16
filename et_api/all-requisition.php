<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Database connection settings
require_once 'config.php';
require_once 'auth.php';

// Authenticate user using PDO (for token check only)
try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }
    $authenticated_user_id = $auth['user_id'];
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Authentication server error: ' . $e->getMessage()
    ]);
    exit;
}

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
               approved.u_lname as approved_by_lname,
               erd.requisition_submitted_to
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
            'approved_rejected_by_full_name' => trim($row['approved_by_fname'] . " " . $row['approved_by_mname'] . " " . $row['approved_by_lname']),
            'requisition_submitted_to' => isset($row['requisition_submitted_to']) ? (int) $row['requisition_submitted_to'] : null,
        );
    }
}

// Close connection
$conn->close();

// Output JSON
echo json_encode($jsonData);
