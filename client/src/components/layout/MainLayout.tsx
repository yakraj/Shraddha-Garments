import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 print:bg-white print:h-auto print:block">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-72 print:pl-0 print:overflow-visible print:block">
        <div className="print:hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible print:block">
          <div className="mx-auto max-w-7xl print:max-w-none print:block">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
