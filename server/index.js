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

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your domain
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true // Added for compatibility
});

// Store active games
const activeGames = new Map();

// Store players by socket id
const players = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (transport: ${socket.conn.transport.name})`);
  
  // Handle player joining a game lobby
  socket.on('join_lobby', (data) => {
    const { playerName, faction } = data;
    const playerId = socket.id;
    
    console.log(`Player ${playerName} attempting to join lobby as ${faction}`);
    
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
    
    console.log(`${playerName} joined the lobby as ${faction}. Total players in lobby: ${lobbyPlayers.length}`);
    console.log(`Current lobby players: ${JSON.stringify(lobbyPlayers.map(p => p.name))}`);
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
      
      console.log(`${player.name} is ${player.isReady ? 'ready' : 'not ready'}`);
    }
  });
  
  // Handle game start
  socket.on('start_game', () => {
    // Check if all players are ready
    const lobbyPlayers = Array.from(players.values());
    const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every(p => p.isReady);
    
    if (allReady) {
      // Create a unique game ID
      const gameId = 'game-' + Date.now();
      
      // Add all players to the game
      activeGames.set(gameId, {
        id: gameId,
        players: lobbyPlayers,
        state: createInitialGameState(lobbyPlayers)
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
        state: activeGames.get(gameId).state
      });
      
      console.log(`Game ${gameId} started with ${lobbyPlayers.length} players`);
    }
  });
  
  // Handle game actions
  socket.on('game_action', (data) => {
    const { gameId, action } = data;
    const game = activeGames.get(gameId);
    
    if (game) {
      // Update game state based on action
      // This would implement your game logic
      updateGameState(game, action);
      
      // Broadcast updated game state to all players
      io.to(gameId).emit('game_update', { state: game.state });
      
      console.log(`Game ${gameId} action: ${action.type}`);
    }
  });
  
  // Handle player disconnect
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    
    if (player) {
      console.log(`Player disconnected: ${player.name}`);
      players.delete(socket.id);
      
      // Update lobby if player was there
      const lobbyPlayers = Array.from(players.values());
      io.to('lobby').emit('lobby_update', { players: lobbyPlayers });
      
      // Check if player was in a game
      activeGames.forEach((game, gameId) => {
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== -1) {
          // Remove player from game
          game.players.splice(playerIndex, 1);
          
          if (game.players.length === 0) {
            // If no players left, remove the game
            activeGames.delete(gameId);
            console.log(`Game ${gameId} ended - no players left`);
          } else {
            // Notify remaining players
            io.to(gameId).emit('player_left', { 
              playerId: socket.id,
              players: game.players,
              state: game.state
            });
          }
        }
      });
    }
    
    console.log(`User disconnected: ${socket.id}`);
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
  // This would implement your game initialization logic
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
        assigned = true;
      }
    }
  });
  
  return grid;
}

function updateGameState(game, action) {
  // Implement game logic based on action
  switch (action.type) {
    case 'ANNEX_TILE':
      // Logic for annexing a tile
      break;
    case 'BUILD_STRUCTURE':
      // Logic for building a structure
      break;
    case 'TICK_TIMER':
      // Update game timer
      game.state.timeRemaining--;
      if (game.state.timeRemaining <= 0) {
        endGame(game);
      }
      break;
    // Add other action types as needed
  }
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
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready for connections`);
}); 