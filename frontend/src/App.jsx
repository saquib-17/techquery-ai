// src/App.jsx
import React from "react";
import "./index.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Generate from "./pages/GenerateQuestions";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-linear-to-b from-white/80 to-slate-50 dark:from-slate-900 dark:to-slate-950 transition-colors">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-2">
          <Routes >
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />}/>
            <Route path="/register" element={<Register />} />
            <Route
              path="/generate"
              element={
                <ProtectedRoute>
                  <Generate />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-white/70 dark:bg-slate-900/60 border-t border-gray-200 dark:border-slate-800 py-6">
          <div className="container mx-auto px-4 text-center text-sm  text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} TechQuery AI — Built with ❤️
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
