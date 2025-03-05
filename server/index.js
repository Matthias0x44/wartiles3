import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get port from environment variable with fallback
const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist')));

// Always return the main index.html for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Set up logging
const logDebug = (...args) => {
  console.log(`[${new Date().toISOString()}] [DEBUG]`, ...args);
};

const logInfo = (...args) => {
  console.log(`[${new Date().toISOString()}] [INFO]`, ...args);
};

const logError = (...args) => {
  console.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
};

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your domain
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true, // Added for compatibility
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000, // Increase ping interval
});

// Store active games
const activeGames = new Map();

// Store players by socket id
const players = new Map();

// Store player to game mapping
const playerGameMap = new Map();

io.on('connection', (socket) => {
  logInfo(`User connected: ${socket.id} (transport: ${socket.conn.transport.name})`);
  
  // Check if the player was in a game before and try to reconnect them
  socket.on('reconnect_to_game', (data) => {
    const { playerId, gameId } = data;
    logInfo(`Player ${playerId} attempting to reconnect to game ${gameId}`);
    
    const game = activeGames.get(gameId);
    if (game) {
      // Update player's socket id in the game
      const playerIndex = game.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        logInfo(`Reconnecting player ${playerId} to game ${gameId}`);
        
        // Update player's socket id
        game.players[playerIndex].id = socket.id;
        
        // Update player's info in our maps
        const playerInfo = players.get(playerId);
        if (playerInfo) {
          playerInfo.id = socket.id;
          players.delete(playerId);
          players.set(socket.id, playerInfo);
        }
        
        // Update player game mapping
        playerGameMap.delete(playerId);
        playerGameMap.set(socket.id, gameId);
        
        // Add socket to game room
        socket.join(gameId);
        
        // Send current game state to reconnected player
        socket.emit('game_state_update', { gameId, state: game.state });
        
        // Notify other players
        socket.to(gameId).emit('player_reconnected', { 
          oldId: playerId, 
          newId: socket.id,
          players: game.players
        });
      } else {
        logInfo(`Player ${playerId} not found in game ${gameId}`);
        socket.emit('reconnect_failed', { message: 'Player not found in this game' });
      }
    } else {
      logInfo(`Game ${gameId} not found for reconnection`);
      socket.emit('reconnect_failed', { message: 'Game not found' });
    }
  });
  
  // Handle player joining a game lobby
  socket.on('join_lobby', (data) => {
    const { playerName, faction } = data;
    const playerId = socket.id;
    
    logInfo(`Player ${playerName} attempting to join lobby as ${faction}`);
    
    // Create player
    const player = {
      id: playerId,
      name: playerName,
      faction: faction,
      isReady: false,
      color: getFactionColor(faction)
    };
    
    // Store player
    players.set(playerId, player);
    
    // Join the lobby room
    socket.join('lobby');
    
    // Get all players in the lobby
    const lobbyPlayers = Array.from(players.values());
    
    // Broadcast updated player list to all in lobby
    io.to('lobby').emit('lobby_update', { players: lobbyPlayers });
    
    logInfo(`${playerName} joined the lobby as ${faction}. Total players in lobby: ${lobbyPlayers.length}`);
    logInfo(`Current lobby players: ${JSON.stringify(lobbyPlayers.map(p => p.name))}`);
  });
  
  // Add a ping handler to check if connection is alive
  socket.on('ping', () => {
    logDebug(`Received ping from ${socket.id}`);
    socket.emit('pong');
  });
  
  // Log when client connects to different namespaces
  socket.use(([event, ...args], next) => {
    logDebug(`Socket ${socket.id} event: ${event}`, JSON.stringify(args));
    next();
  });
  
  // Handle player ready status toggle
  socket.on('toggle_ready', () => {
    const player = players.get(socket.id);
    if (player) {
      player.isReady = !player.isReady;
      players.set(socket.id, player);
      
      // Broadcast updated player list
      const lobbyPlayers = Array.from(players.values());
      io.to('lobby').emit('lobby_update', { players: lobbyPlayers });
      
      logInfo(`${player.name} is ${player.isReady ? 'ready' : 'not ready'}`);
    }
  });
  
  // Handle game start
  socket.on('start_game', () => {
    // Check if all players are ready
    const lobbyPlayers = Array.from(players.values());
    const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every(p => p.isReady);
    
    logInfo(`Start game requested by ${socket.id}, all players ready: ${allReady}`);
    
    if (allReady) {
      // Create a unique game ID
      const gameId = 'game-' + Date.now();
      
      // Create initial game state
      const initialState = createInitialGameState(lobbyPlayers);
      
      // Add all players to the game
      activeGames.set(gameId, {
        id: gameId,
        players: lobbyPlayers,
        state: initialState,
        createdAt: Date.now()
      });
      
      // Store player to game mapping
      lobbyPlayers.forEach(player => {
        playerGameMap.set(player.id, gameId);
      });
      
      // Move all players from lobby to game room
      lobbyPlayers.forEach(player => {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.leave('lobby');
          playerSocket.join(gameId);
        }
      });
      
      // Notify all players the game has started
      io.to(gameId).emit('game_started', { 
        gameId, 
        players: lobbyPlayers,
        state: initialState
      });
      
      logInfo(`Game ${gameId} started with ${lobbyPlayers.length} players`);
      logInfo(`Initial game state: ${JSON.stringify(initialState)}`);
    } else {
      // Notify the player that not everyone is ready
      socket.emit('game_start_failed', { message: 'Not all players are ready' });
      logInfo('Game start failed: Not all players are ready');
    }
  });
  
  // Handle game actions
  socket.on('game_action', (data) => {
    const { gameId, action } = data;
    const game = activeGames.get(gameId);
    
    if (!game) {
      logError(`Game action received for non-existent game: ${gameId}`);
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    logInfo(`Game ${gameId} action received: ${action.type} from player ${socket.id}`);
    
    try {
      // Update game state based on action
      const updatedState = updateGameState(game, action);
      game.state = updatedState;
      
      // Broadcast updated game state to all players EXCEPT the sender
      socket.to(gameId).emit('game_update', { 
        type: action.type,
        state: updatedState, 
        action: action
      });
      
      // Send acknowledgment to the sender
      socket.emit('action_processed', { 
        success: true, 
        type: action.type,
        state: updatedState 
      });
      
      logInfo(`Game ${gameId} state updated after action: ${action.type}`);
      
      // Check for game end conditions
      if (updatedState.isGameOver) {
        endGame(game);
      }
    } catch (error) {
      logError(`Error processing game action: ${error.message}`);
      socket.emit('action_failed', { 
        message: 'Failed to process action', 
        error: error.message 
      });
    }
  });
  
  // Handle player disconnect
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    
    if (player) {
      logInfo(`Player disconnected: ${player.name} (${socket.id})`);
      
      // Store player info for potential reconnections
      const playerInfo = { ...player };
      
      // Remove from active players
      players.delete(socket.id);
      
      // Update lobby if player was there
      const lobbyPlayers = Array.from(players.values());
      io.to('lobby').emit('lobby_update', { players: lobbyPlayers });
      
      // Check if player was in a game
      const gameId = playerGameMap.get(socket.id);
      if (gameId) {
        const game = activeGames.get(gameId);
        
        if (game) {
          logInfo(`Player ${player.name} disconnected from game ${gameId}`);
          
          // Don't remove player from game immediately, wait for potential reconnection
          // Instead, mark them as disconnected
          const playerIndex = game.players.findIndex(p => p.id === socket.id);
          if (playerIndex !== -1) {
            game.players[playerIndex].disconnected = true;
            game.players[playerIndex].disconnectedAt = Date.now();
            
            // Notify remaining players
            io.to(gameId).emit('player_disconnected', { 
              playerId: socket.id,
              playerName: player.name,
              players: game.players
            });
            
            // Start a timer to remove player if they don't reconnect
            setTimeout(() => {
              const updatedGame = activeGames.get(gameId);
              if (updatedGame) {
                const playerStillDisconnected = updatedGame.players.find(
                  p => p.id === socket.id && p.disconnected
                );
                
                if (playerStillDisconnected) {
                  logInfo(`Player ${player.name} didn't reconnect, removing from game ${gameId}`);
                  
                  // Remove player from game
                  updatedGame.players = updatedGame.players.filter(p => p.id !== socket.id);
                  
                  if (updatedGame.players.length === 0) {
                    // If no players left, remove the game
                    activeGames.delete(gameId);
                    logInfo(`Game ${gameId} ended - no players left`);
                  } else {
                    // Notify remaining players
                    io.to(gameId).emit('player_left', { 
                      playerId: socket.id,
                      playerName: player.name,
                      players: updatedGame.players
                    });
                  }
                }
              }
            }, 60000); // Wait 1 minute for reconnection
          }
        }
      }
    }
    
    logInfo(`User disconnected: ${socket.id}`);
  });
});

