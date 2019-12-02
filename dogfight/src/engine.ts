import { GameWorld } from "./world";
import { State } from "./state";
import { GameMap } from "./map";

/**
 * Main Dogfight Engine Class/API.
 *
 * Contains the world, game settings,
 * players, etc.
 *
 * Goal:
 * be able to support up to max of 16 players.
 */
export class DogfightEngine {
  /** An instance of a game world! */
  private world: GameWorld;

  public constructor() {
    this.world = new GameWorld();
  }

  public loadMap(map: GameMap): void {
    this.world.loadMap(map);
  }

  /**
   * Processes a step of the game simulation.
   *
   * Updates physics, checks collisions, creates/destroys entities,
   * and returns the changes.
   *
   * @param timestep Number of milliseconds to advance simulation
   */
  public tick(timestep: number): State[] {
    return this.world.tick(timestep);
  }

  public getState(): State[] {
    return this.world.getState();
  }

  public applyInput(): void {}

  public debug(): void {
    this.world.debug();
  }
}
