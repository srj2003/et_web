// Enable CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

// SQL query to fetch leave details and user information
$sql = "
SELECT
l.leave_id,
l.leave_title,
l.leave_ground,
l.leave_track_status,
l.leave_from_date,
l.leave_to_date,
l.leave_comment,
l.leave_track_created_by,
l.leave_track_created_at,
l.leave_track_submitted_to,
creator.u_fname,
creator.u_mname,
creator.u_lname,
approver.u_fname as submitted_to_fname,
approver.u_mname as submitted_to_mname,
approver.u_lname as submitted_to_lname,
GROUP_CONCAT(d.doc_name SEPARATOR '||') as doc_names,
GROUP_CONCAT(d.doc_file_url SEPARATOR '||') as doc_urls
FROM
leave_track_details l
INNER JOIN
user_details creator ON l.leave_track_created_by = creator.u_id
LEFT JOIN
user_details approver ON l.leave_track_submitted_to = approver.u_id
LEFT JOIN
leave_track_documents d ON l.leave_id = d.leave_id
WHERE
l.leave_track_status IS NULL
AND l.leave_track_submitted_to = ?
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
// Convert leave_ground to text
$leaveGroundText = match ($row['leave_ground']) {
'0' => 'Casual Leave',
'1' => 'Medical Leave',
'2' => 'Half Day Leave',
default => 'Unknown'
};

$jsonData[] = [
'leave_id' => $row['leave_id'],
'user_name' => $row['u_fname'] . ' ' . ($row['u_mname'] ? $row['u_mname'] . ' ' : '') . $row['u_lname'],
'leave_title' => $row['leave_title'],
'leave_comment' => $row['leave_comment'],
'leave_ground' => $leaveGroundText,
'leave_track_status' => $row['leave_track_status'],
'leave_track_created_by' => $row['leave_track_created_by'],
'leave_from_date' => $row['leave_from_date'],
'leave_to_date' => $row['leave_to_date'],
'leave_track_created_at' => $row['leave_track_created_at'],
'leave_track_submitted_to_id' => $row['leave_track_submitted_to'],
'submitted_to' => $row['submitted_to_fname'] . ' ' .
($row['submitted_to_mname'] ? $row['submitted_to_mname'] . ' ' : '') .
$row['submitted_to_lname'],
'documents' => !empty($row['doc_names']) ? array_map(
function ($name, $url) {
return ['name' => $name, 'url' => $url];
},
explode('||', $row['doc_names']),
explode('||', $row['doc_urls'])
) : []
];
}
} else {
$jsonData = ['status' => 'error', 'message' => 'No unattended leave requests found'];
}

// Send JSON response
echo json_encode($jsonData);

} catch (Exception $e) {
echo json_encode([
'status' => 'error',
'message' => 'Server error: ' . $e->getMessage()
]);
}