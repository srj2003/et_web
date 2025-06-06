<?php

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Headers: Content-Type, Accept");

header("Access-Control-Allow-Methods: POST");

header("Content-Type: application/json");



$data = json_decode(file_get_contents("php://input"), true);



$requestUri = $_SERVER['REQUEST_URI'];

$segments = explode('/', trim($requestUri, '/'));

$u_id = end($segments);



if (!is_numeric($u_id)) {

    http_response_code(400);

    echo json_encode(["message" => "Invalid or missing user ID"]);

    exit;

}

// DB config

require_once 'config.php'; // Ensure this file contains the correct DB connection details



$conn = new mysqli($servername, $username, $password, $dbname);



if ($conn->connect_error) {

    echo json_encode(["success" => false, "message" => "DB connection failed: " . $conn->connect_error]);

    exit;

}



// Fetch existing data

$result = $conn->query("SELECT * FROM user_details WHERE u_id = '$u_id'");

if ($result->num_rows === 0) {

    echo json_encode(["success" => false, "message" => "User not found."]);

    exit;

}

$existing = $result->fetch_assoc();



// Merge values (keep old if null or missing)

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

$active        = $data['active']          ?? $existing['active'];





$stmt = $conn->prepare("

    UPDATE user_details 

    SET u_fname=?, u_mname=?, u_lname=?, u_email=?, u_mob=?, u_city=?, u_state=?, u_country=?, u_organization=?, u_pro_img=?, u_cv=?, u_active=?
    WHERE u_id=?

");

$stmt->bind_param(

    "sssssssssssss",

    $u_fname, $u_mname, $u_lname, $u_email, $u_mob,

    $u_city, $u_state, $u_country, $u_organization,

    $u_pro_img, $u_cv, $active,$u_id

);



if ($stmt->execute()) {

    echo json_encode(["success" => true, "message" => "User updated successfully."]);

} else {

    echo json_encode(["success" => false, "message" => "Error updating user: " . $stmt->error]);

}



$stmt->close();

$conn->close();

?>