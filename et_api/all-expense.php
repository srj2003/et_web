<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// $servername = 'geomaticxevs.in';
// $username = 'geoma7i3_demo_user';
// $password = 'eT@dEm0##25';
// $dbname = 'geoma7i3_demo_et_dms';

require_once 'config.php'; // Include your database configuration file

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([
        "error" => "Connection failed: " . $conn->connect_error
    ]));
}

try {
    // Update SQL query to include expense_head_title
    $sql = "
        SELECT 
            e.expense_track_id,
            e.expense_track_title,
            e.expense_type_id,
            e.expense_total_amount,
            e.expense_track_status,
            e.expense_track_app_rej_remarks,
            e.expense_track_created_at,
            e.expense_track_created_by,
            e.expense_track_submitted_to,
            e.expense_track_approved_rejected_by,
            e.expense_track_approved_rejected_at,
            CONCAT(creator.u_fname, ' ', creator.u_lname) as created_by_full_name,
            CONCAT(submitter.u_fname, ' ', submitter.u_lname) as submitted_to_full_name,
            CONCAT(approver.u_fname, ' ', approver.u_lname) as approved_rejected_by_full_name,
            ed.expense_id,
            ed.expense_head_id,
            eh.expense_head_title,
            ed.expense_product_name,
            ed.expense_product_qty,
            ed.expense_product_unit,
            ed.expense_product_desc,
            ed.expense_product_photo_path,
            ed.expense_product_bill_photo_path,
            ed.expense_product_sl_no,
            ed.expense_product_amount,
            ed.expense_bill_date,
            ed.expense_product_created_at,
            ed.expense_product_updated_at,
            ed.expense_product_is_del
        FROM 
            expense_track_details e
        LEFT JOIN 
            user_details creator ON e.expense_track_created_by = creator.u_id
        LEFT JOIN 
            user_details submitter ON e.expense_track_submitted_to = submitter.u_id
        LEFT JOIN 
            user_details approver ON e.expense_track_approved_rejected_by = approver.u_id
        LEFT JOIN
            expense_details ed ON e.expense_track_id = ed.expense_track_id
        LEFT JOIN
            expense_heads eh ON ed.expense_head_id = eh.expense_head_id
        ORDER BY 
            e.expense_track_created_at DESC
    ";

    $result = $conn->query($sql);

    if ($result === false) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $expenses = [];
    $currentExpense = null;

    while ($row = $result->fetch_assoc()) {
        $expenseId = $row['expense_track_id'];

        if ($currentExpense === null || $currentExpense['expense_track_id'] !== $expenseId) {
            // Create new expense entry
            if ($currentExpense !== null) {
                $expenses[] = $currentExpense;
            }

            $currentExpense = [
                'expense_track_id' => (string)$row['expense_track_id'],
                'expense_track_title' => $row['expense_track_title'],
                'expense_type_id' => (int)$row['expense_type_id'],
                'expense_total_amount' => (float)$row['expense_total_amount'],
                'expense_track_status' => $row['expense_track_status'] !== null ?
                    (int)$row['expense_track_status'] : null,
                'expense_track_app_rej_remarks' => $row['expense_track_app_rej_remarks'],
                'expense_track_created_at' => $row['expense_track_created_at'],
                'expense_track_created_by' => (int)$row['expense_track_created_by'],
                'expense_track_submitted_to' => $row['expense_track_submitted_to'] !== null ?
                    (int)$row['expense_track_submitted_to'] : null,
                'expense_track_approved_rejected_by' => $row['expense_track_approved_rejected_by'] !== null ?
                    (int)$row['expense_track_approved_rejected_by'] : null,
                'expense_track_approved_rejected_at' => $row['expense_track_approved_rejected_at'],
                'created_by_full_name' => $row['created_by_full_name'],
                'submitted_to_full_name' => $row['submitted_to_full_name'],
                'approved_rejected_by_full_name' => $row['approved_rejected_by_full_name'],
                'expense_details' => []
            ];
        }

        // Add expense details if they exist
        if ($row['expense_id']) {
            $currentExpense['expense_details'][] = [
                'expense_id' => (int)$row['expense_id'],
                'expense_head_id' => (int)$row['expense_head_id'],
                'expense_head_title' => $row['expense_head_title'],  // Add this line
                'expense_product_name' => $row['expense_product_name'],
                'expense_product_qty' => (float)$row['expense_product_qty'],
                'expense_product_unit' => $row['expense_product_unit'],
                'expense_product_desc' => $row['expense_product_desc'],
                'expense_product_photo_path' => $row['expense_product_photo_path'],
                'expense_product_bill_photo_path' => $row['expense_product_bill_photo_path'],
                'expense_product_sl_no' => $row['expense_product_sl_no'],
                'expense_product_amount' => (float)$row['expense_product_amount'],
                'expense_bill_date' => $row['expense_bill_date'],
                'expense_product_created_at' => $row['expense_product_created_at'],
                'expense_product_updated_at' => $row['expense_product_updated_at'],
                'expense_product_is_del' => (int)$row['expense_product_is_del']
            ];
        }
    }

    // Add the last expense
    if ($currentExpense !== null) {
        $expenses[] = $currentExpense;
    }

    // Send the response
    echo json_encode($expenses);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
} finally {
    $conn->close();
}
