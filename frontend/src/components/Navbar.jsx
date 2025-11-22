// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTheme } from "../context/ThemeContext";
import { Menu, Sun, Moon, User, LogOut, LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const navigate = useNavigate();
  const { mode, toggle } = useTheme();
  const [name, setName] = useState(null);
  const [open, setOpen] = useState(false);

  const loadUser = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setName(null);
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setName(decoded?.name || null);
    } catch {
      setName(null);
      localStorage.removeItem("token");
    }
  };

  useEffect(() => {
    loadUser();

    // update immediately after login/register/logout
    window.addEventListener("auth-changed", loadUser);

    // update when token changed in another tab
    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("auth-changed", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setName(null);
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800"
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-indigo-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-md transform-gpu">
            AI
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              TechQuery AI
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
              Practice. Improve. Ace it.
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow hover:scale-[1.01] transition"
            >
              ⚡ Generate Questions
            </Link>

            {name && (
              <Link
                to="/saved"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow hover:scale-[1.01] transition"
              >
                📁 Saved
              </Link>
            )}
          </div>

          {/* theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-md text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            {mode === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* mobile menu button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-indigo-600 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {name ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-slate-800 shadow-sm">
                  <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="text-sm text-slate-700 dark:text-slate-100 font-medium">
                    {name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center text-white cursor-pointer gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-slate-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center text-white gap-2 px-3 py-2 rounded-md hover:text-indigo-600 transition"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* mobile panel */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70"
        >
          <div className="container mx-auto px-4 py-3 flex flex-col gap-2 text-white">
            <Link
              to="/generate"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              Generate
            </Link>

            {name && (
              <Link
                to="/saved"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                Saved
              </Link>
            )}

            {name ? (
              <>
                <div className="px-3 py-2 rounded-md flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{name}</span>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="px-3 py-2 rounded-md text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 w-fit bg-indigo-600 text-white rounded-lg  hover:bg-indigo-800 transition shadow"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
