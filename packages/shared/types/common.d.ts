import { allowedMagicList } from "../src/common.ts";

export type AllowedMagic = typeof allowedMagicList[number];

export interface ServerClock {
  interval: number;

  currentTurn: number,
  currentTurnTime: number,
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

  war: {
    range: {
      min: number;
      max: number;
    }
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

