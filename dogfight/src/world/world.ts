import { Cache } from "../network/cache";
import { PlayerInfo, PlayerStatus } from "../entities/PlayerInfo";
import { Flag } from "../entities/flag";
import { Bullet } from "../entities/Bullet";
import { Bomb } from "../entities/Bomb";
import { Ground } from "../entities/Ground";
import { Hill } from "../entities/hill";
import { Runway } from "../entities/Runway";
import { Tower } from "../entities/tower";
import { Man } from "../entities/Man";
import { Water } from "../entities/water";
import { Explosion } from "../entities/Explosion";
import { Entity, EntityType } from "../entity";
import { Team } from "../constants";
import { Plane, teamPlanes } from "../entities/Plane";
import { InputQueue, InputKey } from "../input";
import { processInputs } from "./input";
import { processCollision } from "./collision";
import { processTakeoffs, TakeoffEntry } from "./takeoff";
import { processPlanes } from "./plane";
import { processBullets } from "./bullet";
import { processBombs } from "./bomb";
import { processExplosions } from "./explosion";
import { processTroopers } from "./trooper";
import { Ownable } from "../ownable";
import { BufferedImage } from "../BufferedImage";



/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  // A cache of changes to send, refreshed on every tick.
  public cache: Cache = {};

  // ID increment counter by type
  private ids = {};

  // A queue of takeoff requests to be processed.
  public takeoffQueue: TakeoffEntry[];
  public inputQueue: InputQueue;

  public players: PlayerInfo[];
  public flags: Flag[];
  public grounds: Ground[];
  public hills: Hill[];
  public runways: Runway[];
  public towers: Tower[];
  public troopers: Man[];
  public planes: Plane[];
  public waters: Water[];
  public explosions: Explosion[];
  public bullets: Bullet[];
  public bombs: Bomb[];

  // god please forgive me for this sin
  private objectArrays = {
    [EntityType.Player]: "players",
    [EntityType.Flag]: "flags",
    [EntityType.Ground]: "grounds",
    [EntityType.Hill]: "hills",
    [EntityType.Runway]: "runways",
    [EntityType.ControlTower]: "towers",
    [EntityType.Trooper]: "troopers",
    [EntityType.Water]: "waters",
    [EntityType.Plane]: "planes",
    [EntityType.Explosion]: "explosions",
    [EntityType.Bullet]: "bullets",
    [EntityType.Bomb]: "bombs"
  };

  // Next available ID, incremented by 1.
  // Always counts up, never resets.
  private idCounter = 0;
  private app = null;
  private textures = null;

  public constructor(textures = null, app = null) {
    this.resetWorld();
    this.textures = textures;
    this.app = app;
    for (const type in EntityType) {
      this.ids[type] = 0;
    }
    //cont();
  }

  public getImage(name: string) {

    return this.textures[name];
  }


  public getEntities(): Entity[][] {
    return [this.planes, this.troopers, this.bombs, this.bullets, this.runways, this.grounds, this.waters, this.players, this.towers, this.hills, this.flags, this.explosions];
  }
  public clearCache(): void {
    this.cache = {};
    //console.log(this.cache);
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
    this.bullets = [];
    this.bombs = [];
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
    processBullets(this, deltaTime);
    processBombs(this, deltaTime);
    processTroopers(this, deltaTime);
    processExplosions(this, deltaTime);
    processCollision(this);
    return this.cache;
  }

  public getPlayerControlling(object: Entity): PlayerInfo {
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
  public addPlayer(team: Team): PlayerInfo {
    const player = new PlayerInfo(this.nextID(EntityType.Player), this, this.cache);
    player.set(this.cache, "team", team);
    this.addEntity(player);
    return player;
  }

  public removePlayer(p: PlayerInfo): void {
    const controlling = this.getObject(p.controlType, p.controlID);
    if (controlling !== undefined) {
      this.removeEntity(controlling);
    }
    this.removeEntity(p);
  }

  public getObject(type: EntityType, id: number): Entity | undefined {
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
      this.waters,
      this.planes,
      this.explosions,
      this.troopers,
      this.bombs,
      this.bullets
    ];
    const cache: Cache = {};
    for (const obj in objects) {
      for (const thing of objects[obj]) {
        if (cache[thing.type] == undefined) {
          cache[thing.type] = {};
        }
        cache[thing.type][thing.id] = thing.getState();
      }
    }
    return cache;
  }

  public createExplosion(x: number, y: number, o: Ownable): void {
    const explosion = new Explosion(
      this.nextID(EntityType.Explosion),
      this,
      this.cache,
      o,
      x,
      y
    );
    //explosion.setPlayerID(this.cache, uid);
    //explosion.setTeam(this.cache, team);
    this.explosions.push(explosion);
  }

  public addEntity(obj: Entity): void {
    const arr = this[this.objectArrays[obj.type]];
    arr.push(obj);
    this.cache[obj.type][obj.id] = obj.getState();
  }

  public removeEntity(obj: Entity): void {
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
    obj.removed = true;
    if (this.cache[type] == undefined) {
      this.cache[type] = {};
    }
    this.cache[type][id] = {
      type
    };
  }

  /**
   * Returns the index of an object in the array.
   * @param arr Array of game objects to search through.
   * @param id The ID of the object to find.
   */
  public getObjectIndex(type: EntityType, id: number): number {
    let index = -1;
    if (type === EntityType.None) {
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

  public nextID(type: EntityType): number {
    const id = this.ids[type]++;
    if (id >= 65535) {
      this.ids[type] = 0;
    }
    return id;
  }

  public died(o: Ownable, x: number, y: number): void {
    let p = o.getPlayerInfo();
    p.setStatus(p.world.cache, PlayerStatus.Takeoff);
    p.setControl(p.world.cache, EntityType.None, 0);
    /*
    if (this.gameMode == 1) {
      // ghost
    }
    else {
      // respawn
    }

    //*/
  }
  public landed(o: Ownable, r: Runway, bol: boolean = false) {
    let p: PlayerInfo = o.getPlayerInfo();
    p.setStatus(p.world.cache, PlayerStatus.Takeoff);
    p.setControl(p.world.cache, EntityType.None, 0);

  }

  public killed(p: Ownable, e: Ownable, c: number) {
    // TODO handle scores
  }

}
