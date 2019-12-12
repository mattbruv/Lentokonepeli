import { Terrain } from "../constants";
import { GameObject, GameObjectType, GameObjectData } from "../object";

export interface HillProperties {
  x: number;
  y: number;
  terrain: Terrain;
}

export class HillObject extends GameObject<HillProperties>
  implements HillProperties {
  public x: number;
  public y: number;
  public terrain: Terrain;

  public constructor(id: number) {
    super(id, GameObjectType.Hill);
    this.x = 0;
    this.y = 0;
    this.terrain = Terrain.Normal;
  }

  public getState(): GameObjectData {
    return {
      x: this.x,
      y: this.y,
      terrain: this.terrain
    };
  }
}
