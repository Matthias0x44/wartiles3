import React from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const VictoryCard = styled.div`
  background-color: #333;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
  text-align: center;
  max-width: 500px;
  animation: fadeIn 0.5s ease-in;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const VictoryTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
  color: gold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
`;

const VictoryMessage = styled.p`
  font-size: 1.5rem;
  margin-bottom: 30px;
`;

const PlayerName = styled.span<{ color: string }>`
  color: ${props => props.color};
  font-weight: bold;
`;

const GameStats = styled.div`
  margin: 20px 0;
  padding: 15px;
  background-color: #444;
  border-radius: 8px;
  text-align: left;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  font-size: 1.1rem;
`;

const ReplayButton = styled.button`
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #45a049;
  }
`;

const HomeButton = styled.button`
  padding: 12px 24px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: 20px;
  margin-left: 10px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0b7dda;
  }
`;

const VictoryScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const { winner, timeRemaining, players } = state;
  
  const getVictoryMessage = () => {
    if (!winner) {
      return "It's a tie! No clear winner emerged.";
    }
    
    if (timeRemaining > 0) {
      return `${winner.name} conquered all territories!`;
    } else {
      return `${winner.name} controlled the most territory when time ran out!`;
    }
  };
  
  const handleReplay = () => {
    dispatch({ type: 'RESET_GAME' });
  };
  
  return (
    <OverlayContainer>
      <VictoryCard>
        <VictoryTitle>Game Over!</VictoryTitle>
        <VictoryMessage>
          {winner ? (
            <>
              <PlayerName color={winner.color}>{winner.faction}</PlayerName> Victory!
            </>
          ) : "It's a Tie!"}
        </VictoryMessage>
        
        <p>{getVictoryMessage()}</p>
        
        <GameStats>
          {players.map(player => (
            <StatItem key={player.id}>
              <PlayerName color={player.color}>{player.name}</PlayerName>
              <span>{player.tiles.length} tiles</span>
            </StatItem>
          ))}
        </GameStats>
        
        <div>
          <ReplayButton onClick={handleReplay}>Play Again</ReplayButton>
          <HomeButton onClick={handleReplay}>Main Menu</HomeButton>
        </div>
      </VictoryCard>
    </OverlayContainer>
  );
};

export default VictoryScreen; 