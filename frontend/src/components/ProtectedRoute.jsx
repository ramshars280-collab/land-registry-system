import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, Loader2, ArrowLeft, LogOut } from "lucide-react";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-150">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
          Verifying security credentials and session...
        </p>
      </div>
    );
  }

  // 1. Unauthenticated users redirected to portal login
  if (!user) {
    return <Navigate to={`/${requiredRole}/login`} state={{ from: location }} replace />;
  }

  // 2. Role authorization check
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100 transition-colors duration-150">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 dark:text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">403 Access Forbidden</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Your authenticated identity holds the{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">{user.role}</span> role. You are
            not authorized to access the{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase">{requiredRole}</span> portal.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.assign(`/${user.role}`)}
              className="w-full py-2.5 px-4 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-sm flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go to My {user.role.toUpperCase()} Portal</span>
            </button>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all text-sm flex items-center justify-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
