<?php
// Enable CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
// Fetch roles
if (isset($_GET['fetch_roles']) && $_GET['fetch_roles'] === 'true') {
$stmt = $pdo->query("SELECT role_id, role_name FROM user_role WHERE role_is_del = 0");
$roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

$formattedRoles = array_map(function($role) {
return [
'value' => $role['role_id'],
'label' => $role['role_name']
];
}, $roles);

echo json_encode([
'status' => 'success',
'roles' => $formattedRoles
]);
exit;
}

// Fetch users based on role
if (isset($_GET['role_id'])) {
$roleId = (int) $_GET['role_id'];

$query = "
SELECT
ud.u_id,
CONCAT(ud.u_fname, ' ', ud.u_mname, ' ', ud.u_lname) AS name
FROM user_details ud
LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
WHERE ar.role_id = ? AND ud.u_is_del = 0
";

$stmt = $pdo->prepare($query);
$stmt->execute([$roleId]);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

$formattedUsers = array_map(function($user) {
return [
'id' => $user['u_id'],
'name' => $user['name']
];
}, $users);

echo json_encode([
'status' => 'success',
'users' => $formattedUsers
]);
exit;
}
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
// Handle leave submission
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$requiredFields = [
"leave_title",
"leave_ground",
"leave_from_date",
"leave_to_date",
"leave_comment",
"leave_track_submitted_to"
];

foreach ($requiredFields as $field) {
if (empty($data[$field])) {
http_response_code(400);
echo json_encode(['status' => 'error', 'message' => "Field '$field' is required"]);
exit;
}
}

if ($data['leave_ground'] === "Casual Leave (CL)") {
$data['leave_ground'] = 0;
} elseif ($data['leave_ground'] === "Medical Leave") {
$data['leave_ground'] = 1;
} elseif ($data['leave_ground'] === "Half-day Leave") {
$data['leave_ground'] = 2;
}

// Insert leave details into the database
$query = "
INSERT INTO leave_track_details
(leave_title, leave_ground, leave_from_date, leave_to_date, leave_comment,
leave_track_submitted_to, leave_track_created_by)
VALUES (?, ?, ?, ?, ?, ?, ?)
";

$stmt = $pdo->prepare($query);
$stmt->execute([
$data['leave_title'],
$data['leave_ground'],
$data['leave_from_date'],
$data['leave_to_date'],
$data['leave_comment'],
$data['leave_track_submitted_to'],
$user_id
]);

echo json_encode([
'status' => 'success',
'message' => 'Leave request submitted successfully'
]);
exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
exit;

} catch (Exception $e) {
http_response_code(500);
echo json_encode([
"status" => "error",
"message" => $e->getMessage()
]);
}