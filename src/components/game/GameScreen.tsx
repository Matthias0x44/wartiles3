import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import GameGrid from './GameGrid';
import PlayerInfo from './PlayerInfo';
import GameTimer from './GameTimer';
import VictoryScreen from './VictoryScreen';

const GameContainer = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background-color: #1a1a1a;
  color: white;
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: #2a2a2a;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const GameScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const { isGameStarted, isGameOver } = state;

  // Start the game automatically for testing
  // In a real app, this would be triggered by a button click after players are ready
  useEffect(() => {
    // Add test players for demo
    if (state.players.length === 0) {
      dispatch({
        type: 'ADD_PLAYER',
        payload: { id: 'player1', name: 'Player 1', faction: 'Humans' }
      });
      
      dispatch({
        type: 'ADD_PLAYER',
        payload: { id: 'player2', name: 'Player 2', faction: 'Robots' }
      });
      
      // Set players as ready
      dispatch({
        type: 'TOGGLE_READY',
        payload: { playerId: 'player1' }
      });
      
      dispatch({
        type: 'TOGGLE_READY',
        payload: { playerId: 'player2' }
      });
      
      // Start the game
      setTimeout(() => {
        dispatch({ type: 'START_GAME' });
      }, 500);
    }
  }, [dispatch, state.players.length]);

  return (
    <GameContainer>
      <LeftPanel>
        <GameTimer />
        <GameGrid />
      </LeftPanel>
      <RightPanel>
        {state.players.map(player => (
          <PlayerInfo key={player.id} player={player} />
        ))}
      </RightPanel>
      
      {isGameOver && <VictoryScreen />}
    </GameContainer>
  );
};

export default GameScreen; 