import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { HostDashboard } from './pages/HostDashboard';

export function App() {
  const { teamUser, adminUser } = useAuth();

  // Determine current route: 'student' (default on /) or 'admin' (on /admin, /host, #/admin, or ?admin=true)
  const getInitialRoute = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();

    if (
      path === '/admin' || 
      path === '/host' || 
      hash === '#/admin' || 
      hash === '#/host' || 
      search.includes('admin') || 
      search.includes('host')
    ) {
      return 'admin';
    }
    return 'student';
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = (route) => {
    setCurrentRoute(route);
    if (route === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  const isAdminRoute = currentRoute === 'admin';

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar isAdminRoute={isAdminRoute} onNavigate={navigateTo} />
      <main className="flex-1">
        {isAdminRoute ? (
          // Admin / Host Portal
          adminUser ? (
            <HostDashboard />
          ) : (
            <AdminLoginPage onSwitchToStudent={() => navigateTo('student')} />
          )
        ) : (
          // Student Team Portal
          teamUser ? (
            <StudentDashboard />
          ) : (
            <LoginPage onSwitchToAdmin={() => navigateTo('admin')} />
          )
        )}
      </main>
    </div>
  );
}

export default App;
