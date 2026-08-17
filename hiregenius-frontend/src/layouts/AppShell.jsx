import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../features/auth/authSlice';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import Footer from '../components/Footer/Footer';

/**
 * AppShell — authenticated layout wrapper.
 * Reads the user's role from Redux and passes it to Sidebar
 * so only role-appropriate nav items render.
 * Rules.md §3: one component per file.
 */
const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const role = useSelector(selectUserRole);

  // Auto-collapse on smaller viewports
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const handler = (e) => {
      setSidebarCollapsed(e.matches);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Role-aware sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setSidebarCollapsed((c) => !c)}
        className="hidden md:flex fixed bottom-6 z-50 items-center justify-center w-6 h-6 rounded-full shadow-md"
        style={{
          left: sidebarCollapsed ? '52px' : '248px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          transition: 'left 0.25s ease',
        }}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        id="appshell-sidebar-toggle"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AppShell;
