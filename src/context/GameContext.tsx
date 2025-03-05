import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Faction, GameState, GRID_SIZE, Player, Tile, GAME_DURATION, Structure, MIN_DISTANCE, StructureType, STRUCTURES } from '../types';

// Initial game state
const initialState: GameState = {
  players: [],
  grid: Array(GRID_SIZE).fill(null).map((_, y) => 
    Array(GRID_SIZE).fill(null).map((_, x) => ({
      x,
      y,
      owner: null,
      structure: null,
      goldValue: 10, // Base cost to annex
      unitValue: 0,  // Base defense value
    }))
  ),
  timeRemaining: GAME_DURATION,
  isGameStarted: false,
  isGameOver: false,
  winner: null,
  isSoloMode: false,
};

// Action types
type Action = 
  | { type: 'ADD_PLAYER'; payload: { id: string, name: string, faction: Faction } }
  | { type: 'TOGGLE_READY'; payload: { playerId: string } }
  | { type: 'START_GAME' }
  | { type: 'ANNEX_TILE'; payload: { playerId: string, x: number, y: number } }
  | { type: 'BUILD_STRUCTURE'; payload: { x: number, y: number, structure: Structure } }
  | { type: 'DEMOLISH_STRUCTURE'; payload: { x: number, y: number } }
  | { type: 'UPDATE_RESOURCES' }
  | { type: 'TICK_TIMER' }
  | { type: 'OCCUPY_TILE'; payload: { playerId: string, x: number, y: number } }
  | { type: 'SET_SOLO_MODE'; payload: { isSolo: boolean, difficulty?: 'Easy' | 'Medium' | 'Hard' } }
  | { type: 'ADD_AI_PLAYER'; payload: { faction: Faction } }
  | { type: 'END_GAME'; payload: { winner: Player | null } }
  | { type: 'RESET_GAME' }
  | { type: 'SET_PLAYERS'; payload: { players: Array<{ id: string, name: string, faction: Faction, isReady: boolean, color: string }> } };

// Helper functions
const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const findRandomStartPosition = (grid: Tile[][], existingPositions: Array<{ x: number, y: number }>): { x: number, y: number } => {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    
    const isFarEnough = existingPositions.every(
      pos => calculateDistance(x, y, pos.x, pos.y) >= MIN_DISTANCE
    );
    
    if (isFarEnough) {
      return { x, y };
    }
    
    attempts++;
  }
  
  // If we can't find a perfect spot after max attempts, just place it somewhere
  return { 
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE)
  };
};

