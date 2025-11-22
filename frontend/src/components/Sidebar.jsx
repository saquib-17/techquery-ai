// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, Settings, LogOut } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  const menu = [
    { path: "/generate", label: "Generate", icon: FileText },
    { path: "/profile", label: "Profile", icon: Settings },
  ];

  return (
    <aside className="h-full w-16 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-6 gap-6">
      
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg">
        TQ
      </div>

      {/* Menu items */}
      <nav className="flex flex-col gap-6 mt-6 w-full items-center">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center text-xs ${
                active
                  ? "text-orange-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-6 h-6`} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button
          onClick={logout}
          className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </aside>
  );
}
