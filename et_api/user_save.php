<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$requestUri = $_SERVER['REQUEST_URI'];
$segments = explode('/', trim($requestUri, '/'));
$u_id = end($segments);

// Log user ID for debug
file_put_contents("u_id_debug.log", "u_id: " . $u_id . "\n", FILE_APPEND);

require_once 'config.php';
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed: " . $conn->connect_error]);
    exit;
}

try {
    $conn->begin_transaction();

    // Fetch existing user details
    $result = $conn->query("SELECT * FROM user_details WHERE u_id = '$u_id'");
    if ($result->num_rows === 0) {
        throw new Exception("User not found.");
    }
    $existing = $result->fetch_assoc();

    // Merge values
    $u_fname        = $data['first_name']     ?? $existing['u_fname'];
    $u_mname        = $data['middle_name']    ?? $existing['u_mname'];
    $u_lname        = $data['last_name']      ?? $existing['u_lname'];
    $u_email        = $data['email']          ?? $existing['u_email'];
    $u_mob          = $data['mobile']         ?? $existing['u_mob'];
    $u_city         = $data['city']           ?? $existing['u_city'];
    $u_state        = $data['state']          ?? $existing['u_state'];
    $u_country      = $data['country']        ?? $existing['u_country'];
    $u_organization = $data['organization']   ?? $existing['u_organization'];
    $u_pro_img      = $data['profile_image']  ?? $existing['u_pro_img'];
    $u_cv           = $data['cv']             ?? $existing['u_cv'];
    $active         = $data['active']         ?? $existing['u_active'];
    $role_id        = $data['role_id']        ?? null; // NEW

    // Update user details
    $stmt = $conn->prepare("
        UPDATE user_details 
        SET u_fname=?, u_mname=?, u_lname=?, u_email=?, u_mob=?, 
            u_city=?, u_state=?, u_country=?, u_organization=?, 
            u_pro_img=?, u_cv=?, u_active=?
        WHERE u_id=?
    ");
    $stmt->bind_param(
        "sssssssssssss",
        $u_fname, $u_mname, $u_lname, $u_email, $u_mob,
        $u_city, $u_state, $u_country, $u_organization,
        $u_pro_img, $u_cv, $active, $u_id
    );
    if (!$stmt->execute()) {
        throw new Exception("Error updating user details: " . $stmt->error);
    }

    // Update role if provided
    if (!is_null($role_id)) {
        $roleCheck = $conn->query("SELECT * FROM assigned_role WHERE u_id = '$u_id'");
        if ($roleCheck->num_rows > 0) {
            // Update existing role
            $stmtRole = $conn->prepare("UPDATE assigned_role SET role_id = ? WHERE u_id = ?");
            $stmtRole->bind_param("ii", $role_id, $u_id);
        } else {
            // Insert new role assignment
            $stmtRole = $conn->prepare("INSERT INTO assigned_role (u_id, role_id) VALUES (?, ?)");
            $stmtRole->bind_param("ii", $u_id, $role_id);
        }

        if (!$stmtRole->execute()) {
            throw new Exception("Error updating user role: " . $stmtRole->error);
        }

        $stmtRole->close();
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "User updated successfully.",
        "data" => [
            "u_id" => $u_id,
            "u_fname" => $u_fname,
            "u_mname" => $u_mname,
            "u_lname" => $u_lname,
            "u_email" => $u_email,
            "u_mob" => $u_mob,
            "u_city" => $u_city,
            "u_state" => $u_state,
            "u_country" => $u_country,
            "u_organization" => $u_organization,
            "u_pro_img" => $u_pro_img,
            "u_cv" => $u_cv,
            "u_active" => $active,
            "role_id" => $role_id
        ]
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>
