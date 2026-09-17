import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { HostDashboard } from './pages/HostDashboard';
import { ProjectorView } from './pages/ProjectorView';

export function App() {
  const { user, loginProjector } = useAuth();

  // Support direct URL query parameters for fast auditorium setup (e.g. ?view=projector)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'projector' && (!user || user.role !== 'projector')) {
      loginProjector();
    }
  }, [user, loginProjector]);

  if (user?.role === 'projector') {
    return <ProjectorView />;
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        {!user && <LoginPage />}
        {user?.role === 'team' && <StudentDashboard />}
        {user?.role === 'admin' && <HostDashboard />}
      </main>
    </div>
  );
}

export default App;
