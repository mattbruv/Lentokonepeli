import { GameObject, GameObjectType } from "../object";
import { CacheEntry, Cache } from "../network/cache";

export class Player extends GameObject {
  public type = GameObjectType.Player;
  public name: string;
  public controlType: GameObjectType;
  public controlID: number;

  public constructor(id: number, cache: Cache) {
    super(id);
    this.name = "Player_" + this.id;
    this.controlID = -1;
  }

  public getState(): CacheEntry {
    return {
      type: this.type
    };
  }
}
