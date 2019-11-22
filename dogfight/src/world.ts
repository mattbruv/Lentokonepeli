import { GroundEntity, groundInfo } from "./entities/ground";
import { GameMap } from "./map";
import { EntityContainer } from "./entity";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  private inEventQueue: Event[]; // processes on beginniong of tick();
  private outEventQueue: Event[]; // flushes on tick()
  private grounds = new EntityContainer<GroundEntity>(groundInfo);

  public constructor() {
    console.log("Created world Object!");
    this.resetWorld();
  }

  private resetWorld(): void {
    console.log("Resetting world...");
    this.grounds.reset();
  }

  public loadMap(map: GameMap): void {
    if (map.grounds) {
      map.grounds.forEach((ground): void => {
        this.grounds.add(new GroundEntity(ground));
      });
    }
    console.log("Loaded map!");
    console.log(this.grounds);
    console.log(this.grounds.get());
    this.logWorld();
  }

  public logWorld(): void {
    console.log("Game World:");
    console.log(this.grounds);
  }
}
