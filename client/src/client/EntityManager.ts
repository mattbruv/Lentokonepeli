import { EntityProperties } from "dogfight-types/EntityProperties";
import { BackgroundItem } from "./entities/backgroundItem";
import { Bomb } from "./entities/bomb";
import { Bullet } from "./entities/bullet";
import { Bunker } from "./entities/bunker";
import { Coast } from "./entities/coast";
import { Entity } from "./entities/entity";
import { Explosion } from "./entities/explosion";
import { Ground } from "./entities/ground";
import { Hill } from "./entities/hill";
import { Man } from "./entities/man";
import { Plane } from "./entities/plane";
import { Runway } from "./entities/runway";
import { Water } from "./entities/water";
import { WorldInfo } from "./entities/worldInfo";

export type EntityType = EntityProperties["type"];

export type EntityGroup<T> = {
    new_type: () => T;
    collection: Map<number, T>;
};

type EntityEntry<T extends EntityType, C> = [T, () => C];

type EntityCollection<E extends EntityEntry<EntityType, Entity<unknown>>[]> = {
    [K in E[number] as K[0]]: EntityGroup<ReturnType<K[1]>>;
};

/**
 * Default entity types
 */
export const DEFAULT_ENTITIES = [
    ["WorldInfo", () => new WorldInfo()],
    ["Plane", () => new Plane()],
    ["Man", () => new Man()],
    ["BackgroundItem", () => new BackgroundItem()],
    ["Ground", () => new Ground()],
    ["Coast", () => new Coast()],
    ["Runway", () => new Runway()],
    ["Water", () => new Water()],
    ["Bunker", () => new Bunker()],
    ["Bomb", () => new Bomb()],
    ["Explosion", () => new Explosion()],
    ["Hill", () => new Hill()],
    ["Bullet", () => new Bullet()],
] as const satisfies EntityEntry<EntityType, Entity<unknown>>[];

/**
 * Creates an entity collection with strict type safety
 */
export function entityCollection<E extends EntityEntry<EntityType, Entity<unknown>>[]>(entries: E) {
    return Object.fromEntries(
        entries.map(([name, constructor]) => [name, { new_type: constructor, collection: new Map() }]),
    ) as EntityCollection<E>;
}
