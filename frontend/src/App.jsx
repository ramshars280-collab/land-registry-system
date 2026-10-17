import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import RoleLoginPage from "./pages/RoleLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import InspectorDashboard from "./pages/InspectorDashboard";
import RegistrarDashboard from "./pages/RegistrarDashboard";
import CitizenDashboard from "./pages/CitizenDashboard";

export default function App() {
  // Theme state: defaults to light mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("terrachain_theme");
      return saved === "dark";
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("terrachain_theme", next ? "dark" : "light");
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  return (
    <AuthProvider>
      <div className={isDarkMode ? "dark" : ""}>
        <BrowserRouter>
          <Routes>
            {/* 1. Public Role Selection Landing Hub */}
            <Route
              path="/"
              element={<LandingPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
            />

            {/* 2. Dedicated Role Login Entry Points */}
            <Route
              path="/admin/login"
              element={<RoleLoginPage role="admin" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
            />
            <Route
              path="/inspector/login"
              element={<RoleLoginPage role="inspector" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
            />
            <Route
              path="/registrar/login"
              element={<RoleLoginPage role="registrar" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
            />
            <Route
              path="/citizen/login"
              element={<RoleLoginPage role="citizen" isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
            />

            {/* 3. Protected Role Portals */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspector/*"
              element={
                <ProtectedRoute requiredRole="inspector">
                  <InspectorDashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registrar/*"
              element={
                <ProtectedRoute requiredRole="registrar">
                  <RegistrarDashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/*"
              element={
                <ProtectedRoute requiredRole="citizen">
                  <CitizenDashboard isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}
