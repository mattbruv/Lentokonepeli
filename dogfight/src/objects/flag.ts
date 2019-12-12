import { Team } from "../constants";
import { GameObject, GameObjectType, GameObjectData } from "../object";

export interface FlagProperties {
  x: number;
  y: number;
  team: Team;
}

export class FlagObject extends GameObject<FlagProperties>
  implements FlagProperties {
  public x: number;
  public y: number;
  public team: Team;

  public constructor(id: number) {
    super(id, GameObjectType.Flag);
    this.x = 0;
    this.y = 0;
    this.team = Team.Centrals;
  }

  public getState(): GameObjectData {
    return {
      x: this.x,
      y: this.y,
      team: this.team
    };
  }
}
