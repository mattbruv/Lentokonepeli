import { FacingDirection, Team } from "../constants";
import { GameObject, GameObjectType, GameObjectData } from "../object";
import { Change } from "../state";

export interface RunwayProperties {
  x: number;
  y: number;
  direction: FacingDirection;
  team: Team;
  health: number;
}

export class RunwayObject extends GameObject<RunwayProperties>
  implements RunwayProperties {
  public x: number;
  public y: number;
  public direction: FacingDirection;
  public team: Team;
  public health: number;

  public constructor(id: number) {
    super(id, GameObjectType.Runway);
    this.x = 0;
    this.y = 0;
    this.direction = FacingDirection.Right;
    this.team = Team.Centrals;
    this.health = 255;
  }

  public damage(): Change {
    if (this.health == 0) {
      this.health = 0;
    } else {
      if (Math.random() > 0.5) {
        this.health -= 1;
      }
    }
    return {
      id: this.id,
      type: this.type,
      data: { x: this.x, health: this.health }
    };
  }

  public getState(): GameObjectData {
    return {
      x: this.x,
      y: this.y,
      direction: this.direction,
      team: this.team,
      health: this.health
    };
  }
}
