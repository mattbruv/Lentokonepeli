import { Entity, getUniqueEntityID } from "../entities/entity";
import { Player } from "../player";
import { MapDefinition, entitiesFromMap } from "../maps/map";
import { EngineCallbacks } from "./callbacks";
import { EntityType } from "../constants";
import {
  moveMan,
  ManEntity,
  ManStatus,
  ManOptions,
  createMan
} from "../entities/man";
import { GroundEntity } from "../entities/ground";
import { WaterEntity } from "../entities/water";
import { isRectangleCollision } from "../physics/collision";
import { randBetween } from "./helpers";
import { CLASSIC_MAP } from "../maps/classic";

/**
 * This is the game engine class.
 * It manages game state, applies player input,
 * applies physics,
 * etc.
 */
export class GameEngine {
  /** A list of players active in this world */
  public players: Player[];
  /** A list of entities active in this world */
  public entities: Entity[];

  private callbacks: EngineCallbacks;

  public constructor(callbacks: EngineCallbacks) {
    this.callbacks = callbacks;
    this.players = [];
    this.entities = [];
    this.init();
  }

  public tick(): void {
    // 1. User input

    // 2. Object position updates
    this.moveEntities();

    // 3. Physics updates
    this.updateCollisions();
  }

  private moveEntities(): void {
    const men = this.getEntities(EntityType.Man) as ManEntity[];
    men.forEach((man): void => {
      const diff = moveMan(man as ManEntity);
      this.updateEntity(diff);
    });
  }

  private init(): void {
    this.loadMap(CLASSIC_MAP);

    for (let i = 0; i < 50; i++) {
      const manOpts: ManOptions = {
        position: { x: randBetween(-2500, -1400), y: randBetween(10, 1200) },
        status: randBetween(0, 1)
      };
      const man = createMan(manOpts, getUniqueEntityID(this.entities));
      this.addEntity(man);
    }
  }

  private updateCollisions(): void {
    const men = this.getEntities(EntityType.Man) as ManEntity[];
    const grounds = this.getEntities(EntityType.Ground) as GroundEntity[];
    const waters = this.getEntities(EntityType.Water) as WaterEntity[];

    men.forEach((man): void => {
      const update: Partial<ManEntity> = {
        id: man.id,
        position: man.position
      };

      grounds.forEach((ground): void => {
        if (isRectangleCollision(man.hitbox, ground.hitbox)) {
          if (man.status === ManStatus.Falling) {
            this.deleteEntity(man.id);
          }
          update.position.y = ground.position.y;
          update.status = ManStatus.Standing;
        }
      });

      waters.forEach((water): void => {
        if (isRectangleCollision(man.hitbox, water.hitbox)) {
          this.deleteEntity(man.id);
        }
      });

      this.updateEntity(update);
    });
  }

  public addEntity(newEntity: Entity): void {
    console.log("Add new ent", newEntity.id);
    this.entities.push(newEntity);
    this.callbacks.onEntityAdd(newEntity);
  }

  public updateEntity(data: Partial<Entity>): void {
    const entity = this.getEntity(data.id);
    if (entity === undefined) return;

    for (const property in data) {
      entity[property] = data[property];
    }

    this.callbacks.onEntityUpdate(data);
  }

  public deleteEntity(id: number): void {
    this.entities = this.entities.filter((e): boolean => {
      return e.id !== id;
    });
    this.callbacks.onEntityDelete(id);
  }

  /**
   * Attempts to get an entity from the array
   * @param id The entity's ID
   */
  public getEntity(id: number): Entity | undefined {
    return this.entities.find((e): boolean => {
      return e.id === id;
    });
  }

  /**
   * Returns a list of a specific entity type
   * @param type The type of entities to retrieve
   */
  public getEntities(type: EntityType): Entity[] {
    return this.entities.filter((e): boolean => {
      return e.type === type;
    });
  }

  /**
   * Populates entities into the game world from a map definition.
   * @param map The map from which to load entities.
   */
  public loadMap(map: MapDefinition): void {
    this.reset();
    console.log("Loading map " + map.name);
    const newEntities = entitiesFromMap(map);

    newEntities.forEach((e): void => {
      this.addEntity(e);
    });
  }

  /**
   * Clears the game world of all entities.
   */
  private reset(): void {
    this.entities = [];
  }
}
