<?php
require 'vendor/autoload.php';
require_once 'config.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    $creatorId = $input['creator_id'] ?? null;
    $expenseType = $input['expense_type'] ?? null;

    if (!$creatorId || !$expenseType) {
        throw new Exception('Missing required parameters');
    }

    // Fetch expense data
    $query = "
        SELECT 
            e.expense_track_id,
            e.expense_track_title,
            e.expense_total_amount,
            CASE 
                WHEN e.expense_track_status = '0' THEN 'Rejected'
                WHEN e.expense_track_status = '1' THEN 'Approved'
                WHEN e.expense_track_status = '2' THEN 'Pending'
                ELSE 'Unattended'
            END as status,
            CONCAT(creator.u_fname, ' ', creator.u_lname) as created_by,
            CONCAT(submitter.u_fname, ' ', submitter.u_lname) as submitted_to,
            CONCAT(approver.u_fname, ' ', approver.u_lname) as approved_by,
            e.expense_track_app_rej_remarks,
            e.expense_track_created_at,
            e.expense_track_approved_rejected_at,
            ed.expense_head_id,
            eh.expense_head_title,
            ed.expense_product_desc,
            ed.expense_product_qty,
            ed.expense_product_unit,
            ed.expense_bill_date,
            ed.expense_product_amount
        FROM expense_track_details e
        LEFT JOIN user_details creator ON e.expense_track_created_by = creator.u_id
        LEFT JOIN user_details submitter ON e.expense_track_submitted_to = submitter.u_id
        LEFT JOIN user_details approver ON e.expense_track_approved_rejected_by = approver.u_id
        LEFT JOIN expense_details ed ON e.expense_track_id = ed.expense_track_id
        LEFT JOIN expense_heads eh ON ed.expense_head_id = eh.expense_head_id
        WHERE e.expense_track_created_by = :creator_id
        AND e.expense_type_id = :expense_type
        ORDER BY e.expense_track_created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':creator_id' => $creatorId,
        ':expense_type' => $expenseType
    ]);
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Create new Spreadsheet
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();

    // Set headers
    $headers = [
        'Expense ID',
        'Title',
        'Total Amount',
        'Status',
        'Created By',
        'Submitted To',
        'Approved By',
        'Remarks',
        'Created Date',
        'Approved/Rejected Date',
        'Expense Head',
        'Description',
        'Quantity',
        'Unit',
        'Bill Date',
        'Amount'
    ];

    foreach (range('A', 'P') as $i => $col) {
        $sheet->setCellValue($col.'1', $headers[$i]);
        $sheet->getColumnDimension($col)->setAutoSize(true);
    }

    // Style the header row
    $headerStyle = [
        'font' => ['bold' => true],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        'borders' => [
            'allBorders' => ['borderStyle' => Border::BORDER_THIN]
        ],
        'fill' => [
            'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'E0E0E0']
        ]
    ];
    $sheet->getStyle('A1:P1')->applyFromArray($headerStyle);

    // Add data
    $row = 2;
    foreach ($results as $item) {
        $sheet->setCellValue('A'.$row, $item['expense_track_id']);
        $sheet->setCellValue('B'.$row, $item['expense_track_title']);
        $sheet->setCellValue('C'.$row, $item['expense_total_amount']);
        $sheet->setCellValue('D'.$row, $item['status']);
        $sheet->setCellValue('E'.$row, $item['created_by']);
        $sheet->setCellValue('F'.$row, $item['submitted_to']);
        $sheet->setCellValue('G'.$row, $item['approved_by']);
        $sheet->setCellValue('H'.$row, $item['expense_track_app_rej_remarks']);
        $sheet->setCellValue('I'.$row, $item['expense_track_created_at']);
        $sheet->setCellValue('J'.$row, $item['expense_track_approved_rejected_at']);
        $sheet->setCellValue('K'.$row, $item['expense_head_title']);
        $sheet->setCellValue('L'.$row, $item['expense_product_desc']);
        $sheet->setCellValue('M'.$row, $item['expense_product_qty']);
        $sheet->setCellValue('N'.$row, $item['expense_product_unit']);
        $sheet->setCellValue('O'.$row, $item['expense_bill_date']);
        $sheet->setCellValue('P'.$row, $item['expense_product_amount']);
        $row++;
    }

    // Style data rows
    $dataStyle = [
        'borders' => [
            'allBorders' => ['borderStyle' => Border::BORDER_THIN]
        ],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]
    ];
    $sheet->getStyle('A2:P'.($row-1))->applyFromArray($dataStyle);

    // Set headers for download
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;filename="expense_report.xlsx"');
    header('Cache-Control: max-age=0');

    // Save file
    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
