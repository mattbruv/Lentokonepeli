import { GroundEntity } from "./entities/ground";
import { GameMap } from "./map";
import { EntityContainer, EntityType } from "./entity";
import { GameEvent } from "./event";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  private eventQueueIn: GameEvent[] = []; // processes on beginniong of tick();
  private eventQueueOut: GameEvent[] = []; // flushes on tick()
  private grounds = new EntityContainer<GroundEntity>(EntityType.Ground);

  public constructor() {
    this.resetWorld();
  }

  public debug(): void {
    const del = this.grounds.delete(0);
    this.eventQueueOut.push(del);
    console.log(this.eventQueueOut);
    this.logWorld();
  }

  public tick(): void {
    console.log("game tick");
  }

  private resetWorld(): void {
    this.grounds.reset();
  }

  public loadMap(map: GameMap): void {
    if (map.grounds) {
      map.grounds.forEach((ground): void => {
        this.grounds.add(new GroundEntity(ground));
      });
    }
    this.logWorld();
  }

  public logWorld(): void {
    console.log("Game World:");
    console.log(this.grounds);
  }
}
