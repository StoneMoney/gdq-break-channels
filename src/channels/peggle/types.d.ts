export type Level = {
  id: number;
  name: string;
  balls: number;
  pegs: Peg[];
  solids: Solid[];
  score: number;
  background: string;
  par: number;
} 
export type Peg = {
  id: number;
  x: number;
  y: number;
  shape: string;
  rotation: 0;
  colorLock: string|null;
  cleared: boolean;
}
export type Solid = {
  id: number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number|null;
  restitution: number|null;
  tag: string|null;
  texture: string|null;
  color: string|null;
}
export type Save = {
  level: number;
  previousLevel: number|null;
  score: number;
  pegsCleared: number[];
  version: number;
}