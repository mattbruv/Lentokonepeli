import { GameWorld } from "./world";
import { MAP_CLASSIC } from "./maps/classic";
import { State } from "./state";

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
    this.world.loadMap(MAP_CLASSIC);
  }

  public debug(): void {
    this.world.debug();
  }

  /**
   * Updates the game world by one tick.
   * processes physics, collision, creation/deletion of entities.
   * returns the changes applied during this tick.
   */
  public tick(): void {
    this.world.logWorld();
  }

  public getState(): State[] {
    return this.world.getState();
  }

  public applyInput(): void {}
}
