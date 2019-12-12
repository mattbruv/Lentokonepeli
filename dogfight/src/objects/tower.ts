import { FacingDirection, Terrain } from "../constants";
import { GameObject, GameObjectType, GameObjectData } from "../object";

export interface TowerProperties {
  x: number;
  y: number;
  terrain: Terrain;
  direction: FacingDirection;
}

export class TowerObject extends GameObject<TowerProperties>
  implements TowerProperties {
  public x: number;
  public y: number;
  public terrain: Terrain;
  public direction: FacingDirection;

  public constructor(id: number) {
    super(id, GameObjectType.ControlTower);
    this.x = 0;
    this.y = 0;
    this.direction = FacingDirection.Right;
    this.terrain = Terrain.Normal;
  }

  public getState(): GameObjectData {
    return {
      x: this.x,
      y: this.y,
      terrain: this.terrain,
      direction: this.direction
    };
  }
}
