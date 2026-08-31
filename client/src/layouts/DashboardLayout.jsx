import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import PageTransition from "../components/PageTransition";

export default function DashboardLayout({ title, children }) {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-muted dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Topbar title={title} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <PageTransition keyProp={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
