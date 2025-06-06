<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS'); // Added PUT
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php'; // Include your database configuration file

// Connect to DB
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];

$action = $_GET['action'] ?? null;
if ($method === 'GET') {
    // FETCH ALL EXPENSE TYPES (including inactive ones)
    if($action === 'get_user_details')
    {
        $input = json_decode(file_get_contents("php://input"), true);
        $user_id = $input['user_id'] ?? null;
        echo $user_id;
        if (!$user_id) {
            respond(["success" => false, "error" => "Missing user_id"], 400);
        }
    
        $stmt = $conn->prepare("SELECT u_fname FROM users WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result) {
            respond(["success" => true, "u_fname" => $result['u_fname']]);
        } else {
            respond(["success" => false, "error" => "User not found"], 404);
        }
    }
    else
    {
        $sql = "SELECT * FROM expense_types ";
         $result = $conn->query($sql);
        $data = [];
        if ($result && $result->num_rows > 0) 
        {
            while ($row = $result->fetch_assoc()) 
            {
                $data[] = $row;
            }
        }
        echo json_encode($data);
    }

} elseif ($method === 'POST') {
    // CREATE NEW EXPENSE TYPE
    $input = json_decode(file_get_contents('php://input'), true);
    $name = $input['expense_type_name'] ?? '';
    $created_by = $input['created_by'] ?? '';
    if (empty($name)) {
        echo json_encode(["success" => false, "error" => "expense_type_name is required."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO expense_types (expense_type_name, created_by) VALUES (?, ?)");
    $stmt->bind_param("ss", $name,$created_by);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "id" => $stmt->insert_id]);
    } else {
        echo json_encode(["success" => false, "error" => "Insert failed: " . $stmt->error]);
    }

    $stmt->close();

} elseif ($method === 'PUT') {
    // UPDATE EXPENSE TYPE
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['expense_type_id'] ?? null;
    $name = $input['expense_type_name'] ?? null;
    $is_active = $input['expense_type_is_active'] ?? null;

    if (empty($id)) {
        echo json_encode(["success" => false, "error" => "expense_type_id is required."]);
        exit;
    }

    if ($is_active !== null) {
        $stmt = $conn->prepare("UPDATE expense_types SET expense_type_is_active = ? WHERE expense_type_id = ?");
        $stmt->bind_param("ii", $is_active, $id);
    } else {
        $stmt = $conn->prepare("UPDATE expense_types SET expense_type_name = ? WHERE expense_type_id = ?");
        $stmt->bind_param("si", $name, $id);
    }

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Update failed: " . $stmt->error]);
    }

    $stmt->close();

} else {
    echo json_encode(["error" => "Unsupported request method."]);
}

$conn->close();
?>
