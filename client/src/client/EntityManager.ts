/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityProperties } from "dogfight-types/EntityProperties";
import { BackgroundItem } from "./entities/backgroundItem";
import { Bomb } from "./entities/bomb";
import { Bullet } from "./entities/bullet";
import { Bunker } from "./entities/bunker";
import { Coast } from "./entities/coast";
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

type Constructor<T> = () => T;

type EntityManagerEntry<T extends EntityType, C> = [type: T, constructor: Constructor<C>];

type EntityCollection<T extends EntityType, E extends EntityManagerEntry<EntityType, any>> = {
    [K in T]: EntityGroup<Extract<E, [K, Constructor<any>]> extends [K, Constructor<infer U>] ? U : never>;
};

/**
 * Player added later where needed as it requires its own kind of construction
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
] as const satisfies EntityManagerEntry<EntityType, any>[];

/**
 * In typesafe manner create entity collection where only the provided entities are in the result type
 */
export function entityCollection<T extends EntityType, E extends EntityManagerEntry<T, any>>(entries: E[]) {
    const entities: Partial<EntityCollection<T, E>> = {};

    for (const [name, constructor] of entries) {
        entities[name] = {
            new_type: constructor,
            collection: new Map(),
        };
    }

    return entities as EntityCollection<T, E>;
}

export function destroyEntities(entities: EntityCollection<any, any>) {
    console.log("destroying entities...");
    for (const group of Object.values(entities)) {
        if (group) {
            for (const entity of (group as EntityGroup<any>).collection.values()) {
                entity.destroy();
            }
        }
    }
}
