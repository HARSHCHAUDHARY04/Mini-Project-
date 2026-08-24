import React from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import PageTransition from "../components/PageTransition";

export default function DashboardLayout({ title, children }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Topbar title={title} />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <PageTransition keyProp={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
