type TickChanges = void;
type PlayerInput = void;

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
  /**
   * Updates the game world by one tick.
   * processes physics, collision, creation/deletion of entities.
   * returns the changes applied during this tick.
   */
  public tick(): TickChanges {}

  public applyInput(PlayerInput): void {}

  public initialize(): void {}
}
