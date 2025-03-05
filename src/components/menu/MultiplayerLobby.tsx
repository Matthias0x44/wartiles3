import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { Faction } from '../../types';

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background-color: #1a1a1a;
  min-height: 100vh;
  color: white;
`;

const LobbyHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const LobbyTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
`;

const LobbyDescription = styled.p`
  font-size: 1.2rem;
  color: #aaa;
`;

const LobbyContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  width: 100%;
  max-width: 1000px;
`;

const PlayerSetupContainer = styled.div`
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const PlayerList = styled.div`
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #666;
  }
`;

const FactionSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
`;

const FactionOption = styled.div<{ selected: boolean, colorAccent: string }>`
  background-color: ${props => props.selected ? props.colorAccent : '#333'};
  padding: 15px 10px;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: ${props => props.selected ? 1 : 0.7};
  border: 2px solid ${props => props.selected ? props.colorAccent : 'transparent'};
  
  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }
`;

const FactionIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 5px;
`;

const FactionName = styled.div`
  font-weight: bold;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 12px 24px;
  background-color: ${props => props.primary ? '#4CAF50' : '#2196F3'};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.primary ? '#45a049' : '#0b7dda'};
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const ReadyCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin: 15px 0;
  
  input {
    margin-right: 10px;
    transform: scale(1.5);
  }
  
  label {
    font-weight: bold;
  }
`;

const PlayerCard = styled.div<{ color: string; isReady: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #333;
  border-left: 4px solid ${props => props.color};
  border-radius: 4px;
  
  ${props => props.isReady && `
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  `}
`;

const PlayerInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const PlayerName = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
`;

const PlayerFaction = styled.div`
  color: #aaa;
  font-size: 0.9rem;
`;

const ReadyBadge = styled.div`
  background-color: #4CAF50;
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
`;

const BackToMenuButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: transparent;
  border: none;
  color: #aaa;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    color: white;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const MultiplayerLobby: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  
  const currentPlayer = state.players.length > 0 ? state.players[0] : null;
  const allPlayersReady = state.players.length >= 2 && state.players.every(p => p.isReady);
  
  const handleJoinGame = () => {
    if (!playerName || !selectedFaction) return;
    
    dispatch({
      type: 'ADD_PLAYER',
      payload: {
        id: `player-${Date.now()}`,
        name: playerName,
        faction: selectedFaction
      }
    });
    
    setHasJoined(true);
  };
  
  const handleToggleReady = () => {
    if (!currentPlayer) return;
    
    dispatch({
      type: 'TOGGLE_READY',
      payload: { playerId: currentPlayer.id }
    });
    
    setIsReady(!isReady);
  };
  
  const handleStartGame = () => {
    dispatch({ type: 'START_GAME' });
    navigate('/game');
  };
  
  const getFactionColor = (faction: Faction): string => {
    switch (faction) {
      case 'Humans':
        return '#4169E1'; // Royal Blue
      case 'Robots':
        return '#B22222'; // Firebrick Red
      case 'Aliens':
        return '#228B22'; // Forest Green
      default:
        return '#808080';
    }
  };
  
  return (
    <LobbyContainer>
      <BackToMenuButton onClick={() => navigate('/')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Menu
      </BackToMenuButton>
      
      <LobbyHeader>
        <LobbyTitle>Game Lobby</LobbyTitle>
        <LobbyDescription>Join the battle and choose your faction</LobbyDescription>
      </LobbyHeader>
      
      <LobbyContent>
        <PlayerSetupContainer>
          <h2>Player Setup</h2>
          
          {!hasJoined ? (
            <>
              <FormGroup>
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Choose Faction</Label>
                <FactionSelector>
                  <FactionOption
                    selected={selectedFaction === 'Humans'}
                    colorAccent="#4169E1"
                    onClick={() => setSelectedFaction('Humans')}
                  >
                    <FactionIcon>👨‍🚀</FactionIcon>
                    <FactionName>Humans</FactionName>
                  </FactionOption>
                  
                  <FactionOption
                    selected={selectedFaction === 'Robots'}
                    colorAccent="#B22222"
                    onClick={() => setSelectedFaction('Robots')}
                  >
                    <FactionIcon>🤖</FactionIcon>
                    <FactionName>Robots</FactionName>
                  </FactionOption>
                  
                  <FactionOption
                    selected={selectedFaction === 'Aliens'}
                    colorAccent="#228B22"
                    onClick={() => setSelectedFaction('Aliens')}
                  >
                    <FactionIcon>👾</FactionIcon>
                    <FactionName>Aliens</FactionName>
                  </FactionOption>
                </FactionSelector>
              </FormGroup>
              
              <Button 
                primary 
                onClick={handleJoinGame} 
                disabled={!playerName || !selectedFaction}
              >
                Join Game
              </Button>
            </>
          ) : (
            <>
              <ReadyCheckbox>
                <input 
                  type="checkbox" 
                  id="readyCheck" 
                  checked={isReady}
                  onChange={handleToggleReady}
                />
                <label htmlFor="readyCheck">Ready to start</label>
              </ReadyCheckbox>
              
              <Button 
                primary 
                onClick={handleStartGame} 
                disabled={!allPlayersReady}
              >
                Start Game
              </Button>
              <p style={{ color: '#aaa', marginTop: '10px', fontSize: '0.9rem' }}>
                {allPlayersReady 
                  ? 'All players are ready!' 
                  : 'Waiting for all players to be ready...'}
              </p>
            </>
          )}
        </PlayerSetupContainer>
        
        <PlayerList>
          <h2>Players ({state.players.length}/3)</h2>
          
          {state.players.length === 0 ? (
            <p>No players have joined yet.</p>
          ) : (
            state.players.map(player => (
              <PlayerCard 
                key={player.id}
                color={player.color}
                isReady={player.isReady}
              >
                <PlayerInfo>
                  <PlayerName>{player.name}</PlayerName>
                  <PlayerFaction>{player.faction}</PlayerFaction>
                </PlayerInfo>
                
                {player.isReady && <ReadyBadge>Ready</ReadyBadge>}
              </PlayerCard>
            ))
          )}
          
          {state.players.length < 3 && !hasJoined && (
            <p>You can join this game!</p>
          )}
          
          {state.players.length < 3 && hasJoined && (
            <p>Waiting for more players to join...</p>
          )}
        </PlayerList>
      </LobbyContent>
    </LobbyContainer>
  );
};

export default MultiplayerLobby; 