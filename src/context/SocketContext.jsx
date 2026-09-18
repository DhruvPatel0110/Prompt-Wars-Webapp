import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [serverTimer, setServerTimer] = useState({
    timerRemaining: 600,
    timerRunning: false,
    timerEndsAt: null,
    status: 'LOCKED',
    isLocked: true
  });
  const [teamState, setTeamState] = useState(null);
  const [hostState, setHostState] = useState(null);
  const [projectorState, setProjectorState] = useState(null);
  const [evalProgress, setEvalProgress] = useState(null);
  const [lastVerdict, setLastVerdict] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    // Connect directly to backend port 3001 in dev or window.location.origin in prod
    const isDev = window.location.port === '5173' || window.location.port === '3000';
    const serverUrl = isDev
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : window.location.origin;

    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Connected to Prompt Wars WebSocket Server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from server. Reconnecting...');
    });

    newSocket.on('timer:tick', (timerData) => {
      const activeR = timerData.activeRound || 1;
      const activeRoundTimer = activeR === 3 ? timerData.round3 : activeR === 2 ? timerData.round2 : timerData.round1;
      
      setServerTimer({
        activeRound: activeR,
        timerRemaining: activeRoundTimer?.timerRemaining ?? timerData.timerRemaining ?? 600,
        timerRunning: activeRoundTimer?.timerRunning ?? timerData.timerRunning ?? false,
        timerEndsAt: activeRoundTimer?.timerEndsAt ?? timerData.timerEndsAt ?? null,
        status: activeRoundTimer?.status ?? timerData.status ?? 'LOCKED',
        isLocked: activeRoundTimer?.isLocked ?? timerData.isLocked ?? true,
        bombTimerRemaining: timerData.round3?.bombTimerRemaining ?? 30,
        bombRunning: timerData.round3?.bombRunning ?? false,
        phase: timerData.round3?.phase ?? 'master_draft'
      });
    });

    newSocket.on('timer:state', (roundState) => {
      setServerTimer(prev => ({
        ...prev,
        timerRemaining: roundState.timerRemaining,
        timerRunning: roundState.timerRunning,
        timerEndsAt: roundState.timerEndsAt,
        status: roundState.status,
        isLocked: roundState.isLocked
      }));
    });

    newSocket.on('team:state_sync', (data) => {
      setTeamState(data);
    });

    newSocket.on('admin:state_sync', (data) => {
      setHostState(data);
    });

    newSocket.on('projector:state_sync', (data) => {
      setProjectorState(data);
    });

    newSocket.on('admin:eval_progress', (prog) => {
      setEvalProgress(prog);
    });

    newSocket.on('round:verdict', (verdictData) => {
      setLastVerdict(verdictData);
    });

    // Latency Ping check
    const pingInterval = setInterval(() => {
      if (newSocket.connected) {
        const start = Date.now();
        newSocket.volatile.emit('ping', () => {
          setLatency(Date.now() - start);
        });
      }
    }, 5000);

    return () => {
      clearInterval(pingInterval);
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latency,
        serverTimer,
        teamState,
        setTeamState,
        hostState,
        setHostState,
        projectorState,
        evalProgress,
        lastVerdict
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
