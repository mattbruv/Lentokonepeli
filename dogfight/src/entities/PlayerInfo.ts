import { Entity, EntityType } from "../entity";
import { CacheEntry, Cache } from "../network/cache";
import { Team } from "../constants";
import { PlayerInput, InputKey } from "../input";
import { GameWorld } from "../world/world";
import { teamPlanes } from "./plane";

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

  public getState(): CacheEntry {
    return {
      type: this.type,
      name: this.name,
      team: this.team,
      ping: this.ping,
      controlType: this.controlType,
      controlID: this.controlID,
      status: this.status
    };
  }
}
