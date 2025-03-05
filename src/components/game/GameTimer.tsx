import React from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';

const TimerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  width: 100%;
`;

const TimerDisplay = styled.div`
  font-size: 2rem;
  font-weight: bold;
  background-color: #333;
  padding: 10px 20px;
  border-radius: 8px;
  min-width: 150px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  &.warning {
    color: #ffcc00;
  }
  
  &.danger {
    color: #ff4d4d;
  }
`;

const GameTimer: React.FC = () => {
  const { state } = useGame();
  const { timeRemaining, isGameStarted, isGameOver } = state;
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Determine timer class based on time remaining
  const getTimerClass = (): string => {
    if (timeRemaining <= 30) return 'danger';
    if (timeRemaining <= 60) return 'warning';
    return '';
  };
  
  return (
    <TimerContainer>
      <TimerDisplay className={getTimerClass()}>
        {isGameStarted ? formatTime(timeRemaining) : '05:00'}
      </TimerDisplay>
    </TimerContainer>
  );
};

export default GameTimer; 