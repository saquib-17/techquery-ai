// src/components/ProtectedRoute.jsx
import React from "react";
import {jwtDecode} from "jwt-decode";
import { Navigate, useLocation } from "react-router-dom";
import LockScreen from "./LockScreen";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    // show a friendly lock screen with CTA
    return <LockScreen redirectTo="/login" from={location.pathname} />;
  }

  try {
    const decoded = jwtDecode(token);
    if (!decoded?.id) throw new Error("invalid token");
    return children;
  } catch {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
}
