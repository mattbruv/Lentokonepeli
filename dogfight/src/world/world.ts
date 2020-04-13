import { Cache } from "../network/cache";
import { Player } from "../objects/player";
import { Flag } from "../objects/flag";
import { Ground } from "../objects/ground";
import { Hill } from "../objects/hill";
import { Runway } from "../objects/runway";
import { Tower } from "../objects/tower";
import { Trooper } from "../objects/trooper";
import { Water } from "../objects/water";
import { Explosion } from "../objects/explosion";
import { GameObject, GameObjectType } from "../object";
import { Team } from "../constants";
import { Plane } from "../objects/plane";
import { InputQueue, InputKey } from "../input";
import { processInputs } from "./input";
import { processCollision } from "./collision";
import { processTakeoffs, TakeoffEntry } from "./takeoff";
import { processPlanes } from "./plane";
import { processExplosions } from "./explosion";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  // A cache of changes to send, refreshed on every tick.
  public cache: Cache = {};

  // A queue of takeoff requests to be processed.
  public takeoffQueue: TakeoffEntry[];
  public inputQueue: InputQueue;

  public players: Player[];
  public flags: Flag[];
  public grounds: Ground[];
  public hills: Hill[];
  public runways: Runway[];
  public towers: Tower[];
  public waters: Water[];
  public planes: Plane[];
  public troopers: Trooper[];
  public explosions: Explosion[];

  // god please forgive me for this sin
  private objectArrays = {
    [GameObjectType.Player]: "players",
    [GameObjectType.Flag]: "flags",
    [GameObjectType.Ground]: "grounds",
    [GameObjectType.Hill]: "hills",
    [GameObjectType.Runway]: "runways",
    [GameObjectType.ControlTower]: "towers",
    [GameObjectType.Trooper]: "troopers",
    [GameObjectType.Water]: "waters",
    [GameObjectType.Plane]: "planes",
    [GameObjectType.Explosion]: "explosions"
  };

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
    this.takeoffQueue = [];
    this.inputQueue = {};

    this.players = [];
    this.flags = [];
    this.grounds = [];
    this.hills = [];
    this.runways = [];
    this.towers = [];
    this.troopers = [];
    this.waters = [];
    this.planes = [];
    this.explosions = [];
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
    processInputs(this);
    processTakeoffs(this);
    processPlanes(this, deltaTime);
    processExplosions(this, deltaTime);
    processCollision(this);
    return this.cache;
  }

  public getPlayerControlling(object: GameObject): Player {
    for (const player of this.players) {
      if (player.controlID == object.id && player.controlType == object.type) {
        return player;
      }
    }
  }

  public queueInput(id: number, key: InputKey, value: boolean): void {
    if (this.inputQueue[id] === undefined) {
      this.inputQueue[id] = {};
    }
    this.inputQueue[id][key] = value;
  }

  /**
   * Adds a player to the game,
   * and returns the information.
   */
  public addPlayer(team: Team): Player {
    const player = new Player(this.nextID(), this.cache);
    player.set(this.cache, "team", team);
    this.addObject(player);
    return player;
  }

  public removePlayer(p: Player): void {
    this.removeObject(p);
  }

  public getObject(type: GameObjectType, id: number): GameObject | undefined {
    const index = this.getObjectIndex(type, id);
    if (index < 0) {
      return undefined;
    }
    const array = this[this.objectArrays[type]];
    return array[index];
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
      this.waters,
      this.planes,
      this.explosions
    ];
    const cache: Cache = {};
    for (const obj in objects) {
      for (const thing of objects[obj]) {
        cache[thing.id] = thing.getState();
      }
    }
    return cache;
  }

  public addObject(obj: GameObject): void {
    const arr = this[this.objectArrays[obj.type]];
    arr.push(obj);
    this.cache[obj.id] = obj.getState();
  }

  public removeObject(obj: GameObject): void {
    const index = this.getObjectIndex(obj.type, obj.id);
    if (index < 0) {
      return;
    }
    const type = obj.type;
    const id = obj.id;

    const arr = this[this.objectArrays[obj.type]];
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
  public getObjectIndex(type: GameObjectType, id: number): number {
    let index = -1;
    if (type === GameObjectType.None) {
      return index;
    }
    const array = this[this.objectArrays[type]];
    for (let i = 0; i < array.length; i++) {
      if (array[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  public nextID(): number {
    return this.idCounter++;
  }
}
