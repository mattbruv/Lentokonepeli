import { Team } from "../constants";
import { GameObject, GameObjectType, GameObjectData } from "../object";
import { Change } from "../state";

export enum TrooperState {
  Parachuting,
  Falling,
  Standing,
  Walking
}

export enum TrooperDirection {
  None,
  Left,
  Right
}

export interface TrooperProperties {
  x: number;
  y: number;
  health: number;
  state: TrooperState;
  direction: TrooperDirection;
  team: Team;
}

export class TrooperObject extends GameObject<TrooperProperties>
  implements TrooperProperties {
  public x: number;
  public y: number;
  public health: number;
  public state: TrooperState;
  public direction: TrooperDirection;
  public team: Team;

  public constructor(id: number) {
    super(id, GameObjectType.Trooper);
    this.x = 0;
    this.y = 0;
    this.direction = TrooperDirection.None;
    this.health = 255;
  }

  public move(): Change {
    this.x += 1;
    return {
      id: this.id,
      type: GameObjectType.Trooper,
      data: {
        x: this.x
      }
    };
  }

  public getState(): GameObjectData {
    return {
      x: this.x,
      y: this.y,
      health: this.health,
      state: this.state,
      direction: this.direction,
      team: this.team
    };
  }
}
