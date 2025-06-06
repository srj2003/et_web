<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// Database connection settings
$servername = 'geomaticxevs.in';

$username = 'geoma7i3_demo_user';

$password = 'eT@dEm0##25';

$dbname = 'geoma7i3_demo_et_dms';


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