// Reducer function
const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'ADD_PLAYER':
      // Maximum 3 players
      if (state.players.length >= 3) {
        return state;
      }
      
      // Check if player with this ID already exists
      if (state.players.some(p => p.id === action.payload.id)) {
        return state;
      }
      
      // Assign a color based on faction
      let color;
      switch (action.payload.faction) {
        case 'Humans':
          color = '#4169E1'; // Royal Blue
          break;
        case 'Robots':
          color = '#B22222'; // Firebrick Red
          break;
        case 'Aliens':
          color = '#228B22'; // Forest Green
          break;
        default:
          color = '#808080'; // Gray as fallback
      }
      
      const newPlayer: Player = {
        id: action.payload.id,
        name: action.payload.name,
        faction: action.payload.faction,
        gold: 0,
        units: 0,
        tiles: [],
        goldRate: 1, // Base rate
        unitRate: action.payload.faction === 'Aliens' ? 1 : 0, // Aliens start with base unit rate
        color,
        isReady: false,
        isEliminated: false,
      };
      
      return {
        ...state,
        players: [...state.players, newPlayer]
      };
      
    case 'TOGGLE_READY':
      return {
        ...state,
        players: state.players.map(player => 
          player.id === action.payload.playerId 
            ? { ...player, isReady: !player.isReady } 
            : player
        )
      };
      
    case 'START_GAME':
      if (state.players.length < 2 || !state.players.every(p => p.isReady)) {
        return state;
      }
      
      // Assign starting tiles to each player
      const startPositions: Array<{ x: number, y: number }> = [];
      const updatedPlayers = [...state.players];
      const newGrid = [...state.grid.map(row => [...row])];
      
      updatedPlayers.forEach(player => {
        const startPos = findRandomStartPosition(newGrid, startPositions);
        startPositions.push(startPos);
        
        // Update the grid
        newGrid[startPos.y][startPos.x] = {
          ...newGrid[startPos.y][startPos.x],
          owner: player.id,
          goldValue: 0,
          unitValue: 10, // Base defence value for starting tile (changed from 5)
        };
        
        // Update player's tiles
        player.tiles = [newGrid[startPos.y][startPos.x]];
      });
      
      return {
        ...state,
        isGameStarted: true,
        grid: newGrid,
        players: updatedPlayers,
      };
      
    case 'ANNEX_TILE':
      {
        const { playerId, x, y } = action.payload;
        const player = state.players.find(p => p.id === playerId);
        
        if (!player || state.grid[y][x].owner !== null) {
          return state;
        }
        
        // Check if the tile is adjacent to player's territory
        const hasAdjacentTile = [
          { x: x-1, y }, // Left
          { x: x+1, y }, // Right
          { x, y: y-1 }, // Up
          { x, y: y+1 }, // Down
        ].some(adj => 
          adj.x >= 0 && adj.x < GRID_SIZE && 
          adj.y >= 0 && adj.y < GRID_SIZE && 
          state.grid[adj.y][adj.x].owner === playerId
        );
        
        if (!hasAdjacentTile) {
          return state;
        }
        
        // Calculate base cost - scales with territory size
        // Base cost starts at 10 and increases by 1 for every 3 tiles owned
        const territorySize = player.tiles.length;
        const scaleFactor = Math.floor(territorySize / 3);
        const annexCost = Math.max(10, 10 + scaleFactor);
        
        // Check if player has enough gold
        if (player.gold < annexCost) {
          return state;
        }
        
        // Update the grid
        const newGrid = [...state.grid.map(row => [...row])];
        const updatedTile = {
          ...newGrid[y][x],
          owner: playerId,
          goldValue: 0,
          unitValue: 10, // Set base defence value to 10
        };
        
        newGrid[y][x] = updatedTile;
        
        // Update player
        const updatedPlayers = state.players.map(p => 
          p.id === playerId 
            ? { 
                ...p, 
                gold: p.gold - annexCost,
                tiles: [...p.tiles, updatedTile]
              } 
            : p
        );
        
        return {
          ...state,
          grid: newGrid,
          players: updatedPlayers,
        };
      }
      
    case 'BUILD_STRUCTURE':
      {
        const { x, y, structure } = action.payload;
        const tile = state.grid[y][x];
        
        if (!tile.owner) {
          return state;
        }
        
        const player = state.players.find(p => p.id === tile.owner);
        
        if (!player) {
          return state;
        }
        
        // Check if tile already has a structure
        if (tile.structure !== null) {
          return state;
        }
        
        // Cost to build structure (placeholder logic)
        const buildCost = 20;
        
        if (player.gold < buildCost) {
          return state;
        }
        
        // Update the grid
        const newGrid = [...state.grid.map(row => [...row])];
        newGrid[y][x] = {
          ...newGrid[y][x],
          structure,
          unitValue: structure.type === 'Defence' ? tile.unitValue + 40 : tile.unitValue, // Changed from +10 to +40
        };
        
        // Update player
        const updatedPlayers = state.players.map(p => 
          p.id === player.id 
            ? { 
                ...p, 
                gold: p.gold - buildCost,
                // Update rates based on structure type - Gold structures now produce 5 gold instead of 1
                goldRate: structure.type === 'Gold' ? p.goldRate + 5 : p.goldRate,
                unitRate: structure.type === 'Unit' ? p.unitRate + 1 : p.unitRate,
              } 
            : p
        );
        
        return {
          ...state,
          grid: newGrid,
          players: updatedPlayers,
        };
      }
      
    case 'DEMOLISH_STRUCTURE':
      {
        const { x, y } = action.payload;
        const tile = state.grid[y][x];
        
        if (!tile.owner || !tile.structure) {
          return state;
        }
        
        const player = state.players.find(p => p.id === tile.owner);
        
        if (!player) {
          return state;
        }
        
        // Update rates based on structure being demolished
        const updatedPlayers = state.players.map(p => {
          if (p.id === player.id) {
            let updatedGoldRate = p.goldRate;
            let updatedUnitRate = p.unitRate;
            
            if (tile.structure?.type === 'Gold') {
              // Gold structures produce 5 gold, so reduce by 5 when demolished
              updatedGoldRate -= 5;
            } else if (tile.structure?.type === 'Unit') {
              updatedUnitRate -= 1;
            }
            
            return { 
              ...p, 
              goldRate: updatedGoldRate,
              unitRate: updatedUnitRate,
            };
          }
          return p;
        });
        
        // Update the grid
        const newGrid = [...state.grid.map(row => [...row])];
        newGrid[y][x] = {
          ...newGrid[y][x],
          structure: null,
          unitValue: tile.structure.type === 'Defence' ? Math.max(10, tile.unitValue - 40) : tile.unitValue, // Changed from -10 to -40, with minimum of 10
        };
        
        return {
          ...state,
          grid: newGrid,
          players: updatedPlayers,
        };
      }
      
    case 'UPDATE_RESOURCES':
      {
        // Update resources as before
        const updatedPlayers = state.players.map(player => ({
          ...player,
          gold: player.gold + player.goldRate,
          units: player.units + player.unitRate,
        }));
        
        // If in solo mode, handle AI moves
        if (state.isSoloMode && state.isGameStarted && !state.isGameOver) {
          // Only proceed with AI moves if the game is in progress
          const aiPlayers = updatedPlayers.filter(p => p.id.startsWith('ai-') && !p.isEliminated);
          
          // For each AI player, decide on a move
          aiPlayers.forEach(aiPlayer => {
            // Different AI behavior based on difficulty
            const difficulty = state.difficulty || 'Medium';
            
            // Only make a move every few seconds to prevent overwhelming activity
            // Easy AI moves every 5 seconds, Medium every 3 seconds, Hard every 2 seconds
            const moveInterval = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 3 : 2;
            
            // Only make a move at the specified interval
            if (state.timeRemaining % moveInterval === 0) {
              makeAIMove(state, aiPlayer, difficulty);
            }
          });
        }
        
        return {
          ...state,
          players: updatedPlayers
        };
      }
      
    case 'TICK_TIMER':
      {
        if (state.timeRemaining <= 0) {
          // Find player with most tiles
          let maxTiles = -1;
          let winner: Player | null = null;
          
          state.players.forEach(player => {
            if (player.tiles.length > maxTiles) {
              maxTiles = player.tiles.length;
              winner = player;
            } else if (player.tiles.length === maxTiles) {
              // It's a tie - could implement tiebreakers
              winner = null;
            }
          });
          
          return {
            ...state,
            timeRemaining: 0,
            isGameOver: true,
            winner
          };
        }
        
        return {
          ...state,
          timeRemaining: state.timeRemaining - 1
        };
      }
      
    case 'OCCUPY_TILE':
      {
        const { playerId, x, y } = action.payload;
        const attackingPlayer = state.players.find(p => p.id === playerId);
        const tile = state.grid[y][x];
        
        if (!attackingPlayer || !tile.owner || tile.owner === playerId) {
          return state;
        }
        
        const defendingPlayer = state.players.find(p => p.id === tile.owner);
        
        if (!defendingPlayer) {
          return state;
        }
        
        // Check if attacker has adjacent tile
        const hasAdjacentTile = [
          { x: x-1, y }, // Left
          { x: x+1, y }, // Right
          { x, y: y-1 }, // Up
          { x, y: y+1 }, // Down
        ].some(adj => 
          adj.x >= 0 && adj.x < GRID_SIZE && 
          adj.y >= 0 && adj.y < GRID_SIZE && 
          state.grid[adj.y][adj.x].owner === playerId
        );
        
        if (!hasAdjacentTile) {
          return state;
        }
        
        // Check if attacker has enough gold and units
        const goldCost = tile.goldValue;
        const unitCost = tile.unitValue;
        
        if (attackingPlayer.gold < goldCost || attackingPlayer.units < unitCost) {
          return state;
        }
        
        // Update the grid
        const newGrid = [...state.grid.map(row => [...row])];
        const occupiedTile = {
          ...tile,
          owner: playerId,
          goldValue: 0,
          unitValue: 10, // Set base defence value to 10
        };
        
        newGrid[y][x] = occupiedTile;
        
        // Update players
        let updatedPlayers = state.players.map(p => {
          if (p.id === attackingPlayer.id) {
            return { 
              ...p, 
              gold: p.gold - goldCost,
              units: p.units - unitCost,
              tiles: [...p.tiles, occupiedTile]
            };
          }
          if (p.id === defendingPlayer.id) {
            const updatedTiles = p.tiles.filter(t => !(t.x === x && t.y === y));
            
            // Update rates if a structure was on the tile
            let updatedGoldRate = p.goldRate;
            let updatedUnitRate = p.unitRate;
            
            if (occupiedTile.structure?.type === 'Gold') {
              updatedGoldRate = Math.max(1, updatedGoldRate - 1);
            } else if (occupiedTile.structure?.type === 'Unit') {
              updatedUnitRate = Math.max(p.faction === 'Aliens' ? 1 : 0, updatedUnitRate - 1);
            }
            
            return { 
              ...p, 
              tiles: updatedTiles,
              goldRate: updatedGoldRate,
              unitRate: updatedUnitRate,
              isEliminated: updatedTiles.length === 0
            };
          }
          return p;
        });
        
        // Check if one player has been eliminated and if that results in game over
        const remainingPlayers = updatedPlayers.filter(p => !p.isEliminated);
        
        if (remainingPlayers.length === 1) {
          return {
            ...state,
            grid: newGrid,
            players: updatedPlayers,
            isGameOver: true,
            winner: remainingPlayers[0]
          };
        }
        
        return {
          ...state,
          grid: newGrid,
          players: updatedPlayers,
        };
      }
      
    case 'SET_SOLO_MODE':
      return {
        ...state,
        isSoloMode: action.payload.isSolo,
        difficulty: action.payload.difficulty
      };
      
    case 'ADD_AI_PLAYER':
      // Logic similar to ADD_PLAYER but for AI
      {
        if (state.players.length >= 3) {
          return state;
        }
        
        const aiId = `ai-${Math.random().toString(36).substr(2, 9)}`;
        const aiFaction = action.payload.faction;
        
        // Assign a color based on faction
        let color;
        switch (aiFaction) {
          case 'Humans':
            color = '#4169E1'; // Royal Blue
            break;
          case 'Robots':
            color = '#B22222'; // Firebrick Red
            break;
          case 'Aliens':
            color = '#228B22'; // Forest Green
            break;
          default:
            color = '#808080'; // Gray as fallback
        }
        
        const aiPlayer: Player = {
          id: aiId,
          name: `AI ${aiFaction}`,
          faction: aiFaction,
          gold: 0,
          units: 0,
          tiles: [],
          goldRate: 1, // Base rate
          unitRate: aiFaction === 'Aliens' ? 1 : 0, // Aliens start with base unit rate
          color,
          isReady: true, // AI is always ready
          isEliminated: false,
        };
        
        return {
          ...state,
          players: [...state.players, aiPlayer]
        };
      }
      
    case 'END_GAME':
      return {
        ...state,
        isGameOver: true,
        winner: action.payload.winner
      };
      
    case 'RESET_GAME':
      return initialState;
      
    case 'SET_PLAYERS':
      // Update players from the server
      return {
        ...state,
        players: action.payload.players.map(serverPlayer => {
          // Try to find existing player
          const existingPlayer = state.players.find(p => p.id === serverPlayer.id);
          
          // If we have this player already, merge data
          if (existingPlayer) {
            return {
              ...existingPlayer,
              ...serverPlayer,
            };
          }
          
          // Otherwise create a new player object with default values
          return {
            id: serverPlayer.id,
            name: serverPlayer.name,
            faction: serverPlayer.faction as Faction,
            gold: 0,
            units: 0,
            tiles: [],
            goldRate: 1,
            unitRate: serverPlayer.faction === 'Aliens' ? 1 : 0,
            color: serverPlayer.color,
            isReady: serverPlayer.isReady,
            isEliminated: false,
          };
        })
      };
      
    default:
      return state;
  }
};

