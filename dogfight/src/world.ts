import { GameMap } from "./map";
import { Cache } from "./network/cache";
import { Player } from "./objects/player";
import { Flag } from "./objects/flag";
import { Ground } from "./objects/ground";
import { Hill } from "./objects/hill";
import { Runway } from "./objects/runway";
import { Tower } from "./objects/tower";
import { Trooper } from "./objects/trooper";
import { Water } from "./objects/water";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  // A cache of changes to send, refreshed on every tick.
  private cache: Cache = {};

  private players: Player[];
  private flags: Flag[];
  private grounds: Ground[];
  private hills: Hill[];
  private runways: Runway[];
  private towers: Tower[];
  private troopers: Trooper[];
  private waters: Water[];

  // Next available ID, incremented by 1.
  // Always counts up, never resets.
  private idCounter = 0;

  public constructor() {
    this.resetWorld();
  }

  public clearCache(): void {
    this.cache = {};
  }

  private resetWorld(): void {
    this.clearCache();
    this.players = [];
    this.flags = [];
    this.grounds = [];
    this.hills = [];
    this.runways = [];
    this.towers = [];
    this.troopers = [];
    this.waters = [];
  }

  /**
   * Processes a step of the game simulation.
   *
   * Updates physics, checks collisions, creates/destroys entities,
   * and returns the changes.
   *
   * @param timestep Number of milliseconds to advance simulation
   */
  public tick(deltaTime: number): Cache {
    return this.cache;
  }

  public getState(): Cache {
    const objects = [
      this.players,
      this.flags,
      this.grounds,
      this.hills,
      this.runways,
      this.towers,
      this.troopers,
      this.waters
    ];
    const cache: Cache = {};
    for (const obj in objects) {
      for (const thing of objects[obj]) {
        cache[thing.id] = thing.getState();
      }
    }
    return cache;
  }

  public nextID(): number {
    return this.idCounter++;
  }

  public loadMap(map: GameMap): void {
    map.grounds.forEach((ground): void => {
      const obj = new Ground(this.nextID(), this.cache);
      obj.setData(ground);
      this.grounds.push(obj);
    });
    map.flags.forEach((flag): void => {
      const obj = new Flag(this.nextID(), this.cache);
      obj.setData(flag);
      this.flags.push(obj);
    });
    map.hills.forEach((hill): void => {
      const obj = new Hill(this.nextID(), this.cache);
      obj.setData(hill);
      this.hills.push(obj);
    });
    map.runways.forEach((runway): void => {
      const obj = new Runway(this.nextID(), this.cache);
      obj.setData(runway);
      this.runways.push(obj);
    });
    map.towers.forEach((tower): void => {
      const obj = new Tower(this.nextID(), this.cache);
      obj.setData(tower);
      this.towers.push(obj);
    });
    map.waters.forEach((water): void => {
      const obj = new Water(this.nextID(), this.cache);
      obj.setData(water);
      this.waters.push(obj);
    });
  }
}
