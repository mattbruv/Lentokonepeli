import { Team } from "dogfight-types/Team";

// These all should come automatically generated

export const TimeWinnerDefinitions = {
    centrals: "Centrals",
    allies: "Allies",
    no: "None",
} satisfies Record<Lowercase<Team> | "no", string>;

export const LayoutPieceDefinitions = {
    ".": "Air",
    "#": "Ground (Terrain: Normal)",
    _: "Ground (Terrain: Desert)",
    H: "Hill (Terrain: Normal)",
    S: "Hill (Terrain: Desert)",
    ">": "Coast (Terrain: Normal, Facing: Right)",
    "<": "Coast (Terrain: Normal, Facing: Left)",
    "[": "Coast (Terrain: Desert, Facing: Left)",
    "]": "Coast (Terrain: Desert, Facing: Right)",
    L: "Runway (Team: Centrals, Facing: Left)",
    R: "Runway (Team: Centrals, Facing: Right)",
    l: "Runway (Team: Allies, Facing: Left)",
    r: "Runway (Team: Allies, Facing: Right)",
    P: "PalmTree (Facing: Right)",
    p: "PalmTree (Facing: Left)",
    t: "ControlTower (Facing: Left)",
    T: "ControlTower (Facing: Right)",
    d: "DesertTower (Facing: Left)",
    D: "DesertTower (Facing: Right)",
    f: "FlagAllies (Facing: Right)",
    F: "FlagCentrals (Facing: Right)",
    I: "Bunker (Team: Centrals)",
    i: "Bunker (Team: Allies)",
    "/": "Water (Terrain: Normal, Facing: Left)",
    "\\": "Water (Terrain: Normal, Facing: Right)",
    "(": "Water (Terrain: Desert, Facing: Left)",
    ")": "Water (Terrain: Desert, Facing: Right)",
} as const;

export type LayoutPiece = keyof typeof LayoutPieceDefinitions;
export type TimeWinner = keyof typeof TimeWinnerDefinitions;

export const KNOWN_LAYOUT_PIECES = Object.keys(LayoutPieceDefinitions).sort(
    (a, b) => b.length - a.length,
) as LayoutPiece[];
export const KNOWN_TIME_WINNERS = Object.keys(TimeWinnerDefinitions) as TimeWinner[];
