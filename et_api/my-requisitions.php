<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Database connection settings
// $host = "localhost";  // Change this to your database host
// $dbname = "geoma7i3_geomaticx_et_dms";  // Change this to your database name
// $username = "root";  // Change this to your database username
// $password = "";  // Change this to your database password


$host = 'geomaticxevs.in';
$username = 'geoma7i3_demo_user';
$password = 'eT@dEm0##25';
$dbname = 'geoma7i3_demo_et_dms';

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get the JSON payload from the request
    $input = json_decode(file_get_contents("php://input"), true);

    // Validate input
    if (!isset($input['user_id'])) {
        echo json_encode(["error" => "User ID is required"]);
        exit();
    }

    $user_id = $input['user_id'];

    // Query to fetch requisitions for the given user ID
    $stmt = $pdo->prepare("
        SELECT 
            e.requisition_id,
            e.requisition_title,
            e.requisition_desc,
            e.requisition_created_at AS requisition_date,
            e.requisition_status,
            u.u_fname AS user_first_name,
            u.u_lname AS user_last_name,
            u.u_email AS user_email,
            e.requisition_submitted_to,
            e.requisition_req_amount AS requisition_req_amount,
            CONCAT(u2.u_fname, ' ', u2.u_lname) AS submitted_to_full_name
        FROM 
            expense_requisition_details e
        INNER JOIN 
            user_details u ON e.requisition_created_by = u.u_id
        LEFT JOIN 
            user_details u2 ON e.requisition_submitted_to = u2.u_id
        WHERE 
            e.requisition_created_by = :user_id
        ORDER BY 
            e.requisition_created_at DESC
    ");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    // Fetch all results
    $requisitions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map requisition_status to text
    // foreach ($requisitions as &$requisition) {
    //     switch ($requisition['requisition_status']) {
    //         case null:
    //             $requisition['requisition_status_text'] = 'Unattained';
    //             break;
    //         case 1:
    //             $requisition['requisition_status_text'] = 'Approved';
    //             break;
    //         case 0:
    //             $requisition['requisition_status_text'] = 'Rejected';
    //             break;
    //         case 2:
    //             $requisition['requisition_status_text'] = 'Partially Approved';
    //             break;
    //         default:
    //             $requisition['requisition_status_text'] = 'Unknown';
    //     }
    //     unset($requisition['requisition_status']); // Remove the numeric status field
    // }

    // Return JSON response
    echo json_encode($requisitions, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}