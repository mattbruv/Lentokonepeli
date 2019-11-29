export const PANEL_HEIGHT = 150;

export const WAVE_PHASE_TIME = 200; // Milliseconds

export enum DrawLayer {
  Water = -100,
  Flag = -70,
  Ground = -50,
  Runway = 0,
  RunwayBack = -1
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
