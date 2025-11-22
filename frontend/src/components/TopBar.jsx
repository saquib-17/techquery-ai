// src/components/TopBar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

export default function TopBar({ title }) {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let name = "User";

  try {
    if (token) {
      const decoded = jwtDecode(token);
      name = decoded.name || "User";
    }
  } catch {}

  return (
    <header className="w-full h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-[#1a1a1a]">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h1>

      {/* User Badge */}
      <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-full text-sm font-medium">
        {name}
      </div>
    </header>
  );
}
