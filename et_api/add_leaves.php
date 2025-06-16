<?php

// Enable CORS

header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

header("Access-Control-Allow-Headers: Content-Type, Authorization");

header("Content-Type: application/json");



if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

    http_response_code(200);

    exit;

}



// Log POST data to stderr

file_put_contents('php://stderr', print_r($_POST, true));



// Database connection

require_once 'config.php'; // Include your database configuration file



try {

    $conn = new mysqli($servername, $username, $password, $dbname);



    if ($conn->connect_error) {

        throw new Exception("Database connection failed: " . $conn->connect_error);

    }



    if ($_SERVER['REQUEST_METHOD'] === 'GET') {

        // Fetch roles

        if (isset($_GET['fetch_roles']) && $_GET['fetch_roles'] === 'true') {

            $query = "SELECT role_id, role_name FROM user_role WHERE role_is_del = 0";

            $result = $conn->query($query);



            if (!$result) {

                throw new Exception("Query failed: " . $conn->error);

            }



            $roles = [];

            while ($row = $result->fetch_assoc()) {

                $roles[] = [

                    'value' => $row['role_id'],

                    'label' => $row['role_name']

                ];

            }



            echo json_encode([

                'status' => 'success',

                'roles' => $roles

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



            $stmt = $conn->prepare($query);

            if (!$stmt) {

                throw new Exception("Prepare failed: " . $conn->error);

            }



            $stmt->bind_param("i", $roleId);

            $stmt->execute();

            $result = $stmt->get_result();



            $users = [];

            while ($row = $result->fetch_assoc()) {

                $users[] = [

                    'id' => $row['u_id'],

                    'name' => $row['name']

                ];

            }



            echo json_encode([

                'status' => 'success',

                'users' => $users

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

            "leave_track_submitted_to",

            "leave_track_created_by"

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

            (leave_title, leave_ground, leave_from_date, leave_to_date, leave_comment, leave_track_submitted_to, leave_track_created_by) 

            VALUES (?, ?, ?, ?, ?, ?, ?)

        ";



        $stmt = $conn->prepare($query);

        if (!$stmt) {

            throw new Exception("Prepare failed: " . $conn->error);

        }



        $stmt->bind_param(

            "ssssssi",

            $data['leave_title'],

            $data['leave_ground'],

            $data['leave_from_date'],

            $data['leave_to_date'],

            $data['leave_comment'],

            $data['leave_track_submitted_to'],

            $data['leave_track_created_by']

        );



        if ($stmt->execute()) {

            echo json_encode([

                'status' => 'success',

                'message' => 'Leave request submitted successfully'

            ]);

        } else {

            throw new Exception("Execute failed: " . $stmt->error);

        }

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

} finally {

    if (isset($stmt))

        $stmt->close();

    if (isset($conn))

        $conn->close();

}

?>