// Helper functions
function getFactionColor(faction) {
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
}

function createInitialGameState(players) {
  // Create initial game state with random starting positions for each player
  return {
    // Basic game state structure - would need to be expanded
    gridSize: 25,
    players: players,
    grid: createEmptyGrid(25, players),
    isGameStarted: true,
    isGameOver: false,
    currentPlayerId: players[0].id,
    timeRemaining: 300, // 5 minutes in seconds
    gameId: 'game-' + Date.now(), // Add game ID to state
  };
}

function createEmptyGrid(size, players) {
  // Create empty grid
  const grid = Array(size).fill(null).map((_, y) => 
    Array(size).fill(null).map((_, x) => ({
      x,
      y,
      owner: null,
      structure: null,
      goldValue: 10,
      unitValue: 0,
    }))
  );
  
  // Assign random starting positions for each player
  players.forEach(player => {
    let assigned = false;
    while (!assigned) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      
      // Check if position is free
      if (grid[y][x].owner === null) {
        grid[y][x].owner = player.id;
        grid[y][x].unitValue = 10; // Set initial defense value
        assigned = true;
        
        logInfo(`Player ${player.name} assigned starting position at (${x}, ${y})`);
      }
    }
  });
  
  return grid;
}

function updateGameState(game, action) {
  // Clone the current state to avoid direct mutations
  const state = JSON.parse(JSON.stringify(game.state));
  
  // Implement game logic based on action
  switch (action.type) {
    case 'ANNEX_TILE':
      // Logic for annexing a tile
      logInfo(`Processing ANNEX_TILE action: ${JSON.stringify(action.payload)}`);
      annexTile(state, action.payload);
      break;
      
    case 'BUILD_STRUCTURE':
      // Logic for building a structure
      logInfo(`Processing BUILD_STRUCTURE action: ${JSON.stringify(action.payload)}`);
      buildStructure(state, action.payload);
      break;
      
    case 'TICK_TIMER':
      // Update game timer
      state.timeRemaining--;
      if (state.timeRemaining <= 0) {
        state.isGameOver = true;
      }
      break;
      
    case 'OCCUPY_TILE':
      // Logic for occupying an opponent's tile
      logInfo(`Processing OCCUPY_TILE action: ${JSON.stringify(action.payload)}`);
      occupyTile(state, action.payload);
      break;
      
    // Add other action types as needed
    default:
      logInfo(`Unknown action type: ${action.type}`);
  }
  
  return state;
}

