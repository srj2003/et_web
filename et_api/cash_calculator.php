<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods,Authorization,X-Requested-With');

require_once 'config.php';

$conn = new mysqli($servername, $username, $password, $dbname);

// Check if it's a GET request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode([
        'status' => 405,
        'message' => 'Method Not Allowed'
    ]);
    exit;
}

// Check if user_id is provided
if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
    echo json_encode([
        'status' => 400,
        'message' => 'User ID is required'
    ]);
    exit;
}

$user_id = mysqli_real_escape_string($conn, $_GET['user_id']);

// Check if date is provided and valid
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m');
if (!preg_match('/^\d{4}-\d{2}$/', $date)) {
    echo json_encode([
        'status' => 400,
        'message' => 'Invalid date format. Use YYYY-MM'
    ]);
    exit;
}

function checkCashInHand($conn, $user_id)
{
    $search_credit_query = "SELECT SUM(erd.requisition_app_amount) AS 'credit_amount' 
                           FROM `expense_requisition_details` erd 
                           WHERE erd.`requisition_created_by`='$user_id' 
                           AND erd.`requisition_approved_rejected_by` IS NOT NULL 
                           AND erd.`requisition_status` IN ('1','2')";

    $run_credit_query = mysqli_query($conn, $search_credit_query);
    $fetch_credit_query = mysqli_fetch_array($run_credit_query);
    $credit_amount = ($fetch_credit_query['credit_amount'] ? $fetch_credit_query['credit_amount'] : 0);

    $search_req_debit_query = "SELECT SUM(etd.expense_total_amount) AS 'req_debit_amount' 
                              FROM `expense_track_details` etd 
                              WHERE etd.`expense_track_created_by`!='$user_id' 
                              AND etd.`expense_track_approved_rejected_by`='$user_id' 
                              AND etd.`expense_track_status` IN ('1')";

    $run_req_debit_query = mysqli_query($conn, $search_req_debit_query);
    $fetch_req_debit_query = mysqli_fetch_array($run_req_debit_query);
    $req_debit_amount = ($fetch_req_debit_query['req_debit_amount'] ? $fetch_req_debit_query['req_debit_amount'] : 0);

    $search_debit_query = "SELECT SUM(etd.expense_total_amount) AS 'debit_amount' 
                          FROM `expense_track_details` etd 
                          WHERE etd.`expense_track_created_by`='$user_id' 
                          AND etd.`expense_track_approved_rejected_by` IS NOT NULL 
                          AND etd.`expense_track_status` IN ('1')";

    $run_debit_query = mysqli_query($conn, $search_debit_query);
    $fetch_debit_query = mysqli_fetch_array($run_debit_query);
    $debit_amount = ($fetch_debit_query['debit_amount'] ? $fetch_debit_query['debit_amount'] : 0);

    $cash_in_hand = $credit_amount - ($debit_amount + $req_debit_amount);

    return [
        'cash_in_hand' => $cash_in_hand,
        'details' => [
            'credit_amount' => (float)$credit_amount,
            'debit_amount' => (float)$debit_amount,
            'req_debit_amount' => (float)$req_debit_amount
        ]
    ];
}

function checkExpenseOfMonth($conn, $user_id, $date)
{
    $search_debit_query = "SELECT SUM(etd.expense_total_amount) AS 'debit_amount' 
                          FROM `expense_track_details` etd 
                          WHERE etd.`expense_track_created_by`='$user_id' 
                          AND etd.`expense_track_approved_rejected_by` IS NOT NULL 
                          AND etd.`expense_track_status` IN ('1') 
                          AND DATE_FORMAT(etd.expense_track_created_at, '%Y-%m')='$date'";

    $run_debit_query = mysqli_query($conn, $search_debit_query);
    $fetch_debit_query = mysqli_fetch_array($run_debit_query);
    return ($fetch_debit_query['debit_amount'] ? $fetch_debit_query['debit_amount'] : 0);
}

function checkExpenseRequestedOfMonth($conn, $user_id, $date)
{
    $search_debit_query = "SELECT SUM(etd.expense_total_amount) AS 'debit_amount' 
                          FROM `expense_track_details` etd 
                          WHERE etd.`expense_track_approved_rejected_by`='$user_id' 
                          AND etd.`expense_track_approved_rejected_by` IS NOT NULL 
                          AND etd.`expense_track_status` IN ('1') 
                          AND DATE_FORMAT(etd.expense_track_created_at, '%Y-%m')='$date'";

    $run_debit_query = mysqli_query($conn, $search_debit_query);
    $fetch_debit_query = mysqli_fetch_array($run_debit_query);
    return ($fetch_debit_query['debit_amount'] ? $fetch_debit_query['debit_amount'] : 0);
}

function checkRequisitionRequestedOfMonth($conn, $user_id, $date)
{
    $search_credit_query = "SELECT SUM(erd.requisition_app_amount) AS 'credit_amount' 
                           FROM `expense_requisition_details` erd 
                           WHERE erd.`requisition_approved_rejected_by`='$user_id' 
                           AND erd.`requisition_approved_rejected_by` IS NOT NULL 
                           AND erd.`requisition_status` IN ('1','2')";

    $run_credit_query = mysqli_query($conn, $search_credit_query);
    $fetch_credit_query = mysqli_fetch_array($run_credit_query);
    return ($fetch_credit_query['credit_amount'] ? $fetch_credit_query['credit_amount'] : 0);
}

try {
    $cash_in_hand = checkCashInHand($conn, $user_id);
    $monthly_expense = checkExpenseOfMonth($conn, $user_id, $date);
    $monthly_expense_requests = checkExpenseRequestedOfMonth($conn, $user_id, $date);
    $monthly_requisition_requests = checkRequisitionRequestedOfMonth($conn, $user_id, $date);

    echo json_encode([
        'status' => 200,
        'message' => 'Success',
        'data' => [
            'cash_in_hand' => $cash_in_hand,
            'monthly_analytics' => [
                'date' => $date,
                'expense' => (float)$monthly_expense,
                'expense_requests' => (float)$monthly_expense_requests,
                'requisition_requests' => (float)$monthly_requisition_requests
            ]
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 500,
        'message' => 'Internal Server Error',
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
