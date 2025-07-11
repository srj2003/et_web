<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php'; // Include your database configuration file
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
        exit();
    }
    $user_id = $auth['user_id'];
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Authentication server error: ' . $e->getMessage()
    ]);
    exit();
}

// Database connection settings
require_once 'config.php'; // Include your database configuration file

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Prepare SQL query with joins for detailed expense info
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
    WHERE e.expense_track_created_by = ?
    ORDER BY e.expense_track_created_at DESC
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

// Group expense details by expense_track_id
$expenses = [];
while ($row = $result->fetch_assoc()) {
    $track_id = $row['expense_track_id'];
    if (!isset($expenses[$track_id])) {
        // Convert `expense_track_status` to human-readable text
        $status = match ($row['expense_track_status']) {
            null => "Unattended",
            0 => "Rejected",
            1 => "Approved",
            default => "Unknown"
        };
        $expenses[$track_id] = [
            'expense_id' => $row['expense_track_id'],
            'expense_title' => $row['expense_track_title'],
            'expense_type' => $row['expense_type_id'], // keep id for reference
            'expense_type_name' => isset($row['expense_type_id']) ? getExpenseTypeName($conn, $row['expense_type_id']) : null,
            'expense_amount' => $row['expense_total_amount'],
            'expense_status' => $status,
            'expense_date' => $row['expense_track_created_at'],
            'expense_comment' => $row['expense_track_app_rej_remarks'],
            'expense_created_by' => $row['created_by_full_name'],
            'expense_submitted_to' => $row['submitted_to_full_name'],
            'expense_approved_by' => $row['approved_rejected_by_full_name'],
            'expense_approved_rejected_at' => $row['expense_track_approved_rejected_at'],
            'expense_details' => []
        ];
    }
    // Add expense detail if exists
    if (!empty($row['expense_id'])) {
        $expenses[$track_id]['expense_details'][] = [
            'expense_id' => $row['expense_id'],
            'expense_head_id' => $row['expense_head_id'], // keep id for reference
            'expense_head_title' => $row['expense_head_title'],
            'expense_head_name' => isset($row['expense_head_id']) ? getExpenseHeadName($conn, $row['expense_head_id']) : null,
            'expense_product_name' => $row['expense_product_name'],
            'expense_product_qty' => $row['expense_product_qty'],
            'expense_product_unit' => $row['expense_product_unit'],
            'expense_product_desc' => $row['expense_product_desc'],
            'expense_product_photo_path' => $row['expense_product_photo_path'],
            'expense_product_bill_photo_path' => $row['expense_product_bill_photo_path'],
            'expense_product_sl_no' => $row['expense_product_sl_no'],
            'expense_product_amount' => $row['expense_product_amount'],
            'expense_bill_date' => $row['expense_bill_date'],
            'expense_product_created_at' => $row['expense_product_created_at'],
            'expense_product_updated_at' => $row['expense_product_updated_at'],
            'expense_product_is_del' => $row['expense_product_is_del']
        ];
    }
}

// If no records found
if (empty($expenses)) {
    echo json_encode(['status' => 'error', 'message' => 'No expense records found']);
    $conn->close();
    exit();
}

// Close database connection
$conn->close();

// Send JSON response
// Re-index array to be a list
echo json_encode(array_values($expenses));

// Add helper functions to fetch names from ids
function getExpenseTypeName($conn, $type_id) {
    $stmt = $conn->prepare("SELECT expense_type_name FROM expense_types WHERE expense_type_id = ? LIMIT 1");
    $stmt->bind_param("i", $type_id);
    $stmt->execute();
    $stmt->bind_result($name);
    $stmt->fetch();
    $stmt->close();
    return $name ?: null;
}
function getExpenseHeadName($conn, $head_id) {
    $stmt = $conn->prepare("SELECT expense_head_title FROM expense_heads WHERE expense_head_id = ? LIMIT 1");
    $stmt->bind_param("i", $head_id);
    $stmt->execute();
    $stmt->bind_result($name);
    $stmt->fetch();
    $stmt->close();
    return $name ?: null;
}
?>