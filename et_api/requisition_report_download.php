<?php

require 'vendor/autoload.php';

require_once 'config.php';



use PhpOffice\PhpSpreadsheet\Spreadsheet;

use PhpOffice\PhpSpreadsheet\Writer\Xlsx;



// Enable error reporting for debugging

error_reporting(E_ALL);

ini_set('display_errors', 1);



// Set headers for Excel download

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

header('Content-Disposition: attachment;filename="requisition_report.xlsx"');

header('Cache-Control: max-age=0');



// Get parameters

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;



// Validate parameters

if (!$user_id) {

    die('Invalid parameters');

}



try {

    // Create database connection

    $conn = new mysqli($servername, $username, $password, $dbname);



    // Check connection

    if ($conn->connect_error) {

        die("Connection failed: " . $conn->connect_error);

    }



    // Fetch requisition data

    $sql = "SELECT 

        r.requisition_title,

        r.requisition_req_amount,

        r.requisition_app_amount,

        r.requisition_status,

        r.requisition_create_lat,

        r.requisition_create_long,

        r.requisition_created_at,

        r.requisition_updated_at,

        u1.full_name as created_by,

        u2.full_name as submitted_to

    FROM requisitions r

    LEFT JOIN users u1 ON r.requisition_created_by = u1.u_id

    LEFT JOIN users u2 ON r.requisition_submitted_to = u2.u_id

    WHERE r.requisition_created_by = ?

    ORDER BY r.requisition_created_at DESC";



    $stmt = $conn->prepare($sql);

    $stmt->bind_param("i", $user_id);

    $stmt->execute();

    $result = $stmt->get_result();

    $results = $result->fetch_all(MYSQLI_ASSOC);



    // Create new spreadsheet

    $spreadsheet = new Spreadsheet();

    $sheet = $spreadsheet->getActiveSheet();



    // Set headers

    $headers = [

        'Title', 'Requested Amount', 'Approved Amount', 'Status',

        'Created By', 'Submitted To', 'Latitude', 'Longitude',

        'Created At', 'Updated At'

    ];



    foreach (range('A', 'J') as $i => $column) {

        $sheet->getColumnDimension($column)->setWidth(15);

        $sheet->setCellValue($column . '1', $headers[$i]);

        $sheet->getStyle($column . '1')->getFont()->setBold(true);

    }



    // Add data

    $row = 2;

    foreach ($results as $result) {

        $status = '';

        switch ($result['requisition_status']) {

            case '0': $status = 'Rejected'; break;

            case '1': $status = 'Approved'; break;

            case '2': $status = 'Partially Approved'; break;

            default: $status = 'Unattended';

        }



        $sheet->fromArray([

            $result['requisition_title'],

            $result['requisition_req_amount'],

            $result['requisition_app_amount'],

            $status,

            $result['created_by'],

            $result['submitted_to'],

            $result['requisition_create_lat'],

            $result['requisition_create_long'],

            $result['requisition_created_at'],

            $result['requisition_updated_at']

        ], null, 'A' . $row);

        $row++;

    }



    // Create writer and save file

    $writer = new Xlsx($spreadsheet);

    $writer->save('php://output');



} catch(Exception $e) {

    die("Error: " . $e->getMessage());

} finally {

    if (isset($stmt)) {

        $stmt->close();

    }

    if (isset($conn)) {

        $conn->close();

    }

}

?>

