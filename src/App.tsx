import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GameProvider } from './context/GameContext';
import MainMenu from './components/menu/MainMenu';
import MultiplayerLobby from './components/menu/MultiplayerLobby';
import SoloGame from './components/menu/SoloGame';
import GameInfo from './components/menu/GameInfo';
import GameScreen from './components/game/GameScreen';
import { initializeSocket } from './utils/socket';
import './App.css';

function App() {
  const [socketInitialized, setSocketInitialized] = useState(false);
  
  // Initialize socket connection when the app loads
  useEffect(() => {
    const initSocket = async () => {
      try {
        const socket = initializeSocket();
        
        // Log connection status
        console.log('[App] Socket initialized');
        
        // Add manual reconnection attempts if needed
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        socket.on('connect', () => {
          console.log('[App] Socket successfully connected:', socket.id);
          reconnectAttempts = 0;
          setSocketInitialized(true);
        });
        
        socket.on('disconnect', (reason) => {
          console.log('[App] Socket disconnected:', reason);
          
          // If the disconnection is not expected, try to reconnect manually
          if (reason === 'io server disconnect' || reason === 'transport close') {
            if (reconnectAttempts < maxReconnectAttempts) {
              console.log(`[App] Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
              setTimeout(() => {
                socket.connect();
                reconnectAttempts++;
              }, 2000); // Wait 2 seconds before reconnecting
            }
          }
        });
        
        socket.on('connect_error', (error) => {
          console.error('[App] Socket connection error:', error);
          setSocketInitialized(false);
        });
        
        // Ensure connection is fully established
        if (!socket.connected) {
          socket.connect();
        }
      } catch (error) {
        console.error('[App] Error initializing socket:', error);
      }
    };
    
    initSocket();
    
    // Return cleanup function
    return () => {
      const socket = initializeSocket();
      if (socket.connected) {
        console.log('[App] Cleaning up socket connection');
        socket.disconnect();
      }
    };
  }, []);

  return (
    <Router>
      <GameProvider>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/multiplayer" element={<MultiplayerLobby />} />
          <Route path="/solo" element={<SoloGame />} />
          <Route path="/info" element={<GameInfo />} />
          <Route path="/game" element={<GameScreen />} />
        </Routes>
      </GameProvider>
    </Router>
  );
}

export default App;
