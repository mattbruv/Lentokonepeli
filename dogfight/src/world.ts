import { GroundEntity } from "./entities/ground";
import { GameMap } from "./map";
import { EntityType } from "./entity";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  private grounds: GroundEntity[];

  public constructor() {
    console.log("Created world Object!");
    this.resetWorld();
  }

  private resetWorld(): void {
    console.log("Resetting world...");

    // Remove all objects
    this.grounds = [];
  }

  public loadMap(map: GameMap): void {
    if (map.grounds) {
      map.grounds.forEach((ground): void => {
        // TODO: Generate a unique ID for constructor?
        this.grounds.push(new GroundEntity(ground));
      });
    }
    console.log("Loaded map!");
    this.logWorld();
  }

  public logWorld(): void {
    console.log("Game World:");
    console.log("Grounds: ", this.grounds);
  }

  /**
   * Generates a Unique ID for an Entity.
   * @param type Type of entity to generate a unique ID for.
   */
  private getUniqueEntityID(type: EntityType): number {
    return 0;
  }
}