// Create context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Store the dispatch function for AI moves
  store = { dispatch };
  
  // Resource update effect (runs every second when game is active)
  useEffect(() => {
    if (!state.isGameStarted || state.isGameOver) return;
    
    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_RESOURCES' });
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state.isGameStarted, state.isGameOver]);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for using game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Helper function to make AI moves
const makeAIMove = (state: GameState, aiPlayer: Player, difficulty: 'Easy' | 'Medium' | 'Hard') => {
  // Centralized dispatch function for AI moves
  const dispatch = (action: Action) => {
    // This will be captured in a closure and called by the effect
    window.setTimeout(() => {
      store.dispatch(action);
    }, Math.random() * 1000); // Add a small random delay for more natural feel
  };
  
  // 1. Try to build structures on existing tiles if we have enough gold
  if (Math.random() < 0.7) { // 70% chance to try building first
    const emptyTiles = aiPlayer.tiles.filter(tile => !tile.structure);
    
    if (emptyTiles.length > 0 && aiPlayer.gold >= 20) {
      // Select a random empty tile
      const tileIndex = Math.floor(Math.random() * emptyTiles.length);
      const tile = emptyTiles[tileIndex];
      
      // Decide which structure to build
      let structureType: StructureType;
      
      if (difficulty === 'Easy') {
        // Easy AI just builds randomly
        const types: StructureType[] = ['Gold', 'Unit', 'Defence'];
        structureType = types[Math.floor(Math.random() * types.length)];
      } else if (difficulty === 'Medium') {
        // Medium AI prefers Gold when it has few tiles, otherwise balances
        if (aiPlayer.tiles.length < 5 || Math.random() < 0.5) {
          structureType = 'Gold';
        } else if (Math.random() < 0.7) {
          structureType = 'Unit';
        } else {
          structureType = 'Defence';
        }
      } else {
        // Hard AI is strategic - focuses on gold early, units mid-game, and defense for valuable tiles
        if (aiPlayer.tiles.length < 5) {
          structureType = 'Gold'; // Early game: focus on economy
        } else if (aiPlayer.units < 20) {
          structureType = 'Unit'; // Mid game: build army
        } else {
          // Late game: balance between more units and defending key positions
          structureType = Math.random() < 0.7 ? 'Unit' : 'Defence';
        }
      }
      
      // Build the structure
      dispatch({
        type: 'BUILD_STRUCTURE',
        payload: {
          x: tile.x,
          y: tile.y,
          structure: STRUCTURES[aiPlayer.faction][structureType]
        }
      });
      
      return; // End turn after building
    }
  }
  
  // 2. Try to annex neutral tiles if we have enough gold
  if (aiPlayer.gold >= 10) {
    // Find all neutral tiles adjacent to our territory
    const adjacentNeutralTiles: {x: number, y: number}[] = [];
    
    aiPlayer.tiles.forEach(tile => {
      const adjacentPositions = [
        { x: tile.x - 1, y: tile.y }, // Left
        { x: tile.x + 1, y: tile.y }, // Right
        { x: tile.x, y: tile.y - 1 }, // Up
        { x: tile.x, y: tile.y + 1 }, // Down
      ];
      
      adjacentPositions.forEach(pos => {
        if (
          pos.x >= 0 && pos.x < GRID_SIZE &&
          pos.y >= 0 && pos.y < GRID_SIZE &&
          state.grid[pos.y][pos.x].owner === null &&
          !adjacentNeutralTiles.some(t => t.x === pos.x && t.y === pos.y)
        ) {
          adjacentNeutralTiles.push(pos);
        }
      });
    });
    
    if (adjacentNeutralTiles.length > 0) {
      // Choose which tile to annex based on difficulty
      let targetTile;
      
      if (difficulty === 'Easy') {
        // Easy AI chooses randomly
        targetTile = adjacentNeutralTiles[Math.floor(Math.random() * adjacentNeutralTiles.length)];
      } else {
        // Medium and Hard AIs try to be more strategic
        // TODO: Implement more complex logic for tile selection
        targetTile = adjacentNeutralTiles[Math.floor(Math.random() * adjacentNeutralTiles.length)];
      }
      
      dispatch({
        type: 'ANNEX_TILE',
        payload: {
          playerId: aiPlayer.id,
          x: targetTile.x,
          y: targetTile.y
        }
      });
      
      return; // End turn after annexing
    }
  }
  
  // 3. Try to attack enemy tiles if we have enough units and gold
  if (aiPlayer.units >= 5 && aiPlayer.gold >= 10) {
    // Only attack if we meet the aggression threshold for our difficulty
    const aggressionThreshold = difficulty === 'Easy' ? 0.3 : 
                              difficulty === 'Medium' ? 0.6 : 0.8;
    
    if (Math.random() < aggressionThreshold) {
      // Find all enemy tiles adjacent to our territory
      const adjacentEnemyTiles: {x: number, y: number, owner: string}[] = [];
      
      aiPlayer.tiles.forEach(tile => {
        const adjacentPositions = [
          { x: tile.x - 1, y: tile.y }, // Left
          { x: tile.x + 1, y: tile.y }, // Right
          { x: tile.x, y: tile.y - 1 }, // Up
          { x: tile.x, y: tile.y + 1 }, // Down
        ];
        
        adjacentPositions.forEach(pos => {
          if (
            pos.x >= 0 && pos.x < GRID_SIZE &&
            pos.y >= 0 && pos.y < GRID_SIZE &&
            state.grid[pos.y][pos.x].owner !== null &&
            state.grid[pos.y][pos.x].owner !== aiPlayer.id &&
            !adjacentEnemyTiles.some(t => t.x === pos.x && t.y === pos.y)
          ) {
            adjacentEnemyTiles.push({
              x: pos.x,
              y: pos.y,
              owner: state.grid[pos.y][pos.x].owner!
            });
          }
        });
      });
      
      if (adjacentEnemyTiles.length > 0) {
        // Check which enemy tiles we can actually afford to occupy
        const affordableTiles = adjacentEnemyTiles.filter(tile => {
          const targetTile = state.grid[tile.y][tile.x];
          return aiPlayer.gold >= targetTile.goldValue && aiPlayer.units >= targetTile.unitValue;
        });
        
        if (affordableTiles.length > 0) {
          // Choose which tile to attack
          let targetTile;
          
          if (difficulty === 'Easy') {
            // Easy AI chooses randomly from affordable tiles
            targetTile = affordableTiles[Math.floor(Math.random() * affordableTiles.length)];
          } else if (difficulty === 'Medium') {
            // Medium AI prefers tiles with no structures
            const tilesWithoutStructures = affordableTiles.filter(
              tile => !state.grid[tile.y][tile.x].structure
            );
            
            if (tilesWithoutStructures.length > 0) {
              targetTile = tilesWithoutStructures[Math.floor(Math.random() * tilesWithoutStructures.length)];
            } else {
              targetTile = affordableTiles[Math.floor(Math.random() * affordableTiles.length)];
            }
          } else {
            // Hard AI is strategic - targets valuable tiles or tries to eliminate players
            const humanPlayers = state.players.filter(p => !p.id.startsWith('ai-') && !p.isEliminated);
            
            // If a human player is close to elimination (has few tiles), focus on them
            const vulnerablePlayer = humanPlayers.find(p => p.tiles.length <= 3);
            
            if (vulnerablePlayer) {
              const tilesOwnedByVulnerable = affordableTiles.filter(
                tile => tile.owner === vulnerablePlayer.id
              );
              
              if (tilesOwnedByVulnerable.length > 0) {
                targetTile = tilesOwnedByVulnerable[Math.floor(Math.random() * tilesOwnedByVulnerable.length)];
              } else {
                targetTile = affordableTiles[Math.floor(Math.random() * affordableTiles.length)];
              }
            } else {
              // Otherwise, target tiles with Gold or Unit structures if possible
              const valuableTiles = affordableTiles.filter(
                tile => {
                  const structure = state.grid[tile.y][tile.x].structure;
                  return structure && (structure.type === 'Gold' || structure.type === 'Unit');
                }
              );
              
              if (valuableTiles.length > 0) {
                targetTile = valuableTiles[Math.floor(Math.random() * valuableTiles.length)];
              } else {
                targetTile = affordableTiles[Math.floor(Math.random() * affordableTiles.length)];
              }
            }
          }
          
          dispatch({
            type: 'OCCUPY_TILE',
            payload: {
              playerId: aiPlayer.id,
              x: targetTile.x,
              y: targetTile.y
            }
          });
          
          return; // End turn after attacking
        }
      }
    }
  }
  
  // If we got here, AI couldn't find a good move this turn
};

// Single instance of the store for AI move dispatching
let store: { dispatch: React.Dispatch<Action> } = { dispatch: () => {} }; 