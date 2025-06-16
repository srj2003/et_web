// Enable CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
http_response_code(200);
exit();
}

// Include config and token verifier
require_once 'config.php';
require_once 'auth.php';

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

// Get the JSON payload from the request
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['leave_id']) || !isset($input['action'])) {
echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
exit();
}

$leave_id = $input['leave_id'];
$action = $input['action']; // "approve" or "reject"

// Determine the new status based on the action
$new_status = match ($action) {
'approve' => 1, // Approved
'reject' => 0, // Rejected
default => throw new Exception('Invalid action')
};

// Get the current timestamp
$current_timestamp = date('Y-m-d H:i:s');

// Update the leave request in the database
$sql = "
UPDATE leave_track_details
SET
leave_track_status = ?,
leave_track_approved_rejected_by = ?,
leave_track_approved_rejected_at = ?
WHERE
leave_id = ?
AND leave_track_status IS NULL
AND leave_track_submitted_to = ?
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$new_status, $user_id, $current_timestamp, $leave_id, $user_id]);

if ($stmt->rowCount() > 0) {
echo json_encode([
'status' => 'success',
'message' => 'Leave request updated successfully'
]);
} else {
echo json_encode([
'status' => 'error',
'message' => 'No leave request found or already processed'
]);
}

} catch (Exception $e) {
http_response_code(500);
echo json_encode([
'status' => 'error',
'message' => 'Server error: ' . $e->getMessage()
]);
}