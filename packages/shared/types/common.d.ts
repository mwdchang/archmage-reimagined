import { allowedMagicList } from "../src/common.ts";

export type AllowedMagic = typeof allowedMagicList[number];

export interface ServerClock {
  interval: number;

  currentTurn: number,
  currentTurnTime: number,

  startTime: number,
  endTurn: number
}

export interface MageRank {
  id: number;
  name: string;
  magic: string;
  forts: number;
  land: number;
  status: string;
  netPower: number;
  rank: number;
}

// Default settings
export interface GameTable {
  explorationLimit: number
  maxTurns: number;
  turnRate: number;
  itemGenerationRate: number;

  war: {
    obfuscateReport: boolean,
    damagedPercentage: number,
    range: {
      min: number;
      max: number;
    },
  },

  blackmarket: {
    minimum: number;
    commission: number;
    priceIncreaseFactor: number;
    priceDecreaseFactor: number;
  }
}


export interface ChronicleTurn {
  id: number;
  name: string,
  turn: number;
  timestamp: number;
  // FIXME: string for now, maybe structured
  data: any[]; 
}


export interface GameMsg {
  type: string,
  message: string,
}


export interface Mail {
  id: string;
  type: 'market' | 'guild' | 'normal';
  priority: number;
  timestamp: number;

  source: number;
  target: number;

  subject: string;
  content: string;
  read: boolean;
}
