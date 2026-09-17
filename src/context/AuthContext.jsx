import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prompt_wars_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto re-join on reconnect
  useEffect(() => {
    if (socket && isConnected && user) {
      if (user.role === 'team') {
        socket.emit('team:join', { teamId: user.teamId, pin: user.pin }, (res) => {
          if (!res?.success) {
            console.warn('Auto-reconnect failed for team:', res?.error);
          }
        });
      } else if (user.role === 'admin') {
        socket.emit('admin:join', { adminPin: user.adminPin }, (res) => {
          if (!res?.success) {
            console.warn('Auto-reconnect failed for admin:', res?.error);
          }
        });
      } else if (user.role === 'projector') {
        socket.emit('projector:join', {}, () => {});
      }
    }
  }, [socket, isConnected, user]);

  const loginTeam = async (teamId, pin) => {
    setIsAuthenticating(true);
    setAuthError(null);

    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        setIsAuthenticating(false);
        setAuthError('Server is not connected. Please ensure backend is running.');
        resolve(false);
        return;
      }

      socket.emit('team:join', { teamId, pin }, (res) => {
        setIsAuthenticating(false);
        if (res?.success) {
          const session = {
            role: 'team',
            teamId,
            teamName: res.teamView.team.name,
            pin
          };
          setUser(session);
          localStorage.setItem('prompt_wars_session', JSON.stringify(session));
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
    setAuthError(null);

    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        setIsAuthenticating(false);
        setAuthError('Server is not connected.');
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
          setUser(session);
          localStorage.setItem('prompt_wars_session', JSON.stringify(session));
          resolve(true);
        } else {
          setAuthError(res?.error || 'Invalid Admin PIN');
          resolve(false);
        }
      });
    });
  };

  const loginProjector = () => {
    const session = { role: 'projector' };
    setUser(session);
    localStorage.setItem('prompt_wars_session', JSON.stringify(session));
    if (socket && isConnected) {
      socket.emit('projector:join', {}, () => {});
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prompt_wars_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authError,
        isAuthenticating,
        loginTeam,
        loginAdmin,
        loginProjector,
        logout
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
