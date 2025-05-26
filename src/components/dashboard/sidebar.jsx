import React, { useState } from "react";
import { Link } from "react-router-dom"; // Assuming you are using react-router-dom for navigation
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
  // Add other icons from your original list if they are used elsewhere or planned
  // UserCog,
  // Settings,
  // Users,
  // MapPin,
  // Building2,
} from "lucide-react";
import "./sidebar.css"; // We will create/update this CSS file

// Placeholder for the logo image - replace with your actual logo path
const logoUrl = "src/assets/GM-Logo.png"; // Example path, or import if using build system

const menuItemsData = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Home,
    path: "/dashboard",
  },
  {
    id: "attendance",
    title: "Attendance",
    icon: CalendarCheck,
    subItems: [
      { id: "my_attendance", title: "My Attendance", path: "/attendance/my" },
      { id: "user_attendance", title: "User Attendance", path: "/attendance/user" },
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
      { id: "add_expenses", title: "Add Expenses", path: "/expenses/add" },
      { id: "my_expenses", title: "My Expenses", path: "/expenses/my" },
      { id: "all_expenses", title: "All Expenses", path: "/expenses/all" },
      { id: "manage_expenses", title: "Manage Expenses", path: "/expenses/manage" },
    ],
  },
  {
    id: "project",
    title: "Project",
    icon: KanbanSquare, // Using KanbanSquare as per image style for project management
    subItems: [
      { id: "manage_project_expense", title: "Manage Project & Expense", path: "/project/manage" },
    ],
  },
  {
    id: "requisition",
    title: "Requisition",
    icon: ClipboardPaste,
    subItems: [
      { id: "add_requisition", title: "Add Requisition", path: "/requisition/add" },
      { id: "my_requisitions", title: "My Requisitions", path: "/requisition/my" },
      { id: "all_requisitions", title: "All Requisitions", path: "/requisition/all" },
      { id: "manage_requisitions", title: "Manage Requisitions", path: "/requisition/manage" },
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    icon: UsersRound, // Generic icon for accounts or user-related settings
    subItems: [
      // Add sub-items here if/when they are defined.
      // Example:
      // { id: "profile", title: "Profile", path: "/accounts/profile" },
      // { id: "user_settings", title: "Settings", path: "/accounts/settings" },
    ],
  },
];

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (id) => {
    setOpenMenus((prevOpenMenus) => ({
      ...prevOpenMenus,
      [id]: !prevOpenMenus[id],
    }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        {/* Replace with your actual logo. You might need to adjust styling. */}
        <img src={logoUrl} alt="Geomaticx Logo" onError={(e) => e.target.style.display='none'} />
        {/* Fallback text if image fails or for initial setup */}
        {!logoUrl.startsWith("/path/to/your") && <span>GEOMATICX</span>}
      </div>
      <ul className="sidebar-menu">
        {menuItemsData.map((item) => {
          const IconComponent = item.icon;
          const isOpen = openMenus[item.id] || false;

          if (item.subItems && item.subItems.length > 0) {
            return (
              <li key={item.id} className={`menu-item ${isOpen ? "open" : ""}`}>
                <div className="menu-link" onClick={() => toggleMenu(item.id)}>
                  <IconComponent size={20} className="menu-icon" />
                  <span className="menu-title">{item.title}</span>
                  {isOpen ? (
                    <ChevronUp size={18} className="menu-arrow" />
                  ) : (
                    <ChevronDown size={18} className="menu-arrow" />
                  )}
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
            const isAccountsEmpty = item.id === "accounts" && (!item.subItems || item.subItems.length === 0);
            return (
              <li key={item.id} className="menu-item">
                {isAccountsEmpty ? (
                   <div className="menu-link non-expandable"> {/* Style as non-expandable or allow click if it's a future parent */}
                    <IconComponent size={20} className="menu-icon" />
                    <span className="menu-title">{item.title}</span>
                    {/* Optionally, show a different arrow or no arrow if it's known to be non-expandable currently */}
                     <ChevronDown size={18} className="menu-arrow muted" /> {/* Muted arrow for future expansion */}
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
    </div>
  );
};

export default Sidebar;