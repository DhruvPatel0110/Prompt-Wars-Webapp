import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();

  // Distinct sessions for Team and Admin to prevent collisions
  const [teamUser, setTeamUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prompt_wars_team_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prompt_wars_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authError, setAuthError] = useState(null);
  const [adminAuthError, setAdminAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto re-join on reconnect
  useEffect(() => {
    if (socket && isConnected) {
      if (teamUser) {
        socket.emit('team:join', { 
          teamId: teamUser.teamId, 
          teamName: teamUser.teamName, 
          teamNumber: teamUser.teamNumber, 
          pin: teamUser.pin 
        }, (res) => {
          if (!res?.success) {
            console.warn('Auto-reconnect failed for team, clearing stale session:', res?.error);
            logoutTeam();
          }
        });
      }
      if (adminUser) {
        socket.emit('admin:join', { adminPin: adminUser.adminPin }, (res) => {
          if (!res?.success) {
            console.warn('Auto-reconnect failed for admin, clearing stale session:', res?.error);
            logoutAdmin();
          }
        });
      }
    }
  }, [socket, isConnected]);

  const loginTeam = async (params, secondaryPin) => {
    setIsAuthenticating(true);
    setAuthError(null);

    // Support both loginTeam({ teamName, teamNumber, pin }) and loginTeam(teamId, pin)
    let payload = {};
    if (typeof params === 'object' && params !== null) {
      payload = params;
    } else {
      payload = { teamId: params, pin: secondaryPin };
    }

    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        setIsAuthenticating(false);
        setAuthError('Server is not connected. Please ensure backend is running.');
        resolve(false);
        return;
      }

      socket.emit('team:join', payload, (res) => {
        setIsAuthenticating(false);
        if (res?.success && res.teamView?.team) {
          const registeredTeam = res.teamView.team;
          const session = {
            role: 'team',
            teamId: registeredTeam.id,
            teamName: registeredTeam.name,
            teamNumber: payload.teamNumber || registeredTeam.id.replace('team_', ''),
            pin: payload.pin
          };
          setTeamUser(session);
          localStorage.setItem('prompt_wars_team_session', JSON.stringify(session));
          resolve(true);
        } else {
          setAuthError(res?.error || 'Authentication failed');
          resolve(false);
        }
      });
    });
  };

  const loginAdmin = async (adminPin) => {
    setIsAuthenticating(true);
    setAdminAuthError(null);

    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        setIsAuthenticating(false);
        setAdminAuthError('Server is not connected.');
        resolve(false);
        return;
      }

      socket.emit('admin:join', { adminPin }, (res) => {
        setIsAuthenticating(false);
        if (res?.success) {
          const session = {
            role: 'admin',
            adminPin
          };
          setAdminUser(session);
          localStorage.setItem('prompt_wars_admin_session', JSON.stringify(session));
          resolve(true);
        } else {
          setAdminAuthError(res?.error || 'Invalid Admin PIN');
          resolve(false);
        }
      });
    });
  };

  const logoutTeam = () => {
    setTeamUser(null);
    localStorage.removeItem('prompt_wars_team_session');
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    localStorage.removeItem('prompt_wars_admin_session');
  };

  return (
    <AuthContext.Provider
      value={{
        teamUser,
        adminUser,
        user: teamUser, // default backwards compatibility
        authError,
        adminAuthError,
        isAuthenticating,
        loginTeam,
        loginAdmin,
        logoutTeam,
        logoutAdmin,
        logout: logoutTeam
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
