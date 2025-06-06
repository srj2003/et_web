<?php
ob_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Safely load dependencies
$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    die('Error: vendor/autoload.php not found. Please run composer install.');
}
require $autoloadPath;

// Load DB config
require_once 'config.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

// Get parameters
$expense_type = isset($_GET['expense_type']) ? intval($_GET['expense_type']) : 0;
$creator_id = isset($_GET['creator_id']) ? intval($_GET['creator_id']) : 0;

if (!$expense_type || !$creator_id) {
    http_response_code(400);
    die('Invalid parameters: expense_type and creator_id are required.');
}

try {
    // DB Connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Prepare and execute query
    $sql = "SELECT 
        et.expense_track_title,
        et.expense_total_amount,
        et.expense_track_status,
        et.expense_track_created_at,
        et.expense_track_app_rej_remarks,
        u1.full_name AS created_by,
        u2.full_name AS submitted_to,
        u3.full_name AS approved_by,
        ed.expense_head_title,
        ed.expense_product_desc,
        ed.expense_product_qty,
        ed.expense_product_unit,
        ed.expense_bill_date,
        ed.expense_product_amount
    FROM expense_track et
    LEFT JOIN users u1 ON et.created_by = u1.u_id
    LEFT JOIN users u2 ON et.submitted_to = u2.u_id
    LEFT JOIN users u3 ON et.approved_rejected_by = u3.u_id
    LEFT JOIN expense_details ed ON et.expense_track_id = ed.expense_track_id
    WHERE et.expense_type = ? 
    AND et.created_by = ?
    ORDER BY et.expense_track_created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $expense_type, $creator_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $results = $result->fetch_all(MYSQLI_ASSOC);

    // Create Excel
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();

    $headers = [
        'Title', 'Total Amount', 'Status', 'Created Date', 'Remarks',
        'Created By', 'Submitted To', 'Approved By',
        'Expense Head', 'Description', 'Quantity', 'Unit',
        'Bill Date', 'Amount'
    ];

    foreach (range('A', 'N') as $i => $column) {
        $sheet->getColumnDimension($column)->setWidth(18);
        $sheet->setCellValue($column . '1', $headers[$i]);
        $sheet->getStyle($column . '1')->getFont()->setBold(true);
    }

    $row = 2;
    foreach ($results as $result) {
        $status = match ($result['expense_track_status']) {
            '0' => 'Rejected',
            '1' => 'Approved',
            '2' => 'Pending',
            default => 'Unattended',
        };

        $sheet->fromArray([
            $result['expense_track_title'],
            $result['expense_total_amount'],
            $status,
            $result['expense_track_created_at'],
            $result['expense_track_app_rej_remarks'],
            $result['created_by'],
            $result['submitted_to'],
            $result['approved_by'],
            $result['expense_head_title'],
            $result['expense_product_desc'],
            $result['expense_product_qty'],
            $result['expense_product_unit'],
            $result['expense_bill_date'],
            $result['expense_product_amount']
        ], null, 'A' . $row++);
    }

    // Send headers for file download
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;filename="expense_report.xlsx"');
    header('Cache-Control: max-age=0');

    // Clear previous output
    ob_clean();
    flush();

    // Write file
    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo 'Error: ' . $e->getMessage();
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
