import React from 'react';
import styled from 'styled-components';
import { Player } from '../../types';

interface PlayerInfoProps {
  player: Player;
}

const PlayerContainer = styled.div<{ color: string; isEliminated: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background-color: #333;
  border-left: 5px solid ${props => props.color};
  border-radius: 4px;
  opacity: ${props => props.isEliminated ? 0.6 : 1};
  position: relative;
`;

const PlayerName = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FactionBadge = styled.span<{ color: string }>`
  background-color: ${props => props.color};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
`;

const ResourcesContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const ResourceItem = styled.div`
  padding: 8px;
  background-color: #444;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ResourceValue = styled.div`
  font-size: 1.4rem;
  font-weight: bold;
`;

const ResourceLabel = styled.div`
  font-size: 0.8rem;
  color: #aaa;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 4px 0;
  border-bottom: 1px solid #444;
`;

const EliminatedBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #d32f2f;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
`;

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player }) => {
  return (
    <PlayerContainer color={player.color} isEliminated={player.isEliminated}>
      <PlayerName>
        {player.name}
        <FactionBadge color={player.color}>
          {player.faction}
        </FactionBadge>
      </PlayerName>
      
      {player.isEliminated && (
        <EliminatedBadge>Eliminated</EliminatedBadge>
      )}
      
      <ResourcesContainer>
        <ResourceItem>
          <ResourceValue>{player.gold}</ResourceValue>
          <ResourceLabel>Gold</ResourceLabel>
        </ResourceItem>
        <ResourceItem>
          <ResourceValue>{player.units}</ResourceValue>
          <ResourceLabel>Units</ResourceLabel>
        </ResourceItem>
      </ResourcesContainer>
      
      <StatItem>
        <span>Gold Rate:</span>
        <span>+{player.goldRate}/s</span>
      </StatItem>
      
      <StatItem>
        <span>Unit Rate:</span>
        <span>+{player.unitRate}/s</span>
      </StatItem>
      
      <StatItem>
        <span>Territory:</span>
        <span>{player.tiles.length} tiles</span>
      </StatItem>
    </PlayerContainer>
  );
};

export default PlayerInfo; 