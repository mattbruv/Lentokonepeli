import { Terrain } from "dogfight-types/Terrain";

export const VIEW_WIDTH = 740;
export const VIEW_HEIGHT = 550;
export const HUD_HEIGHT = 150;
export const GAME_HEIGHT = VIEW_HEIGHT - HUD_HEIGHT;

export const DrawLayer = {
    Sky: 0,
    Hill: 1,
    Flag: 2,
    ControlTower: 2,
    Ground: 3,
    RunwayBack: 4,
    DestroyedBuilding: 4,
    Plane: 5,
    Man: 5,
    Water: 6,
    Smoke: 6,
    Bullet: 6,
    Bomb: 6,
    Explosion: 6,
    Runway: 6,
    Coast: 7,
    Name: 7,
    Bunker: 8,
} as const;

export const enum WaterColor {
    NORMAL = 3051728,
    DESERT = 2344139,
}

export const TERRAIN_WATER_COLOR: Record<Terrain, WaterColor> = {
    Normal: WaterColor.NORMAL,
    Desert: WaterColor.DESERT,
};

export const SKY_COLOR = 14540287;

export const TeamColor = {
    OwnForeground: 0x0000ff, // blue
    OwnBackground: 0x8ecbff,
    OpponentForeground: 0xff0000, // red
    OpponentBackground: 0xffb574,
    SpectatorForeground: 0x000000,
    SpectatorBackground: 0xffffff,
    UnchosenForeground: 0x000000,
    UnchosenBackground: 0xffffff,
} as const;

export type TeamColor = (typeof TeamColor)[keyof typeof TeamColor];
