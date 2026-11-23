import { Level } from "dogfight-types/Level";
import { Team } from "dogfight-types/Team";
import { Terrain } from "dogfight-types/Terrain";
import { DogfightWeb } from "dogfight-web";

const TILE_WIDTH = 100;
const RUNWAY_WIDTH = 290;
const BUNKER_WIDTH = 62;

export type MapSpan = { x: number; width: number };
export type TeamMarker = MapSpan & { team: Team };

export type LevelStats = {
    name: string;
    designer: string;
    timeWinner: Team | null;
    width: number;
    left: number;
    terrain: Terrain | "Mixed";
    waterShare: number;
    runways: Record<Team, number>;
    bunkers: Record<Team, number>;
    ground: (MapSpan & { terrain: Terrain })[];
    water: MapSpan[];
    runwayMarkers: TeamMarker[];
    bunkerMarkers: TeamMarker[];
};

let parser: DogfightWeb | null = null;
const cache = new Map<string, LevelStats | null>();

function layerLength(levelData: string): number {
    return levelData
        .split("\n")
        .filter((line) => line.toLowerCase().startsWith("layer") && line.includes("="))
        .reduce((max, line) => Math.max(max, line.split("=")[1].trim().length), 0);
}

function clip(span: MapSpan, left: number, right: number): MapSpan | null {
    const start = Math.max(span.x, left);
    const end = Math.min(span.x + span.width, right);
    return end > start ? { x: start, width: end - start } : null;
}

function computeStats(levelData: string): LevelStats | null {
    parser ??= DogfightWeb.new();
    const level = JSON.parse(parser.parse_level(levelData)) as Level;
    const width = layerLength(levelData) * TILE_WIDTH;
    if (width === 0) return null;
    const left = -width / 2;
    const right = width / 2;

    const stats: LevelStats = {
        name: level.name,
        designer: level.designer,
        timeWinner: level.time_winner,
        width,
        left,
        terrain: "Normal",
        waterShare: 0,
        runways: { Allies: 0, Centrals: 0 },
        bunkers: { Allies: 0, Centrals: 0 },
        ground: [],
        water: [],
        runwayMarkers: [],
        bunkerMarkers: [],
    };
    const terrains = new Set<Terrain>();

    for (const object of level.objects) {
        if ("Ground" in object) {
            const [pos, span, terrain] = object.Ground;
            const clipped = clip({ x: pos.x, width: span }, left, right);
            if (clipped) stats.ground.push({ ...clipped, terrain });
            terrains.add(terrain);
        } else if ("Water" in object) {
            const [pos, span, terrain] = object.Water;
            const clipped = clip({ x: pos.x, width: span }, left, right);
            if (clipped) stats.water.push(clipped);
            terrains.add(terrain);
        } else if ("Runway" in object) {
            const [pos, team] = object.Runway;
            stats.runways[team]++;
            stats.runwayMarkers.push({ x: pos.x, width: RUNWAY_WIDTH, team });
        } else if ("Bunker" in object) {
            const [pos, team] = object.Bunker;
            stats.bunkers[team]++;
            stats.bunkerMarkers.push({ x: pos.x, width: BUNKER_WIDTH, team });
        }
    }

    stats.terrain = terrains.size > 1 ? "Mixed" : (terrains.values().next().value ?? "Normal");
    stats.waterShare = stats.water.reduce((sum, span) => sum + span.width, 0) / width;
    return stats;
}

export function getLevelStats(levelData: string): LevelStats | null {
    if (!cache.has(levelData)) {
        try {
            cache.set(levelData, computeStats(levelData));
        } catch (error) {
            console.warn("Failed to read level stats", error);
            cache.set(levelData, null);
        }
    }
    return cache.get(levelData) ?? null;
}
