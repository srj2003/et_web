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

// SQL query to fetch expenses
$sql = "
SELECT
e.*,
ud.u_fname,
ud.u_mname,
ud.u_lname,
GROUP_CONCAT(d.doc_name SEPARATOR '||') as doc_names,
GROUP_CONCAT(d.doc_file_url SEPARATOR '||') as doc_urls
FROM
expense_track_details e
LEFT JOIN user_details ud ON e.expense_track_created_by = ud.u_id
LEFT JOIN expense_track_documents d ON e.expense_id = d.expense_id
WHERE
e.expense_track_created_by = ?
GROUP BY
e.expense_id
ORDER BY
e.expense_track_created_at DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$user_id]);
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Initialize response array
$jsonData = [];

if (count($result) > 0) {
foreach ($result as $row) {
// Convert expense type to human-readable text
$expenseType = match ($row['expense_type']) {
0 => "Travel",
1 => "Food",
2 => "Accommodation",
3 => "Office Supplies",
4 => "Other",
default => "Unknown"
};

// Convert expense status to human-readable text
$status = match ($row['expense_track_status']) {
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
'expense_id' => $row['expense_id'],
'expense_title' => $row['expense_title'],
'expense_type' => $row['expense_type'],
'expense_type_text' => $expenseType,
'expense_amount' => $row['expense_amount'],
'expense_date' => $row['expense_date'],
'expense_comment' => $row['expense_comment'],
'expense_track_status' => $row['expense_track_status'],
'expense_track_status_text' => $status,
'expense_track_created_by' => $row['expense_track_created_by'],
'employee_name' => $employeeName,
'expense_track_created_at' => $row['expense_track_created_at'],
'expense_track_updated_at' => $row['expense_track_updated_at'],
'expense_track_submitted_to' => $row['expense_track_submitted_to'],
'expense_track_approved_rejected_by' => $row['expense_track_approved_rejected_by'],
'expense_track_approved_rejected_at' => $row['expense_track_approved_rejected_at'],
'documents' => $documents
];
}

echo json_encode([
'status' => 'success',
'message' => 'Expenses fetched successfully',
'data' => $jsonData
]);
} else {
echo json_encode([
'status' => 'success',
'message' => 'No expenses found',
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