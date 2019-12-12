import { FacingDirection } from "../constants";
import { GameObject, GameObjectType, GameObjectData } from "../object";

export interface WaterProperties {
  x: number;
  y: number;
  width: number;
  direction: FacingDirection;
}

export class WaterObject extends GameObject<WaterProperties>
  implements WaterProperties {
  public x: number;
  public y: number;
  public width: number;
  public direction: FacingDirection;

  public constructor(id: number) {
    super(id, GameObjectType.Water);
    this.x = 0;
    this.y = 0;
    this.width = 500;
    this.direction = FacingDirection.Right;
  }

  public getState(): GameObjectData {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      direction: this.direction
    };
  }
}
