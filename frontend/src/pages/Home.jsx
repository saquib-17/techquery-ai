import React from "react";
import { Link } from "react-router-dom";
import {jwtDecode} from "jwt-decode"; // << REQUIRED IMPORT

function isLoggedIn() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    return decoded?.id ? true : false;
  } catch {
    return false;
  }
}

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <h1 className="text-4xl font-bold mb-4 text-white">
        Practice interviews with AI
      </h1>

      <p className="text-white mb-8">
        Paste your resume & job description, generate role-specific questions,
        answer and get AI feedback.
      </p>

      <div className="flex justify-center gap-4 text-white">

        {/* Always visible */}
        <a href="/generate" className="px-3 py-2 w-fit bg-indigo-600 text-white rounded-lg  hover:bg-indigo-700 transition shadow">
          Start Practicing
        </a>

        {/* Hide login + signup when already logged in */}
        {!isLoggedIn() && (
          <>
            <Link to="/register" className="flex items-center text-white cursor-pointer gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-slate-600 transition">
              Create Account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
