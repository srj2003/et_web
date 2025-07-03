<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

// Parse input (accept JSON or form-data)
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

$expense_type_id = isset($input['expense_type_id']) ? intval($input['expense_type_id']) : null;
$expense_head_id = isset($input['expense_head_id']) ? intval($input['expense_head_id']) : null;
$user_id = isset($input['user_id']) ? intval($input['user_id']) : null;
$start_date = isset($input['start_date']) ? $input['start_date'] : null;
$end_date = isset($input['end_date']) ? $input['end_date'] : null;

if (!$user_id || !$start_date || !$end_date) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing required parameters.'
    ]);
    exit;
}

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Build query
    $params = [$user_id, $start_date, $end_date];
    $types = "iss";
    $headJoin = "";
    $headWhere = "";
    $typeWhere = "";
    $headFields = "";
    $joinHeads = false;
    if ($expense_head_id) {
        $headJoin = "INNER JOIN expense_details ed ON etd.expense_track_id = ed.expense_track_id ";
        $headWhere = "AND ed.expense_head_id = ? ";
        $params[] = $expense_head_id;
        $types .= "i";
        $joinHeads = true;
    } else {
        // If not filtering by head, still join to get head info (may be multiple per track)
        $headJoin = "LEFT JOIN expense_details ed ON etd.expense_track_id = ed.expense_track_id ";
        $joinHeads = true;
    }
    if ($expense_type_id) {
        $typeWhere = "AND etd.expense_type_id = ? ";
        $params[] = $expense_type_id;
        $types .= "i";
    }
    // Always join expense_heads to get title
    $headJoin .= "LEFT JOIN expense_heads eh ON ed.expense_head_id = eh.expense_head_id ";
    $headJoin .= "LEFT JOIN expense_types et ON etd.expense_type_id = et.expense_type_id ";
    $headFields = ", eh.expense_head_id, eh.expense_head_title, et.expense_type_name ";
    $sql = "SELECT DISTINCT etd.*, eh.expense_head_id, eh.expense_head_title, et.expense_type_name FROM expense_track_details etd
            $headJoin
            WHERE etd.expense_track_created_by = ?
              AND etd.expense_track_status = 1
              AND etd.expense_track_created_at BETWEEN ? AND ?
              $headWhere
              $typeWhere
            ORDER BY etd.expense_track_created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode([
        'status' => 'success',
        'data' => $rows
    ]);
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
