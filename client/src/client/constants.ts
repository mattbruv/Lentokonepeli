import { Terrain } from "dogfight-types/Terrain";

export const VIEW_WIDTH = 740;
export const VIEW_HEIGHT = 660;
// 510 hardcoded bg, plus 150 UI height, 660 total height?

export enum DrawLayer {
  Sky = -999,
  Hill = -120,
  Water = -100,
  Flag = -70,
  ControlTower = -60,
  Ground = -50,
  RunwayBack = -10,
  LightSmoke = -7,
  Plane = -5,
  DarkSmoke = -3,
  Bunker = -1,
  Runway = 0,
  Man = 5,
  Explosion = 50,
  Bomb = 60,
  Bullet = 69,
  Player = 100,
}

export const enum WaterColor {
  NORMAL = 3051728,
  DESERT = 2344139,
}

export const TERRAIN_WATER_COLOR: Record<Terrain, WaterColor> = {
  Normal: WaterColor.NORMAL,
  Desert: WaterColor.DESERT,
};

export const SKY_COLOR = 14540287;

export enum TeamColor {
  OwnForeground = 0x0000ff, // blue
  OwnBackground = 0x8ecbff,
  OpponentForeground = 0xff0000, // red
  OpponentBackground = 0xffb574,
  SpectatorForeground = 0x000000,
  SpectatorBackground = 0xffffff,
  UnchosenForeground = 0x000000,
  UnchosenBackground = 0xffffff,
}