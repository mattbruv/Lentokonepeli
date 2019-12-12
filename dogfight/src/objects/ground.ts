import { Terrain } from "../constants";
import { GameObject, GameObjectType, GameObjectData } from "../object";

export interface GroundProperties {
  x: number;
  y: number;
  width: number;
  terrain: Terrain;
}

export class GroundObject extends GameObject<GroundProperties>
  implements GroundProperties {
  public x: number;
  public y: number;
  public width: number;
  public terrain: Terrain;

  public constructor(id: number) {
    super(id, GameObjectType.Ground);
    this.x = 0;
    this.y = 0;
    this.width = 500;
    this.terrain = Terrain.Normal;
  }

  public getState(): GameObjectData {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      terrain: this.terrain
    };
  }
}
