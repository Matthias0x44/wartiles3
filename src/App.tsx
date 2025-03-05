import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import MainMenu from './components/menu/MainMenu';
import MultiplayerLobby from './components/menu/MultiplayerLobby';
import SoloGame from './components/menu/SoloGame';
import GameInfo from './components/menu/GameInfo';
import GameScreen from './components/game/GameScreen';
import './App.css';

function App() {
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
