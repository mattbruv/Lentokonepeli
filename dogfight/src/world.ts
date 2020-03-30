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
import { GameObject, GameObjectType } from "./object";
import { Team, FacingDirection, ROTATION_DIRECTIONS } from "./constants";
import { TakeoffRequest, TakeoffEntry } from "./takeoff";
import { teamPlanes, Plane } from "./objects/plane";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  // A cache of changes to send, refreshed on every tick.
  private cache: Cache = {};

  // A queue of takeoff requests to be processed.
  private takeoffQueue: TakeoffEntry[];

  private players: Player[];
  private flags: Flag[];
  private grounds: Ground[];
  private hills: Hill[];
  private runways: Runway[];
  private towers: Tower[];
  private waters: Water[];
  private planes: Plane[];
  private troopers: Trooper[];

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

    this.players = [];
    this.flags = [];
    this.grounds = [];
    this.hills = [];
    this.runways = [];
    this.towers = [];
    this.troopers = [];
    this.waters = [];
    this.planes = [];
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
    this.processTakeoffs();
    this.planes.forEach((p): void => {
      p.rotate(this.cache);
      p.move(this.cache, deltaTime);
      if (Math.random() > 0.95) {
        // flip plane
        p.setFlipped(this.cache, !p.flipped);
      }
    });
    return this.cache;
  }

  private processTakeoffs(): void {
    // console.log(this.takeoffQueue);
    for (const takeoff of this.takeoffQueue) {
      this.doTakeoff(takeoff);
    }
    this.takeoffQueue = [];
  }

  private doTakeoff(takeoff: TakeoffEntry): void {
    console.log(takeoff);
    // test if player exists
    const playerIndex = this.getObjectIndex(this.players, takeoff.playerID);
    if (playerIndex < 0) {
      return;
    }
    const player = this.players[playerIndex];
    // make sure he's not controlling anything
    if (player.controlType !== GameObjectType.None) {
      return;
    }
    const runwayIndex = this.getObjectIndex(
      this.runways,
      takeoff.request.runway
    );
    // test if runway exists
    if (runwayIndex < 0) {
      return;
    }
    // make sure runway isn't dead
    const runway = this.runways[runwayIndex];
    if (runway.health <= 0) {
      return;
    }
    // create plane
    const plane = new Plane(
      this.nextID(),
      this.cache,
      takeoff.request.plane,
      player.team
    );
    plane.setPos(this.cache, runway.x, 200);
    plane.setFlipped(this.cache, runway.direction == FacingDirection.Left);
    const direction =
      runway.direction == FacingDirection.Left
        ? Math.round(ROTATION_DIRECTIONS / 2)
        : 0;
    // plane.setDirection(this.cache, direction);
    plane.setDirection(this.cache, 32);
    plane.set(this.cache, "health", Math.round(Math.random() * 255));
    this.planes.push(plane);
    // assing plane to player
    player.setControl(this.cache, plane.type, plane.id);
  }

  /**
   * Adds a player to the game,
   * and returns the information.
   */
  public addPlayer(team: Team): Player {
    const player = new Player(this.nextID(), this.cache);
    player.set(this.cache, "team", team);
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
      this.waters,
      this.planes
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

  public requestTakeoff(player: Player, takeoffRequest: TakeoffRequest): void {
    const team = player.team;
    const { plane, runway } = takeoffRequest;
    if (!teamPlanes[team].includes(plane)) {
      return;
    }
    const runwayID = this.getObjectIndex(this.runways, runway);
    // if runway exists, add request to queue to be processed.
    if (runwayID >= 0) {
      this.takeoffQueue.push({
        playerID: player.id,
        request: takeoffRequest
      });
    }
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
