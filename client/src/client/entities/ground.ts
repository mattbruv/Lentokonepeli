import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity } from "./entity";
import { Container, DisplayObject } from "pixi.js";
import * as PIXI from "pixi.js";

export class Ground implements Entity<GroundProperties> {
  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }
  public updateProperties(props: GroundProperties): void {
    if (props.width) {
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
