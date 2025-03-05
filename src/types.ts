// Import or define the Player and Tile types
export interface Player {
  id: string;
  name: string;
  faction: string;
  isReady: boolean;
  resources: {
    food: number;
    wood: number;
    stone: number;
    gold: number;
  };
  isAI?: boolean;
}

export interface Tile {
  id: string;
  type: string;
  x: number;
  y: number;
  ownerId?: string;
  unitCount?: number;
}

// Game constants
export const GRID_SIZE = 20;
export const GAME_DURATION = 600; // 10 minutes in seconds
export const MIN_DISTANCE = 6; // Minimum distance between players' starting positions

// Structure types
export enum StructureType {
  BASE = 'BASE',
  FARM = 'FARM',
  LUMBER_CAMP = 'LUMBER_CAMP',
  QUARRY = 'QUARRY',
  GOLD_MINE = 'GOLD_MINE',
  BARRACKS = 'BARRACKS'
}

export interface Structure {
  type: StructureType;
  cost: {
    food: number;
    wood: number;
    stone: number;
    gold: number;
  };
  production?: {
    resource: 'food' | 'wood' | 'stone' | 'gold';
    amount: number;
  };
}

// Available structures
export const STRUCTURES: Record<StructureType, Structure> = {
  [StructureType.BASE]: {
    type: StructureType.BASE,
    cost: { food: 0, wood: 0, stone: 0, gold: 0 }
  },
  [StructureType.FARM]: {
    type: StructureType.FARM,
    cost: { food: 0, wood: 50, stone: 0, gold: 0 },
    production: { resource: 'food', amount: 10 }
  },
  [StructureType.LUMBER_CAMP]: {
    type: StructureType.LUMBER_CAMP,
    cost: { food: 50, wood: 0, stone: 0, gold: 0 },
    production: { resource: 'wood', amount: 10 }
  },
  [StructureType.QUARRY]: {
    type: StructureType.QUARRY,
    cost: { food: 50, wood: 50, stone: 0, gold: 0 },
    production: { resource: 'stone', amount: 10 }
  },
  [StructureType.GOLD_MINE]: {
    type: StructureType.GOLD_MINE,
    cost: { food: 50, wood: 50, stone: 50, gold: 0 },
    production: { resource: 'gold', amount: 10 }
  },
  [StructureType.BARRACKS]: {
    type: StructureType.BARRACKS,
    cost: { food: 100, wood: 100, stone: 50, gold: 50 }
  }
};

// Faction type
export enum Faction {
  WARRIORS = 'Warriors',
  NOMADS = 'Nomads',
  EMPIRE = 'Empire',
  UNDEAD = 'Undead'
}

// Add the gameId to the GameState interface to track multiplayer games
export interface GameState {
  players: Player[];
  grid: Tile[][];
  timeRemaining: number;
  isGameStarted: boolean;
  isGameOver: boolean;
  winner: Player | null;
  isSoloMode: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  gameId?: string; // Optional game ID for multiplayer games
} 