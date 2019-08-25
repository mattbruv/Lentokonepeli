import { Entity } from "../entities/entity";
import { Player } from "../player";
import { MapDefinition, entitiesFromMap } from "../maps/map";
import { EngineCallbacks } from "./callbacks";

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

  public addEntity(newEntity: Entity): void {
    this.entities.push(newEntity);
    this.callbacks.onEntityAdd(newEntity);
  }

  public deleteEntity(id: number): void {
    this.entities = this.entities.filter((e): boolean => {
      return e.id === id;
    });
    this.callbacks.onEntityDelete(id);
  }

  /**
   * Clears the game world of all entities.
   */
  private reset(): void {
    this.entities = [];
  }
}
