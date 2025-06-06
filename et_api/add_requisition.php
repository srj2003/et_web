<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
        // Handle requisition submission
        $data = json_decode(file_get_contents("php://input"), true);

        // Validate required fields
        $requiredFields = [
            'requisition_title',
            'requisition_desc',
            'requisition_req_amount',
            'requisition_submitted_to',
            'requisition_created_by'
        ];

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => "Missing required field: $field"
                ]);
                exit;
            }
        }

        // Prepare the insert statement
        $insert_query = "
            INSERT INTO expense_requisition_details (
                requisition_title, 
                requisition_desc, 
                requisition_req_amount, 
                requisition_submitted_to, 
                requisition_created_by, 
                requisition_created_at,
                requisition_status,
                requisition_create_lat,
                requisition_create_long,
                requisition_date
            ) VALUES (?, ?, ?, ?, ?, NOW(), null, ?, ?, ?)";

        $stmt = $conn->prepare($insert_query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        // Bind parameters
        $stmt->bind_param(
            "ssdiisss",
            $data['requisition_title'],
            $data['requisition_desc'],
            $data['requisition_req_amount'],
            $data['requisition_submitted_to'],
            $data['requisition_created_by'],
            $data['requisition_latitude'],
            $data['requisition_longitude'],
            $data['requisition_date']
        );

        // Execute the insert statement
        if ($stmt->execute()) {
            $requisition_id = $stmt->insert_id;
            
            // Update the requisition_root_id in a separate query
            $update_query = "UPDATE expense_requisition_details 
                            SET requisition_root_id = ? 
                            WHERE requisition_id = ?";
                            
            $update_stmt = $conn->prepare($update_query);
            $update_stmt->bind_param("ii", $requisition_id, $requisition_id);
            
            if ($update_stmt->execute()) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Requisition submitted successfully',
                    'requisition_id' => $requisition_id
                ]);
            } else {
                throw new Exception("Failed to update requisition_root_id: " . $update_stmt->error);
            }
            $update_stmt->close();
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
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt))
        $stmt->close();
    if (isset($conn))
        $conn->close();
}
?>