// Helper functions for specific game actions
function annexTile(state, payload) {
  const { playerId, x, y } = payload;
  
  // Validate action
  if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) {
    throw new Error('Invalid tile coordinates');
  }
  
  if (state.grid[y][x].owner !== null) {
    throw new Error('Tile already owned');
  }
  
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }
  
  // Set the owner of the tile
  state.grid[y][x].owner = playerId;
  state.grid[y][x].unitValue = 10; // Base defense value
  
  logInfo(`Player ${player.name} annexed tile at (${x}, ${y})`);
  
  return state;
}

function buildStructure(state, payload) {
  const { playerId, x, y, structure } = payload;
  
  // Validate action
  if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) {
    throw new Error('Invalid tile coordinates');
  }
  
  const tile = state.grid[y][x];
  if (tile.owner !== playerId) {
    throw new Error('Tile not owned by player');
  }
  
  if (tile.structure !== null) {
    throw new Error('Tile already has a structure');
  }
  
  // Build the structure
  state.grid[y][x].structure = structure;
  
  // Adjust unit value if it's a defense structure
  if (structure.type === 'Defence') {
    state.grid[y][x].unitValue += 40;
  }
  
  logInfo(`Player ${playerId} built ${structure.type} at (${x}, ${y})`);
  
  return state;
}

function occupyTile(state, payload) {
  const { playerId, x, y } = payload;
  
  // Validate action
  if (x < 0 || x >= state.gridSize || y < 0 || y >= state.gridSize) {
    throw new Error('Invalid tile coordinates');
  }
  
  const tile = state.grid[y][x];
  if (tile.owner === null || tile.owner === playerId) {
    throw new Error('Invalid occupation target');
  }
  
  // Occupy the tile
  const previousOwner = tile.owner;
  state.grid[y][x].owner = playerId;
  state.grid[y][x].unitValue = 10; // Reset defense value
  
  // Remove the structure if there was one
  if (tile.structure !== null) {
    state.grid[y][x].structure = null;
  }
  
  logInfo(`Player ${playerId} occupied tile at (${x}, ${y}) from player ${previousOwner}`);
  
  return state;
}

function endGame(game) {
  // Determine winner
  game.state.isGameOver = true;
  
  // Find player with most tiles
  const tileCounts = {};
  game.state.grid.flat().forEach(tile => {
    if (tile.owner) {
      tileCounts[tile.owner] = (tileCounts[tile.owner] || 0) + 1;
    }
  });
  
  let maxTiles = 0;
  let winnerId = null;
  
  Object.entries(tileCounts).forEach(([playerId, count]) => {
    if (count > maxTiles) {
      maxTiles = count;
      winnerId = playerId;
    }
  });
  
  const winner = game.players.find(p => p.id === winnerId) || null;
  game.state.winner = winner;
  
  // Notify all players
  io.to(game.id).emit('game_over', { 
    winner: winner,
    state: game.state
  });
  
  logInfo(`Game ${game.id} ended. Winner: ${winner ? winner.name : 'None'}`);
}

// Start server
server.listen(PORT, () => {
  logInfo(`Server running on port ${PORT}`);
  logInfo(`Socket.io server ready for connections`);
}); 