import { GameMap } from "./map";
import { GameState, Action } from "./state";
import { FlagObject } from "./objects/flag";
import { GroundObject } from "./objects/ground";
import { RunwayObject } from "./objects/runway";
import { TowerObject } from "./objects/tower";
import { TrooperObject, TrooperState } from "./objects/trooper";
import { WaterObject } from "./objects/water";
import { HillObject } from "./objects/hill";
import { getUniqueID, GameObjectData, GameObject } from "./object";
import { PlayerObject } from "./objects/player";

/**
 * The Game World contains all entites,
 * World state, etc. of a game.
 */
export class GameWorld {
  // A list of changes from this tick.
  private changes: GameState;

  private players: PlayerObject[];

  private flags: FlagObject[];
  private grounds: GroundObject[];
  private hills: HillObject[];
  private runways: RunwayObject[];
  private towers: TowerObject[];
  private troopers: TrooperObject[];
  private waters: WaterObject[];

  public constructor() {
    this.clearChanges();
    this.resetWorld();
  }

  public clearChanges(): void {
    this.changes = {};
  }

  /**
   * Creates a new player in the game and
   * returns their ID.
   */
  public createPlayer(): number {
    const player = new PlayerObject(getUniqueID(this.players));
    this.players.push(player);
    this.applyCreate(player);
    return player.id;
  }

  private resetWorld(): void {
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
  public tick(deltaTime: number): GameState {
    if (this.troopers.length == 0) {
      const trooper = new TrooperObject(getUniqueID(this.troopers));
      trooper.setData({
        x: 0,
        y: 200,
        state: TrooperState.Parachuting
      });
      this.troopers.push(trooper);
      this.applyCreate(trooper);
    }

    // move troopers.
    this.troopers.forEach((man): void => {
      this.applyChange(man, man.move(deltaTime), Action.Update);
      // console.log(man.x);
      // blow them up if they're too far.
      if (man.x > 350) {
        this.deleteObject(this.troopers, man);
      }
    });

    return this.changes;
  }

  public logWorld(): void {
    console.log("Game World:");
  }

  /**
   * Broadcasts the creation of an object.
   * @param obj The new game object to broadcast.
   */
  private applyCreate(obj: GameObject<any>): void {
    this.applyChange(obj, obj.getState(), Action.Create);
  }

  /**
   * Broadcasts the deletion of an object.
   * @param obj The game object to broadcast deletion.
   */
  private applyDelete(obj: GameObject<any>): void {
    this.applyChange(obj, {}, Action.Delete);
  }

  private deleteObject(array: GameObject<any>[], obj: GameObject<any>): void {
    let found = false;
    let index = 0;
    for (let i = 0; i < array.length; i++) {
      if (obj.id === array[i].id) {
        found = true;
        break;
      }
      index++;
    }
    if (found) {
      array.splice(index, 1);
      this.applyDelete(obj);
    }
  }

  private applyChange(
    obj: GameObject<any>,
    data: GameObjectData,
    action: Action
  ): void {
    if (this.changes[obj.type] == undefined) {
      this.changes[obj.type] = {};
    }
    if (this.changes[obj.type][obj.id] == undefined) {
      this.changes[obj.type][obj.id] = {
        action,
        data: {}
      };
    }
    // disallow 'change' to override 'create'
    // const previous = this.changes[obj.type][obj.id].action;
    const previous = this.changes[obj.type][obj.id].action;
    if (previous == Action.Create && action == Action.Update) {
      action = Action.Create;
    }
    this.changes[obj.type][obj.id].action = action;

    const existing = this.changes[obj.type][obj.id].data;
    this.changes[obj.type][obj.id].data = Object.assign(data, existing);
  }

  public getState(): GameState {
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

    const state: GameState = {};
    for (const objtype in objects) {
      const arr = objects[objtype];
      for (const index in arr) {
        const obj = arr[index];
        const id = obj.id;
        const type = obj.type;
        if (state[type] == undefined) {
          state[type] = {};
        }
        state[type][id] = {
          action: Action.Create,
          data: obj.getState()
        };
      }
    }

    return state;
  }

  public loadMap(map: GameMap): void {
    map.grounds.forEach((ground): void => {
      const obj = new GroundObject(getUniqueID(this.grounds));
      obj.setData(ground);
      this.grounds.push(obj);
    });
    map.flags.forEach((flag): void => {
      const obj = new FlagObject(getUniqueID(this.flags));
      obj.setData(flag);
      this.flags.push(obj);
    });
    map.hills.forEach((hill): void => {
      const obj = new HillObject(getUniqueID(this.hills));
      obj.setData(hill);
      this.hills.push(obj);
    });
    map.runways.forEach((runway): void => {
      const obj = new RunwayObject(getUniqueID(this.runways));
      obj.setData(runway);
      this.runways.push(obj);
    });
    map.towers.forEach((tower): void => {
      const obj = new TowerObject(getUniqueID(this.towers));
      obj.setData(tower);
      this.towers.push(obj);
    });
    map.waters.forEach((water): void => {
      const obj = new WaterObject(getUniqueID(this.waters));
      obj.setData(water);
      this.waters.push(obj);
    });
  }
}
