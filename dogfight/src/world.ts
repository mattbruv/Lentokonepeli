import { GameMap, loadMapEntities } from "./map";
import { Entity } from "./entity";
import { State, StateAction } from "./state";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  private changes: State[] = []; // A list of changes from this tick.
  private entities: Entity[] = [];

  public constructor() {
    this.resetWorld();
  }

  public debug(): void {
    this.logWorld();
  }

  public tick(): State[] {
    this.changes = [];
    /**
     * Takes a number of milliseconds to tick by
     *
     * 1. Process player input
     * 2. Move entities that can be moved.
     * 3. Check collision
     * 4. remove entities that should be deleted.
     * populate state changes, etc..
     */
    console.log("game tick");
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
    console.log(this.entities);
  }

  public getState(): State[] {
    const stateList = this.entities.map(
      (e): State => {
        const state = {
          action: StateAction.Create,
          id: e.id,
          type: e.type,
          properties: e.getState()
        };
        return state;
      }
    );
    // also append player state later..
    return stateList;
  }
}
