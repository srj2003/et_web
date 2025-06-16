<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php'; // Database config

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB Connection Failed"]);
    exit();
}

try {
    // Ensure all required POST fields exist
    $required = [
        "user_id", "first_name", "last_name", "email", "mobile", "password"
    ];

    foreach ($required as $field) {
        if (!isset($_POST[$field]) || trim($_POST[$field]) === "") {
            throw new Exception("$field is required");
        }
    }

    // Extract POST values
    $user_id = $conn->real_escape_string(trim($_POST["user_id"]));
    $first_name = $conn->real_escape_string(trim($_POST["first_name"]));
    $middle_name = isset($_POST["middle_name"]) ? $conn->real_escape_string(trim($_POST["middle_name"])) : '';
    $last_name = $conn->real_escape_string(trim($_POST["last_name"]));
    $email = $conn->real_escape_string(trim($_POST["email"]));
    $mobile = $conn->real_escape_string(trim($_POST["mobile"]));
    $gender = isset($_POST["gender"]) ? $conn->real_escape_string(trim($_POST["gender"])) : 'male';
    $city = isset($_POST["city"]) ? $conn->real_escape_string(trim($_POST["city"])) : '';
    $state = isset($_POST["state"]) ? $conn->real_escape_string(trim($_POST["state"])) : '';
    $country = isset($_POST["country"]) ? $conn->real_escape_string(trim($_POST["country"])) : '';
    $zip_code = isset($_POST["zip_code"]) ? $conn->real_escape_string(trim($_POST["zip_code"])) : '';
    $street_address = isset($_POST["street_address"]) ? $conn->real_escape_string(trim($_POST["street_address"])) : '';
    $organization = isset($_POST["organization"]) ? $conn->real_escape_string(trim($_POST["organization"])) : '';
    $password = trim($_POST["password"]);
    $password_hash = password_hash($password, PASSWORD_BCRYPT);  // Secure password hashing
    $role_name = isset($_POST["role_name"]) ? $conn->real_escape_string(trim($_POST["role_name"])) : 'user';
    $active = isset($_POST["active"]) ? intval($_POST["active"]) : 1;
    $is_deleted = isset($_POST["is_deleted"]) ? intval($_POST["is_deleted"]) : 0;
    $created_at = $_POST["created_at"] ?? date("Y-m-d H:i:s");
    $updated_at = $_POST["updated_at"] ?? date("Y-m-d H:i:s");

    // File uploads
    $uploadDir = "uploads/user_files/";
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Validate and upload profile image
    $allowed_image_types = ['image/jpeg', 'image/png'];
    $profile_image_path = '';
    if (!empty($_FILES['profile_image']['tmp_name'])) {
        if (!in_array($_FILES['profile_image']['type'], $allowed_image_types)) {
            throw new Exception("Invalid profile image format. Allowed formats: jpeg, png.");
        }
        // File size check (max 2MB)
        $max_file_size = 2 * 1024 * 1024; // 2MB
        if ($_FILES['profile_image']['size'] > $max_file_size) {
            throw new Exception("Profile image is too large. Maximum size is 2MB.");
        }
        $profile_image_name = time() . "_" . basename($_FILES["profile_image"]["name"]);
        $target_profile = $uploadDir . $profile_image_name;
        if (move_uploaded_file($_FILES["profile_image"]["tmp_name"], $target_profile)) {
            $profile_image_path = $target_profile;
        } else {
            throw new Exception("Failed to upload profile image.");
        }
    }

    // Validate and upload CV
    $allowed_cv_types = ['application/pdf'];
    $cv_path = '';
    if (!empty($_FILES['cv']['tmp_name'])) {
        if (!in_array($_FILES['cv']['type'], $allowed_cv_types)) {
            throw new Exception("Invalid CV format. Allowed format: pdf.");
        }
        // File size check (max 5MB)
        $max_file_size = 5 * 1024 * 1024; // 5MB
        if ($_FILES['cv']['size'] > $max_file_size) {
            throw new Exception("CV is too large. Maximum size is 5MB.");
        }
        $cv_name = time() . "_" . basename($_FILES["cv"]["name"]);
        $target_cv = $uploadDir . $cv_name;
        if (move_uploaded_file($_FILES["cv"]["tmp_name"], $target_cv)) {
            $cv_path = $target_cv;
        } else {
            throw new Exception("Failed to upload CV.");
        }
    }

    // Check for duplicate user ID or email
    $stmtCheck = $conn->prepare("SELECT u_id FROM user_details WHERE user_id = ? OR u_email = ?");
    $stmtCheck->bind_param("ss", $user_id, $email);
    $stmtCheck->execute();
    $result = $stmtCheck->get_result();
    $stmtCheck->close();

    if ($result->num_rows > 0) {
        throw new Exception("User ID or Email already exists");
    }

    // Insert user into the database
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
        $profile_image_path, $cv_path, $active, $is_deleted, $created_at, $updated_at
    );

    if (!$stmt->execute()) {
        throw new Exception("Insert user failed: " . $stmt->error);
    }

    $u_id = $stmt->insert_id;
    $stmt->close();

    // Assign role to the user
    $stmtRole = $conn->prepare("SELECT role_id FROM user_role WHERE role_name = ?");
    $stmtRole->bind_param("s", $role_name);
    $stmtRole->execute();
    $stmtRole->bind_result($role_id);
    $stmtRole->fetch();
    $stmtRole->close();

    if ($role_id) {
        $stmtAssign = $conn->prepare("UPDATE assigned_role SET role_id = ? WHERE u_id = ?");
        $stmtAssign->bind_param("ii", $role_id, $u_id);
        $stmtAssign->execute();
        $stmtAssign->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "User added successfully",
        "inserted_id" => $u_id,
        "assigned_role_id" => $role_id,
        "profile_image" => $profile_image_path ? $profile_image_path : 'No profile image uploaded',
        "cv_file" => $cv_path ? $cv_path : 'No CV uploaded'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
} finally {
    $conn->close();
}

?>
