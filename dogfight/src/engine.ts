import { GameWorld } from "./world";
import { MAP_CLASSIC } from "./maps/classic";

type TickChanges = void;

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
    console.log("Initialized New Game Engine..");
    this.world = new GameWorld();
    this.world.loadMap(MAP_CLASSIC);
  }
  /**
   * Updates the game world by one tick.
   * processes physics, collision, creation/deletion of entities.
   * returns the changes applied during this tick.
   */
  public tick(): TickChanges {
    this.world.logWorld();
  }

  public applyInput(): void {}
}
