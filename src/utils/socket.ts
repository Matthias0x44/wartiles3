import { io as socketIO, Socket as IOSocket } from 'socket.io-client';

// Determine the server URL based on environment
const getServerUrl = (): string => {
  // In production, use the same domain
  if (process.env.NODE_ENV === 'production') {
    const url = window.location.origin;
    console.log(`[Socket] Production environment detected, using URL: ${url}`);
    return url;
  }
  
  // In development, connect to the local server
  console.log('[Socket] Development environment detected, using localhost:8080');
  return 'http://localhost:8080';
};

let socket: IOSocket | null = null;

// Initialize socket connection
export const initializeSocket = (): IOSocket => {
  if (!socket) {
    const serverUrl = getServerUrl();
    console.log(`[Socket] Attempting to connect to server at: ${serverUrl}`);
    
    socket = socketIO(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true, // Enable CORS credentials
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log(`[Socket] Connected to server! Socket ID: ${socket?.id}`);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket] Disconnected from server. Reason: ${reason}`);
    });

    socket.on('connect_error', (error: Error) => {
      console.error(`[Socket] Connection error: ${error.message}`);
      // Try to reconnect with polling if websocket fails
      if (socket && socket.io.opts.transports && socket.io.opts.transports[0] === 'websocket') {
        console.log('[Socket] Attempting to reconnect with polling transport');
        socket.io.opts.transports = ['polling', 'websocket'];
      }
    });
  }

  return socket;
};

// Get the socket instance (creates one if it doesn't exist)
export const getSocket = (): IOSocket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Helper functions for common socket operations
export const joinLobby = (playerName: string, faction: string): void => {
  const socket = getSocket();
  console.log(`[Socket] Emitting join_lobby event with name: ${playerName}, faction: ${faction}`);
  socket.emit('join_lobby', { playerName, faction });
};

export const toggleReady = (): void => {
  const socket = getSocket();
  console.log('[Socket] Emitting toggle_ready event');
  socket.emit('toggle_ready');
};

export const startGame = (): void => {
  const socket = getSocket();
  console.log('[Socket] Emitting start_game event');
  socket.emit('start_game');
};

export const emitGameAction = (gameId: string, action: any): void => {
  const socket = getSocket();
  console.log(`[Socket] Emitting game_action for game: ${gameId}`, action);
  socket.emit('game_action', { gameId, action });
};

export default {
  initializeSocket,
  getSocket,
  joinLobby,
  toggleReady,
  startGame,
  emitGameAction,
}; 