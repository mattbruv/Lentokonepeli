import { GameMap } from "./map";
import { GameState } from "./state";
import { FlagObject } from "./objects/flag";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  // A list of changes from this tick.
  private changes: GameState;

  private flags: FlagObject[];

  public constructor() {
    this.changes = {};
    this.resetWorld();
    this.debug();
  }

  public debug(): void {}

  /**
   * Processes a step of the game simulation.
   *
   * Updates physics, checks collisions, creates/destroys entities,
   * and returns the changes.
   *
   * @param timestep Number of milliseconds to advance simulation
   */
  public tick(timestamp: number): GameState {
    this.changes = {};
    return this.changes;
  }

  private resetWorld(): void {
    this.changes = {};
    this.flags = [];
  }

  public loadMap(map: GameMap): void {
    console.log(map);
  }

  public logWorld(): void {
    console.log("Game World:");
    // console.log(this.entities);
  }

  public getState(): GameState {
    return {};
  }
}
