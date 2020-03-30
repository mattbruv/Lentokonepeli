export const PANEL_HEIGHT = 150;

export const WAVE_PHASE_TIME = 200; // Milliseconds

export enum DrawLayer {
  Hill = -120,
  Water = -100,
  Flag = -70,
  ControlTower = -60,
  Ground = -50,
  RunwayBack = -10,
  LightSmoke = -7,
  Plane = -5,
  DarkSmoke = -3,
  Runway = 0,
  Trooper = 5,
  Player = 100
}

export enum GameScreen {
  Width = 740,
  Height = 565
}

export enum TeamColor {
  OwnForeground = 0x0000ff, // blue
  OwnBackground = 0x8ecbff,
  OpponentForeground = 0xff0000, // red
  OpponentBackground = 0xffb574,
  SpectatorForeground = 0x000000,
  SpectatorBackground = 0xffffff
}

export enum WaterColor {
  Normal = 0x2e90d0,
  Desert = 0x23c4cb
}
