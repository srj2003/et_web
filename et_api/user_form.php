<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$conn = null;

function saveBase64File($base64Data, $uploadDir, $prefix, $username, $allowedMimeTypes = []) {
    if (preg_match('/^data:(.*?);base64,(.*)$/', $base64Data, $matches)) {
        $mimeType = $matches[1];
        $data = base64_decode($matches[2]);

        if (!empty($allowedMimeTypes) && !in_array($mimeType, $allowedMimeTypes)) {
            throw new Exception("Invalid file type: $mimeType");
        }

        $ext = explode('/', $mimeType)[1]; // e.g., 'pdf'
        $safeUsername = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $username); // sanitize
        $fileName = uniqid() . '_' . $safeUsername . '_cv.' . $ext;

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filePath = $uploadDir . '/' . $fileName;
        file_put_contents($filePath, $data);
        return $filePath;
    }

    return '';
}


try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $json = file_get_contents('php://input');
    if (empty($json)) {
        throw new Exception("No input data received");
    }

    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON data: " . json_last_error_msg());
    }

    // Validate required fields
    $required = [
        "user_id" => "User ID",
        "first_name" => "First Name",
        "last_name" => "Last Name",
        "email" => "Email",
        "mobile" => "Mobile Number",
        "password" => "Password"
    ];

    foreach ($required as $field => $name) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            throw new Exception("$name is required");
        }
    }

    // Sanitize and prepare data
    $user_id = $conn->real_escape_string(trim($data["user_id"]));
    $first_name = $conn->real_escape_string(trim($data["first_name"]));
    $middle_name = isset($data["middle_name"]) ? $conn->real_escape_string(trim($data["middle_name"])) : '';
    $last_name = $conn->real_escape_string(trim($data["last_name"]));
    $email = $conn->real_escape_string(trim($data["email"]));
    $mobile = $conn->real_escape_string(trim($data["mobile"]));
    $password_hash = md5(trim($data["password"]));

    // Check for duplicates
    $stmtCheck = $conn->prepare("SELECT u_id FROM user_details WHERE user_id = ? OR u_email = ?");
    $stmtCheck->bind_param("ss", $user_id, $email);
    $stmtCheck->execute();
    $result = $stmtCheck->get_result();
    $stmtCheck->close();
    if ($result->num_rows > 0) {
        throw new Exception("User with this ID or email already exists");
    }

    // Optional fields
    $gender = isset($data["gender"]) ? $conn->real_escape_string(trim($data["gender"])) : 'male';
    $city = isset($data["city"]) ? $conn->real_escape_string(trim($data["city"])) : '';
    $state = isset($data["state"]) ? $conn->real_escape_string(trim($data["state"])) : '';
    $country = isset($data["country"]) ? $conn->real_escape_string(trim($data["country"])) : '';
    $zip_code = isset($data["zip_code"]) ? $conn->real_escape_string(trim($data["zip_code"])) : '';
    $street_address = isset($data["street_address"]) ? $conn->real_escape_string(trim($data["street_address"])) : '';
    $organization = isset($data["organization"]) ? $conn->real_escape_string(trim($data["organization"])) : '';
    $active = isset($data["active"]) ? intval($data["active"]) : 1;
    $is_deleted = isset($data["is_deleted"]) ? intval($data["is_deleted"]) : 0;
    $current_time = date("Y-m-d H:i:s");
    $user_role = isset($data["role_name"]) ? $conn->real_escape_string(trim($data["role_name"])) : 'user';

    // Save files
    $profile_image = '';
    $cv = '';

    $profile_image = isset($data['profile_image']) ? $conn->real_escape_string(trim($data['profile_image'])) : '';

    if (!empty($data['cv'])) {
        $cv = saveBase64File($data['cv'], __DIR__ . '/upoads/employee_cv', 'cv',$user_id, ['application/pdf']);
        $cv = str_replace(__DIR__ . '/', '', $cv); // Save relative path
    }

    // Insert user
    $stmt = $conn->prepare("INSERT INTO user_details (
        user_id, u_fname, u_mname, u_lname, u_gender,
        u_email, u_mob, u_city, u_state, u_country,
        u_zip_code, u_street_addr, u_organization, u_pass,
        u_pro_img, u_cv, u_active, u_is_del, u_created_at, u_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->bind_param(
        "ssssssssssssssssiiss",
        $user_id, $first_name, $middle_name, $last_name, $gender,
        $email, $mobile, $city, $state, $country,
        $zip_code, $street_address, $organization, $password_hash,
        $profile_image, $cv, $active, $is_deleted, $current_time, $current_time
    );

    if (!$stmt->execute()) {
        throw new Exception("Insert failed: " . $stmt->error);
    }

    $u_id = $stmt->insert_id;
    $stmt->close();

    // Assign role
    $stmt1 = $conn->prepare("SELECT role_id FROM user_role WHERE role_name = ?");
    $stmt1->bind_param("s", $user_role);
    $stmt1->execute();
    $stmt1->bind_result($role_id);
    $stmt1->fetch();
    $stmt1->close();

    $stmt2 = $conn->prepare("UPDATE assigned_role SET role_id = ? WHERE u_id = ?");
    $stmt2->bind_param("ii", $role_id, $u_id);
    $stmt2->execute();
    $stmt2->close();

    echo json_encode([
        "success" => true,
        "message" => "User created and role assigned successfully.",
        "inserted_id" => $u_id,
        "cv_path" => $cv,
        "profile_image_path" => $profile_image
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "error_details" => $e->getFile() . ":" . $e->getLine()
    ]);
} finally {
    if ($conn !== null && $conn instanceof mysqli) {
        $conn->close();
    }
}
