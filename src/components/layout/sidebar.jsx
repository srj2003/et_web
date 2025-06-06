import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Assuming you are using react-router-dom for navigation
import {
  Home,
  CalendarCheck,
  PlaneTakeoff,
  CreditCard,
  KanbanSquare,
  ClipboardPaste,
  UsersRound,
  ChevronDown,
  ChevronUp,
  Briefcase, // Added for General Dep if still needed, or for Project
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import "./sidebar.css"; // We will create/update this CSS file

// Placeholder for the logo image - replace with your actual logo path
const logoUrl = "https://i.postimg.cc/5203y3vn/geomaticx-logo.png"; // Example path, or import if using build system

// Add role configuration
const ROLE_ACCESS = {
  attendance: {
    my_attendance: "all", // Available to everyone
    user_attendance: [1, 2, 3, 4, 6, 8],
  },
  leaves: {
    add_leave: "all", // Available to everyone
    my_leaves: "all", // Available to everyone
    all_leaves: [1, 2, 3, 4, 6, 8],
    manage_leaves: [1, 2, 3, 4, 6, 8],
  },
  expenses: {
    add_expenses: "all", // Available to everyone
    my_expenses: "all", // Available to everyone
    all_expenses: [1, 2, 3, 4, 6, 8],
    manage_expenses: [1, 2, 3, 4, 6, 8],
  },
  project: {
    manage_project_expense: [1, 3, 8],
  },
  requisition: {
    add_requisition: [1, 2, 3, 4, 5, 6], // Available to everyone
    my_requisitions: [1, 2, 3, 4, 5, 6], // Available to everyone
    all_requisitions: [1, 2, 3, 4, 5, 6],
    manage_requisitions: [1, 2, 3, 4, 5, 6],
  },
  accounts: {
    requisition_report: [1, 8],
    expense_report: [1, 8],
  },
};

const menuItemsData = [
  // {
  //   id: "dashboard",
  //   title: "Dashboard",
  //   icon: Home,
  //   path: "/dashboard",
  // },
  {
    id: "attendance",
    title: "Attendances",
    icon: CalendarCheck,
    subItems: [
      { id: "my_attendance", 
        title: "My Attendance", 
        path: "/attendance/myattendance" },
      {
        id: "user_attendance",
        title: "User Attendance",
        path: "/attendance/userattendance",
      },
    ],
  },
  {
    id: "leaves",
    title: "Leaves",
    icon: PlaneTakeoff,
    subItems: [
      { id: "add_leave", title: "Add Leave", path: "/leaves/add" },
      { id: "my_leaves", title: "My Leaves", path: "/leaves/my" },
      { id: "all_leaves", title: "All Leaves", path: "/leaves/all" },
      { id: "manage_leaves", title: "Manage Leaves", path: "/leaves/manage" },
    ],
  },
  {
    id: "expenses",
    title: "Expenses",
    icon: CreditCard,
    subItems: [
      {
        id: "add_expenses",
        title: "Add Expenses",
        path: "/expenses/addexpense",
      },
      { id: "my_expenses", title: "My Expenses", path: "/expenses/myexpense" },
      {
        id: "all_expenses",
        title: "All Expenses",
        path: "/expenses/allexpenses",
      },
      {
        id: "manage_expenses",
        title: "Manage Expenses",
        path: "/expenses/requestedexpenses",
      },
    ],
  },
  {
    id: "project",
    title: "Projects",
    icon: KanbanSquare,
    subItems: [
      {
        id: "manage_project_expense",
        title: "Manage Projects",
        path: "/project/manage",
      },
    ],
  },
  {
    id: "requisition",
    title: "Requisitions",
    icon: ClipboardPaste,
    subItems: [
      {
        id: "add_requisition",
        title: "Add Requisition",
        path: "/requisition/add",
      },
      {
        id: "my_requisitions",
        title: "My Requisitions",
        path: "/requisition/my",
      },
      {
        id: "all_requisitions",
        title: "All Requisitions",
        path: "/requisition/all",
      },
      {
        id: "manage_requisitions",
        title: "Manage Requisitions",
        path: "/requisition/manage",
      },
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    icon: UsersRound, // Generic icon for accounts or user-related settings
    subItems: [
      // Add sub-items here if/when they are defined.
      // Example:
      {
        id: "requisition_report",
        title: "Requisition Report",
        path: "/accounts/requisitionreport",
      },
      {
        id: "expense_report",
        title: "Expense Report",
        path: "/accounts/expensereport",
      },
    ],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});
  const [roleId, setRoleId] = useState(null);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);

  useEffect(() => {
    const storedRoleId = parseInt(localStorage.getItem("roleId"));
    setRoleId(storedRoleId);

    // Filter menu items based on role
    const filtered = menuItemsData
      .map((item) => {
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter((subItem) => {
            const access = ROLE_ACCESS[item.id]?.[subItem.id];
            return (
              access === "all" ||
              (Array.isArray(access) && access.includes(storedRoleId))
            );
          });

          return filteredSubItems.length > 0
            ? { ...item, subItems: filteredSubItems }
            : null;
        }
        return item;
      })
      .filter(Boolean);

    setFilteredMenuItems(filtered);
  }, []);

  const toggleMenu = (id) => {
    setOpenMenus((prevOpenMenus) => ({
      ...prevOpenMenus,
      [id]: !prevOpenMenus[id],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userToken");
    localStorage.removeItem("roleId");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        {/* Replace with your actual logo. You might need to adjust styling. */}
        <img
          src={logoUrl}
          alt="Geomaticx Logo"
          onError={(e) => (e.target.style.display = "none")}
        />
      </div>
      <ul className="sidebar-menu">
        {filteredMenuItems.map((item) => {
          const IconComponent = item.icon;
          const isOpen = openMenus[item.id] || false;

          if (item.subItems && item.subItems.length > 0) {
            return (
              <li key={item.id} className={`menu-item ${isOpen ? "open" : ""}`}>
                <div className="menu-link" onClick={() => toggleMenu(item.id)}>
                  <div className="menu-content">
                    <IconComponent size={20} className="menu-icon" />
                    <span className="menu-title">{item.title}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`menu-arrow ${isOpen ? "open" : ""}`}
                  />
                </div>
                {isOpen && (
                  <ul className="submenu">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.id} className="submenu-item">
                        <Link to={subItem.path} className="submenu-link">
                          {subItem.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          } else {
            // Handling items that are direct links or non-expandable 'Accounts' if subItems is empty
            const isAccountsEmpty =
              item.id === "accounts" &&
              (!item.subItems || item.subItems.length === 0);
            return (
              <li key={item.id} className="menu-item">
                {isAccountsEmpty ? (
                  <div className="menu-link non-expandable">
                    <div className="menu-content">
                      <IconComponent size={20} className="menu-icon" />
                      <span className="menu-title">{item.title}</span>
                    </div>
                    <ChevronDown size={18} className="menu-arrow muted" />
                  </div>
                ) : (
                  <Link to={item.path || "#"} className="menu-link">
                    <IconComponent size={20} className="menu-icon" />
                    <span className="menu-title">{item.title}</span>
                  </Link>
                )}
              </li>
            );
          }
        })}
      </ul>

      {/* Add this new section for bottom menu items */}
      <div className="sidebar-bottom">
        <div className="bottom-divider"></div>
        <ul className="bottom-menu">
          <li className="menu-item">
            <Link to="/help" className="menu-link">
              <HelpCircle size={20} className="menu-icon" />
              <span className="menu-title">Help</span>
            </Link>
          </li>
          <li className="menu-item">
            <button onClick={handleLogout} className="menu-link logout-link">
              <LogOut size={20} className="menu-icon" />
              <span className="menu-title">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
