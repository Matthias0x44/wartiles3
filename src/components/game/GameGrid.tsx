import React from 'react';
import styled from 'styled-components';
import { useGame } from '../../context/GameContext';
import { GRID_SIZE, STRUCTURES, StructureType } from '../../types';
import Tile from './Tile';

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${GRID_SIZE}, 1fr);
  grid-template-rows: repeat(${GRID_SIZE}, 1fr);
  gap: 1px;
  width: 90vh;
  height: 90vh;
  max-width: 100%;
  max-height: 100%;
  background-color: #333;
  margin: 0 auto;
  border: 2px solid #555;
  border-radius: 4px;
`;

const GameGrid: React.FC = () => {
  const { state, dispatch } = useGame();
  const { grid, players, isGameStarted } = state;
  
  // Current player (for now just use the first player)
  // In a multiplayer implementation, this would be the current player's ID
  const currentPlayer = players[0] || null;
  const currentPlayerId = currentPlayer ? currentPlayer.id : null;
  
  const handleTileClick = (x: number, y: number) => {
    if (!isGameStarted || !currentPlayer) return;
    
    const tile = grid[y][x];
    
    // If tile is not owned by anyone, try to annex it
    if (tile.owner === null) {
      dispatch({
        type: 'ANNEX_TILE',
        payload: { playerId: currentPlayer.id, x, y }
      });
    } 
    // If tile is owned by current player, the Tile component will handle showing the structure menu
    else if (tile.owner === currentPlayer.id) {
      // This is now handled in the Tile component
    } 
    // If tile is owned by another player, try to occupy it
    else {
      dispatch({
        type: 'OCCUPY_TILE',
        payload: { playerId: currentPlayer.id, x, y }
      });
    }
  };
  
  // Function to build a structure
  const buildStructure = (x: number, y: number, structureType: StructureType) => {
    if (!currentPlayer) return;
    
    const tile = grid[y][x];
    if (tile.owner !== currentPlayer.id) return;
    
    const structure = STRUCTURES[currentPlayer.faction][structureType];
    
    dispatch({
      type: 'BUILD_STRUCTURE',
      payload: { x, y, structure }
    });
  };
  
  // Function to demolish a structure
  const demolishStructure = (x: number, y: number) => {
    if (!currentPlayer) return;
    
    const tile = grid[y][x];
    if (tile.owner !== currentPlayer.id || !tile.structure) return;
    
    dispatch({
      type: 'DEMOLISH_STRUCTURE',
      payload: { x, y }
    });
  };
  
  return (
    <GridContainer>
      {grid.map((row, y) =>
        row.map((tile, x) => (
          <Tile
            key={`${x}-${y}`}
            tile={tile}
            onClick={() => handleTileClick(x, y)}
            onBuild={(structureType: StructureType) => buildStructure(x, y, structureType)}
            onDemolish={() => demolishStructure(x, y)}
            players={players}
            currentPlayerId={currentPlayerId}
          />
        ))
      )}
    </GridContainer>
  );
};

export default GameGrid; 