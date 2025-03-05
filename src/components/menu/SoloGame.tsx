import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { Faction } from '../../types';

const SoloContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background-color: #1a1a1a;
  min-height: 100vh;
  color: white;
`;

const SoloHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const SoloTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
`;

const SoloDescription = styled.p`
  font-size: 1.2rem;
  color: #aaa;
`;

const SoloContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  background-color: #2a2a2a;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 1.1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
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
  gap: 15px;
  margin-top: 15px;
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

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 12px 24px;
  background-color: ${props => props.primary ? '#4CAF50' : '#2196F3'};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.primary ? '#45a049' : '#0b7dda'};
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
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

const DifficultySelector = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 15px;
`;

const DifficultyOption = styled.div<{ selected: boolean }>`
  background-color: ${props => props.selected ? '#555' : '#333'};
  padding: 15px;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid ${props => props.selected ? '#888' : 'transparent'};
  
  &:hover {
    background-color: #444;
  }
`;

const OpponentSection = styled.div`
  margin-top: 20px;
`;

const OpponentOption = styled.div<{ selected: boolean, faction: Faction }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid ${props => {
    if (!props.selected) return 'transparent';
    switch (props.faction) {
      case 'Humans': return '#4169E1';
      case 'Robots': return '#B22222';
      case 'Aliens': return '#228B22';
      default: return '#888';
    }
  }};
  
  &:hover {
    background-color: #444;
  }
`;

const OpponentDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CheckBox = styled.div<{ checked: boolean, color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid ${props => props.color};
  background-color: ${props => props.checked ? props.color : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const SoloGame: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  
  const [playerName, setPlayerName] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [opponents, setOpponents] = useState<Faction[]>([]);
  
  const handleToggleOpponent = (faction: Faction) => {
    if (opponents.includes(faction)) {
      setOpponents(opponents.filter(f => f !== faction));
    } else {
      if (opponents.length < 2) {
        setOpponents([...opponents, faction]);
      }
    }
  };
  
  const handleStartGame = () => {
    if (!playerName || !selectedFaction || opponents.length === 0) return;
    
    // Reset game
    dispatch({ type: 'RESET_GAME' });
    
    // Set solo mode
    dispatch({
      type: 'SET_SOLO_MODE',
      payload: { isSolo: true, difficulty }
    });
    
    // Add player
    dispatch({
      type: 'ADD_PLAYER',
      payload: {
        id: 'player1',
        name: playerName,
        faction: selectedFaction
      }
    });
    
    // Add AI opponents
    opponents.forEach(faction => {
      dispatch({
        type: 'ADD_AI_PLAYER',
        payload: { faction }
      });
    });
    
    // Set player as ready
    dispatch({
      type: 'TOGGLE_READY',
      payload: { playerId: 'player1' }
    });
    
    // Start game
    dispatch({ type: 'START_GAME' });
    
    // Navigate to game screen
    navigate('/game');
  };
  
  const getFactionColor = (faction: Faction): string => {
    switch (faction) {
      case 'Humans': return '#4169E1';
      case 'Robots': return '#B22222';
      case 'Aliens': return '#228B22';
      default: return '#808080';
    }
  };
  
  return (
    <SoloContainer>
      <BackToMenuButton onClick={() => navigate('/')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Menu
      </BackToMenuButton>
      
      <SoloHeader>
        <SoloTitle>Solo Game</SoloTitle>
        <SoloDescription>Challenge AI opponents and dominate the map</SoloDescription>
      </SoloHeader>
      
      <SoloContent>
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
          <Label>Choose Your Faction</Label>
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
        
        <FormGroup>
          <Label>Difficulty</Label>
          <DifficultySelector>
            <DifficultyOption
              selected={difficulty === 'Easy'}
              onClick={() => setDifficulty('Easy')}
            >
              Easy
            </DifficultyOption>
            <DifficultyOption
              selected={difficulty === 'Medium'} 
              onClick={() => setDifficulty('Medium')}
            >
              Medium
            </DifficultyOption>
            <DifficultyOption
              selected={difficulty === 'Hard'}
              onClick={() => setDifficulty('Hard')}
            >
              Hard
            </DifficultyOption>
          </DifficultySelector>
        </FormGroup>
        
        <FormGroup>
          <Label>Select Opponents (up to 2)</Label>
          <OpponentSection>
            {(['Humans', 'Robots', 'Aliens'] as Faction[]).filter(f => f !== selectedFaction).map(faction => (
              <OpponentOption 
                key={faction}
                selected={opponents.includes(faction)}
                faction={faction}
                onClick={() => handleToggleOpponent(faction)}
              >
                <OpponentDetails>
                  <FactionIcon>
                    {faction === 'Humans' ? '👨‍🚀' : faction === 'Robots' ? '🤖' : '👾'}
                  </FactionIcon>
                  <FactionName>{faction}</FactionName>
                </OpponentDetails>
                <CheckBox 
                  checked={opponents.includes(faction)}
                  color={getFactionColor(faction)}
                >
                  {opponents.includes(faction) && '✓'}
                </CheckBox>
              </OpponentOption>
            ))}
          </OpponentSection>
        </FormGroup>
        
        <ButtonGroup>
          <Button onClick={() => navigate('/')}>Cancel</Button>
          <Button 
            primary 
            onClick={handleStartGame}
            disabled={!playerName || !selectedFaction || opponents.length === 0}
          >
            Start Game
          </Button>
        </ButtonGroup>
      </SoloContent>
    </SoloContainer>
  );
};

export default SoloGame; 