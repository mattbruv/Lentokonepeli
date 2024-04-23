import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { WaterProperties } from "dogfight-types/WaterProperties";
import { DrawLayer } from "../constants";

export class Water implements Entity<WaterProperties> {
  private container: PIXI.Container;
  private waterGraphics: PIXI.Graphics;

  constructor() {
    this.container = new PIXI.Container();
    this.waterGraphics = new PIXI.Graphics();
    this.container.addChild(this.waterGraphics);

    this.container.zIndex = DrawLayer.LAYER_11;
  }

  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }

  public updateProperties(props: WaterProperties): void {
    if (props.width !== null) {
      this.waterGraphics.width = props.width;
    }

    if (props.terrain !== null) {
      switch (props.terrain) {
        case "Normal": {
          break;
        }
        case "Desert": {
          break;
        }
      }
    }
  }

  public destroy() {}
}
