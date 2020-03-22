import { GameMap } from "./map";
import { Cache } from "./network/cache";
import { Player } from "./objects/player";
import { Flag } from "./objects/flag";
import { Ground } from "./objects/ground";
import { Hill } from "./objects/hill";
import { Runway } from "./objects/runway";
import { Tower } from "./objects/tower";
import { Trooper, TrooperState } from "./objects/trooper";
import { Water } from "./objects/water";
import { GameObject } from "./object";

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
    if (this.troopers.length == 0) {
      const man = new Trooper(this.nextID(), this.cache);
      man.setPos(this.cache, 0, 100);
      man.set(this.cache, "state", TrooperState.Parachuting);
      this.addObject(this.troopers, man);
    }
    for (const trooper of this.troopers) {
      trooper.move(this.cache, deltaTime);
      if (trooper.x > 350) {
        this.removeObject(this.troopers, trooper);
      }
    }
    return this.cache;
  }

  /**
   * Adds a player to the game,
   * and returns the information.
   */
  public addPlayer(): Player {
    const player = new Player(this.nextID(), this.cache);
    this.addObject(this.players, player);
    return player;
  }

  public removePlayer(p: Player): void {
    this.removeObject(this.players, p);
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

  private addObject(arr: GameObject[], obj: GameObject): void {
    arr.push(obj);
    this.cache[obj.id] = obj.getState();
  }

  private removeObject(arr: GameObject[], obj: GameObject): void {
    const index = this.getObjectIndex(arr, obj.id);
    if (index < 0) {
      return;
    }
    const type = obj.type;
    const id = obj.id;

    arr.splice(index, 1);

    // Create an empty update in the cache.
    // The renderer treats an empty update as a deletion.
    this.cache[id] = {
      type
    };
  }

  /**
   * Returns the index of an object in the array.
   * @param arr Array of game objects to search through.
   * @param id The ID of the object to find.
   */
  private getObjectIndex(arr: GameObject[], id: number): number {
    let index = -1;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  public nextID(): number {
    return this.idCounter++;
  }

  public loadMap(map: GameMap): void {
    map.grounds.forEach((ground): void => {
      const obj = new Ground(this.nextID(), this.cache);
      obj.setData(this.cache, ground);
      this.grounds.push(obj);
    });
    map.flags.forEach((flag): void => {
      const obj = new Flag(this.nextID(), this.cache);
      obj.setData(this.cache, flag);
      this.flags.push(obj);
    });
    map.hills.forEach((hill): void => {
      const obj = new Hill(this.nextID(), this.cache);
      obj.setData(this.cache, hill);
      this.hills.push(obj);
    });
    map.runways.forEach((runway): void => {
      const obj = new Runway(this.nextID(), this.cache);
      obj.setData(this.cache, runway);
      this.runways.push(obj);
    });
    map.towers.forEach((tower): void => {
      const obj = new Tower(this.nextID(), this.cache);
      obj.setData(this.cache, tower);
      this.towers.push(obj);
    });
    map.waters.forEach((water): void => {
      const obj = new Water(this.nextID(), this.cache);
      obj.setData(this.cache, water);
      this.waters.push(obj);
    });
  }
}
