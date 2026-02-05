import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar'; // Ensure this path is correct based on your folder structure
import { Menu } from 'lucide-react';

/**
 * MainLayout Component
 * Provides the structural shell for the application, including the Sidebar
 * and the main content area (Outlet).
 * It manages responsive behavior for mobile devices.
 */
export const MainLayout = () => {
  // State to control sidebar visibility on mobile devices
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Sidebar Component */}
      {/* The sidebar handles navigation and user profile summary */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      {/* The main area adjusts its margin on desktop to accommodate the sidebar */}
      <main className="flex-1 transition-all duration-300 md:ml-64">
        
        {/* Mobile Top Bar (Hamburger Menu) */}
        {/* Visible only on mobile screens to toggle the sidebar */}
        <div className="md:hidden bg-white border-b p-4 flex items-center sticky top-0 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-100"
            aria-label="Open Sidebar"
          >
            <Menu size={28} />
          </button>
          <span className="ml-4 font-bold text-slate-700">ingenIA-Q</span>
        </div>

        {/* Dynamic Content (Outlet) */}
        {/* Calculates height to ensure scrolling works correctly within the content area */}
        <div className="p-4 md:p-8 overflow-y-auto h-[calc(100vh-65px)] md:h-screen">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </div>

      </main>
    </div>
  );
};