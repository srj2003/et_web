<?php
require_once 'auth.php';

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS and headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// Database connection settings
$servername = 'geomaticxevs.in';

$username = 'geoma7i3_demo_user';

$password = 'eT@dEm0##25';

$dbname = 'geoma7i3_demo_et_dms';


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

// Connect to DB
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed."]);
    exit;
}

// Validate and sanitize input
// Read JSON input manually
$input = json_decode(file_get_contents("php://input"), true);

$u_id = isset($input['u_id']) ? intval($input['u_id']) : null;
$attn_id = isset($input['attn_id']) ? intval($input['attn_id']) : null;

if (!$u_id || !$attn_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing u_id or attn_id parameter."]);
    exit;
}

// Prepare and execute query
$stmt = $conn->prepare("SELECT lat, `long`, Time(timestamp) as time FROM track_user_details WHERE u_id = ? AND attn_id = ?");
$stmt->bind_param("ii", $u_id, $attn_id);
$stmt->execute();

$result = $stmt->get_result();
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode($data);
?>
