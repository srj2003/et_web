<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include config and token verifier
require_once 'config.php';
require_once 'auth.php';

$response = [
    'status' => 'error',
    'message' => 'Invalid request',
    'data' => null
];

try {
    // PDO connection
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verify token using PDO version
    $auth = verifyTokenPDO($pdo);
    if (!$auth['status']) {
        echo json_encode([
            'status' => 'error',
            'message' => $auth['message']
        ]);
        exit;
    }

    $user_id = $auth['user_id'];

    // SQL query to fetch all expenses with employee names
    $stmt = $pdo->prepare("
        SELECT e.*, ud.u_fname, ud.u_lname 
        FROM expense_details e
        LEFT JOIN user_details ud ON e.expense_created_by = ud.u_id
        ORDER BY e.expense_created_at DESC
    ");
    $stmt->execute();
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $jsonData = array();
    foreach ($expenses as $row) {
        // Map expense_status values to human-readable text
        $status = "";
        switch ($row['expense_status']) {
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
            'expense_id' => $row['expense_id'],
            'expense_title' => $row['expense_title'],
            'expense_amount' => $row['expense_amount'],
            'expense_description' => $row['expense_description'],
            'expense_date' => $row['expense_date'],
            'expense_status' => $row['expense_status'],
            'expense_status_text' => $status,
            'expense_created_by' => $row['expense_created_by'],
            'employee_name' => $employeeName,
            'expense_created_at' => $row['expense_created_at'],
            'expense_updated_at' => $row['expense_updated_at'],
            'expense_submitted_to' => $row['expense_submitted_to'],
            'expense_approved_rejected_by' => $row['expense_approved_rejected_by'],
            'expense_approved_rejected_at' => $row['expense_approved_rejected_at'],
            'expense_remarks' => $row['expense_remarks']
        );
    }

    // Send response
    echo json_encode([
        'status' => 'success',
        'message' => 'Expenses data fetched successfully',
        'data' => $jsonData
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
    exit;
}