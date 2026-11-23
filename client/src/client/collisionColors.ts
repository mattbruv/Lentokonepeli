import { DebugEntity } from "dogfight-types/DebugEntity";
import { Team } from "dogfight-types/Team";

export const TEAM_COLLISION_KINDS = ["Plane", "Man", "Bullet", "Bomb", "Explosion", "Runway", "Bunker"] as const;
export type TeamCollisionKind = (typeof TEAM_COLLISION_KINDS)[number];

export const TERRAIN_COLLISION_KINDS = ["Ground", "Water", "Coast", "LandingZone"] as const;
export type TerrainCollisionKind = (typeof TERRAIN_COLLISION_KINDS)[number];

export const TEAM_COLLISION_COLORS: Record<TeamCollisionKind, Record<Team, string>> = {
    Plane: { Centrals: "#ff1f1f", Allies: "#1a3cff" },
    Man: { Centrals: "#ff9f1a", Allies: "#a64dff" },
    Bullet: { Centrals: "#ffe600", Allies: "#000000" },
    Bomb: { Centrals: "#7a0000", Allies: "#007a7a" },
    Explosion: { Centrals: "#ff5ca8", Allies: "#7fe3ff" },
    Runway: { Centrals: "#ff6a00", Allies: "#3d7bff" },
    Bunker: { Centrals: "#b8860b", Allies: "#5e35b1" },
};

export const TERRAIN_COLLISION_COLORS: Record<TerrainCollisionKind, string> = {
    Ground: "#39ff14",
    Water: "#00ffd0",
    Coast: "#ffffff",
    LandingZone: "#ff00ff",
};

export const NEUTRAL_COLLISION_COLOR = "#9e9e9e";

export const ABANDONED_PLANE_COLLISION_COLOR = "#3a3a3a";

export const TERRAIN_COLLISION_ALPHA = 0.7;

export function collisionColor(entry: DebugEntity): string {
    const type = entry.ent_type.type;
    if (type === "Runway" && !entry.pixels) return TERRAIN_COLLISION_COLORS.LandingZone;
    if (type === "Ground" || type === "Water" || type === "Coast") return TERRAIN_COLLISION_COLORS[type];
    if (type === "Plane" && entry.abandoned) return ABANDONED_PLANE_COLLISION_COLOR;
    return entry.team ? TEAM_COLLISION_COLORS[type][entry.team] : NEUTRAL_COLLISION_COLOR;
}
