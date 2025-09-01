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


export interface ChronicleTurn {
  id: number;
  name: string,
  turn: number;
  timestamp: number;
  // FIXME: string for now, maybe structured
  data: any[]; 
}
