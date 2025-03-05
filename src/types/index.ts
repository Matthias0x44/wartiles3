export type Faction = 'Humans' | 'Robots' | 'Aliens';

export type StructureType = 'Gold' | 'Unit' | 'Defence';

export interface Structure {
  type: StructureType;
  name: string;
  symbol: string;
  description: string;
}

export interface Tile {
  x: number;
  y: number;
  owner: string | null;
  structure: Structure | null;
  goldValue: number;
  unitValue: number;
}

export interface Player {
  id: string;
  name: string;
  faction: Faction;
  gold: number;
  units: number;
  tiles: Tile[];
  goldRate: number;
  unitRate: number;
  color: string;
  isReady: boolean;
  isEliminated: boolean;
}

export interface GameState {
  players: Player[];
  grid: Tile[][];
  timeRemaining: number;
  isGameStarted: boolean;
  isGameOver: boolean;
  winner: Player | null;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  isSoloMode: boolean;
}

export const GRID_SIZE = 25;
export const GAME_DURATION = 5 * 60; // 5 minutes in seconds
export const MIN_DISTANCE = 10; // Minimum distance between player starting tiles

export const STRUCTURES: Record<Faction, Record<StructureType, Structure>> = {
  Humans: {
    Gold: { type: 'Gold', name: 'Farm', symbol: 'G', description: 'Generates gold over time' },
    Unit: { type: 'Unit', name: 'Barracks', symbol: 'U', description: 'Generates units over time' },
    Defence: { type: 'Defence', name: 'Fort', symbol: 'D', description: 'Increases defence of the tile' }
  },
  Robots: {
    Gold: { type: 'Gold', name: 'Network', symbol: 'G', description: 'Generates gold over time' },
    Unit: { type: 'Unit', name: 'Factory', symbol: 'U', description: 'Generates units over time' },
    Defence: { type: 'Defence', name: 'Autoturret', symbol: 'D', description: 'Increases defence of the tile' }
  },
  Aliens: {
    Gold: { type: 'Gold', name: 'Hive', symbol: 'G', description: 'Generates gold over time' },
    Unit: { type: 'Unit', name: 'Nest', symbol: 'U', description: 'Generates units over time' },
    Defence: { type: 'Defence', name: 'Biowall', symbol: 'D', description: 'Increases defence of the tile' }
  }
}; 