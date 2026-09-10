import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Claims from "./pages/Claims";
import ClaimDetail from "./pages/ClaimDetail";
import Policies from "./pages/Policies";
import ClinicalDocuments from "./pages/ClinicalDocuments";
import Appeals from "./pages/Appeals";
import AppealReview from "./pages/AppealReview";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

function Protected({ children }) {
  return (
    <ErrorBoundary>
      <ProtectedRoute>{children}</ProtectedRoute>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/claims" element={<Protected><Claims /></Protected>} />
      <Route path="/claims/:id" element={<Protected><ClaimDetail /></Protected>} />
      <Route path="/policies" element={<Protected><Policies /></Protected>} />
      <Route path="/clinical-documents" element={<Protected><ClinicalDocuments /></Protected>} />
      <Route path="/appeals" element={<Protected><Appeals /></Protected>} />
      <Route path="/appeals/:claimId/review" element={<Protected><AppealReview /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="/users" element={<Protected><UserManagement /></Protected>} />
      <Route path="/audit-logs" element={<Protected><AuditLogs /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

