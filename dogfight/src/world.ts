import { GameMap, loadMapEntities } from "./map";
import { Entity, getUniqueID, GameObject } from "./entity";
import { State, StateAction, GameState } from "./state";
import { TrooperEntity } from "./entities/trooper";
import { ByteSize } from "./constants";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  private changes: State[] = []; // A list of changes from this tick.
  private entities: Entity[] = [];

  public constructor() {
    this.resetWorld();
    this.debug();
  }

  public debug(): void {
    const trooper = new TrooperEntity();
    trooper.setOptions({
      id: getUniqueID(this.entities),
      position: { x: 100, y: -10 }
    });
    this.entities.push(trooper);
  }

  /**
   * Processes a step of the game simulation.
   *
   * Updates physics, checks collisions, creates/destroys entities,
   * and returns the changes.
   *
   * @param timestep Number of milliseconds to advance simulation
   */
  public tick(timestamp: number): State[] {
    this.changes = [];
    return this.changes;
  }

  private resetWorld(): void {
    this.entities = [];
  }

  public loadMap(map: GameMap): void {
    loadMapEntities(map, this.entities);
  }

  public logWorld(): void {
    console.log("Game World:");
    // console.log(this.entities);
  }

  public getState(): GameState {
    return {};
  }
}
