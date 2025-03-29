import { EntityProperties } from "dogfight-types/EntityProperties";
import { EntityType } from "dogfight-types/EntityType";
import { BackgroundItem } from "./entities/backgroundItem";
import { Bomb } from "./entities/bomb";
import { Bullet } from "./entities/bullet";
import { Bunker } from "./entities/bunker";
import { Coast } from "./entities/coast";
import { Entity, updateProps } from "./entities/entity";
import { Explosion } from "./entities/explosion";
import { Ground } from "./entities/ground";
import { Hill } from "./entities/hill";
import { Man } from "./entities/man";
import { Plane } from "./entities/plane";
import { Runway } from "./entities/runway";
import { Water } from "./entities/water";
import { WorldInfo } from "./entities/worldInfo";

/**
 * Shared way to handle entities in the project
 */
export type EntityGroup<ENTITY> = {
    new_type: () => ENTITY;
    collection: Map<number, ENTITY>;
};

export type EntityManagerCallback = (entity: Entity<unknown>, id: number, data: EntityProperties | undefined) => void;

type EntityEntry<TYPE extends EntityType, ENTITY> = [TYPE, () => ENTITY];

/** Entity collection, having each entity type in its corresponding group. */
type EntityCollection<TYPE extends EntityType, ENTRIES extends EntityEntry<TYPE, Entity<unknown>>[]> = {
    [K in ENTRIES[number] as K[0]]-?: EntityGroup<ReturnType<K[1]>>;
};

/** Default entity types for the game. */
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
 * Creates a new entity collection from the provided entries, ensuring type safety.
 *
 * @param entries - An array of entity types and their respective creation functions.
 * @returns A collection of entities, mapped by their type.
 */
export function entityCollection<TYPE extends EntityType, ENTRIES extends EntityEntry<TYPE, Entity<unknown>>[]>(
    entries: ENTRIES,
) {
    return Object.fromEntries(
        entries.map(([name, constructor]) => [name, { new_type: constructor, collection: new Map() }]),
    ) as EntityCollection<TYPE, ENTRIES>;
}

/**
 * Deletes an entity from the collection by its ID, and optionally performs rendering cleanup.
 *
 * @param entities - The collection of entities from which to delete.
 * @param id - The ID of the entity to delete.
 * @param ent_type - The type of the entity.
 */
export function deleteEntity<TYPE extends EntityType, ENTRIES extends EntityEntry<TYPE, Entity<unknown>>[]>(
    entities: EntityCollection<TYPE, ENTRIES>,
    id: number,
    ent_type: TYPE,
    { onRemove }: { onRemove?: EntityManagerCallback },
) {
    const group = entities[ent_type] as EntityGroup<Entity<unknown>>;
    if (!group) return;
    const entity = group.collection.get(id);
    if (!entity) return;

    onRemove?.(entity, id, undefined);
    entity.destroy();
    group.collection.delete(id);
}

/**
 * Deletes all entities from the collection, and optionally performs rendering cleanup.
 *
 * @param entities - The collection of entities to delete.
 */
export function destroyEntities<TYPE extends EntityType, ENTRIES extends EntityEntry<TYPE, Entity<unknown>>[]>(
    entities: EntityCollection<TYPE, ENTRIES>,
    { onRemove }: { onRemove?: EntityManagerCallback },
) {
    for (const ent_type of Object.keys(entities)) {
        const group = entities[ent_type as TYPE] as EntityGroup<Entity<unknown>>;
        for (const [id, entity] of group.collection.entries()) {
            onRemove?.(entity, id, undefined);
            entity.destroy();
            group.collection.delete(id);
        }
    }
}

/**
 * Adds an entity to the collection if it doesn't exist, or returns the existing one.
 * Optionally performs actions (e.g., rendering) when the entity is added.
 *
 * @param entities - The collection of entities.
 * @param id - The ID of the entity to add or retrieve.
 * @param ent_type - The type of the entity.
 * @returns The existing or newly created entity.
 */
export function addOrGetEntity<TYPE extends EntityType, ENTRIES extends EntityEntry<TYPE, Entity<unknown>>[]>(
    entities: EntityCollection<TYPE, ENTRIES>,
    id: number,
    ent_type: TYPE,
    { onAdd, onGet }: { onAdd?: EntityManagerCallback; onGet?: EntityManagerCallback },
) {
    const group = entities[ent_type] as EntityGroup<Entity<unknown>>;
    const entity = group.collection.get(id);
    if (entity) {
        onGet?.(entity, id, undefined);
        return entity;
    }

    const newEnt = group.new_type();
    group.collection.set(id, newEnt);

    onAdd?.(newEnt, id, undefined);
    return newEnt;
}

/**
 * Updates an entity's properties in the collection, either by adding a new entity or updating an existing one.
 * Optionally performs actions (e.g., rendering) when the entity is added.
 *
 * @param entities - The collection of entities.
 * @param id - The ID of the entity to upsert.
 * @param data - The new properties to apply to the entity.
 */
export function upsertEntity<TYPE extends EntityType, ENTRIES extends EntityEntry<TYPE, Entity<unknown>>[]>(
    entities: EntityCollection<TYPE, ENTRIES>,
    id: number,
    data: Extract<EntityProperties, { type: TYPE }>,
    {
        onAdd,
        onUpdate,
        onGet,
    }: { onAdd?: EntityManagerCallback; onUpdate?: EntityManagerCallback; onGet?: EntityManagerCallback },
) {
    const entity = addOrGetEntity(entities, id, data.type, {
        onAdd,
        onGet,
    });
    updateProps(entity, data.props);
    // Note this is called even during insert
    onUpdate?.(entity, id, data);
    return entity;
}
