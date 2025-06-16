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

// SQL query to fetch leaves
$sql = "
SELECT
l.*,
ud.u_fname,
ud.u_mname,
ud.u_lname,
GROUP_CONCAT(d.doc_name SEPARATOR '||') as doc_names,
GROUP_CONCAT(d.doc_file_url SEPARATOR '||') as doc_urls
FROM
leave_track_details l
LEFT JOIN user_details ud ON l.leave_track_created_by = ud.u_id
LEFT JOIN leave_track_documents d ON l.leave_id = d.leave_id
WHERE
l.leave_track_created_by = ?
GROUP BY
l.leave_id
ORDER BY
l.leave_track_created_at DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$user_id]);
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Initialize response array
$jsonData = [];

if (count($result) > 0) {
foreach ($result as $row) {
// Convert leave type to human-readable text
$leaveType = match ($row['leave_ground']) {
0 => "Casual Leave",
1 => "Medical Leave",
2 => "Half Day Leave",
default => "Unknown"
};

// Convert leave status to human-readable text
$status = match ($row['leave_track_status']) {
null => "Unattended",
0 => "Rejected",
1 => "Approved",
2 => "Suspended",
default => "Unknown"
};

// Format employee name
$employeeName = trim($row['u_fname'] . ' ' .
($row['u_mname'] ? $row['u_mname'] . ' ' : '') .
$row['u_lname']);

// Format documents array
$documents = [];
if (!empty($row['doc_names'])) {
$docNames = explode('||', $row['doc_names']);
$docUrls = explode('||', $row['doc_urls']);
$documents = array_map(function($name, $url) {
return ['name' => $name, 'url' => $url];
}, $docNames, $docUrls);
}

// Format the data for JSON response
$jsonData[] = [
'leave_id' => $row['leave_id'],
'leave_title' => $row['leave_title'],
'leave_ground' => $row['leave_ground'],
'leave_ground_text' => $leaveType,
'leave_from_date' => $row['leave_from_date'],
'leave_to_date' => $row['leave_to_date'],
'leave_comment' => $row['leave_comment'],
'leave_acpt_rej_remarks' => $row['leave_acpt_rej_remarks'],
'leave_track_status' => $row['leave_track_status'],
'leave_track_status_text' => $status,
'leave_track_created_by' => $row['leave_track_created_by'],
'employee_name' => $employeeName,
'leave_track_created_at' => $row['leave_track_created_at'],
'leave_track_updated_at' => $row['leave_track_updated_at'],
'leave_track_submitted_to' => $row['leave_track_submitted_to'],
'leave_track_approved_rejected_by' => $row['leave_track_approved_rejected_by'],
'leave_track_approved_rejected_at' => $row['leave_track_approved_rejected_at'],
'documents' => $documents
];
}

echo json_encode([
'status' => 'success',
'message' => 'Leaves fetched successfully',
'data' => $jsonData
]);
} else {
echo json_encode([
'status' => 'success',
'message' => 'No leaves found',
'data' => []
]);
}

} catch (Exception $e) {
http_response_code(500);
echo json_encode([
'status' => 'error',
'message' => 'Server error: ' . $e->getMessage()
]);
}