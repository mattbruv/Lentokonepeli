import { Terrain } from "dogfight-types/Terrain";

export const VIEW_WIDTH = 740;
export const VIEW_HEIGHT = 660;
// 510 hardcoded bg, plus 150 UI height, 660 total height?
/**
 * Entities defined last are drawn in front of entities defined before them
 */
const ENTITY_Z_INDEX_ORDER = [
    "Sky",
    "Hill",
    "Flag",
    "ControlTower",
    "Ground",
    "RunwayBack",
    "LightSmoke",
    "Plane",
    "Water",
    "DarkSmoke",
    "Bunker",
    "Runway",
    "Man",
    "Explosion",
    "Bomb",
    "Bullet",
    "Player",
] as const;

export const DrawLayer = Object.fromEntries(ENTITY_Z_INDEX_ORDER.map((entity, i) => [entity, i])) as Record<
    (typeof ENTITY_Z_INDEX_ORDER)[number],
    number
>;

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
