import { Terrain } from "../constants";
import { GameObject, GameObjectType, GameObjectData } from "../object";

/*
export interface GroundProperties {
  x: number;
  y: number;
  width: number;
  terrain: Terrain;
}
*/

export class GroundObject extends GameObject {
  public x: number;
  public y: number;
  public width: number;
  public terrain: Terrain;

  public constructor(id: number) {
    super(id);
    this.set("x", "3");
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
