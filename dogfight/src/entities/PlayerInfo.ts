import { Entity, EntityType } from "../entity";
import { CacheEntry, Cache } from "../network/cache";
import { Team } from "../constants";
import { PlayerInput, InputKey } from "../input";
import { GameWorld } from "../world/world";
import { teamPlanes, Plane } from "./Plane";
import { Ownable } from "../ownable";
import { Man } from "./Man";

export enum PlayerStatus {
  Playing,
  Takeoff,
  Spectating
}

export class PlayerInfo extends Entity {
  public type = EntityType.Player;
  public name: string;
  public team: Team;
  public controlType: EntityType;
  public controlID: number;
  public status: PlayerStatus;
  public ping: number;

  public inputState: PlayerInput;


  private fuelMax = 255;
  private healthMax = 255;
  private ammoMax = 255;
  private teamKills = 0;
  private shots = 0;
  private hits = 0;
  private fuel = this.fuelMax;
  private health = this.healthMax;
  private ammo = this.ammoMax;
  private bombs = this.ammoMax;
  public constructor(id: number, world: GameWorld, cache: Cache) {
    super(id, world);
    this.name = "Player_" + this.id;
    this.controlType = EntityType.None;
    this.controlID = 0;
    this.team = Team.Spectator;
    this.setStatus(cache, PlayerStatus.Takeoff);
    this.setPing(cache, 0);

    // initialize player input to all false.
    this.inputState = {};
    for (const keyIndex in InputKey) {
      this.inputState[keyIndex] = false;
    }
  }

  public getTeam(): Team {
    return this.team;
  }

  public getControlId(): number {
    return this.controlID;
  }
  public getControlType(): number {
    return this.controlType;
  }
  public isControlling(e: Entity): boolean {
    return e.getId() == this.getControlId() && e.getType() == this.getControlType();
  }

  public getFuel() {
    return this.fuel;
  }
  public setFuel(fuel: number) {
    this.fuel = fuel;
    //this.set(this.world.cache, "fuel", fuel);
  }

  public getHealth() {
    return this.health;
  }
  public setHealth(health: number) {
    this.health = health;
    //this.set(this.world.cache, "health", health);
  }

  public getAmmo() {
    return this.ammo;
  }
  public setAmmo(ammo: number) {
    this.ammo = ammo;
    //this.set(this.world.cache, "ammo", ammo);
  }
  public getBombs() {
    return this.bombs;
  }
  public setBombs(bombs: number) {
    this.bombs = bombs;
    //this.set(this.world.cache, "bombs", bombs);
  }

  public setName(cache: Cache, name: string): void {
    this.set(cache, "name", name);
  }

  public setPing(cache: Cache, ping: number): void {
    this.set(cache, "ping", ping);
  }

  public setStatus(cache: Cache, status: PlayerStatus): void {
    this.set(cache, "status", status);
  }

  public setControl(
    cache: Cache,
    controlType: EntityType,
    controlID: number
  ): void {
    this.set(cache, "controlType", controlType);
    this.set(cache, "controlID", controlID);
  }

  // STAT handling functions
  //public submitBullet(p: Ownable, b1: boolean, b2: boolean): void { }
  public submitBomb(p: Ownable, b1: boolean, b2: boolean): void { }
  public submitTeamBomb(p: Ownable, b1: boolean): void { }
  public submitKill(p: Ownable, p2: Ownable): void { }
  public submitTeamKill(p: Ownable, p2: Ownable): void { }
  public submitParachute(p: Plane, p2: Man): void { }


  public getState(): CacheEntry {
    return {
      type: this.type,
      name: this.name,
      team: this.team,
      ping: this.ping,
      controlType: this.controlType,
      controlID: this.controlID,
      status: this.status,
      //fuel: this.fuel,
      //ammo: this.ammo,
      //health: this.health,
      //bombs: this.bombs,
    };
  }
}
