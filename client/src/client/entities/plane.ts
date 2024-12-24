import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import { PlaneProperties } from "dogfight-types/PlaneProperties";

export class Plane implements Entity<PlaneProperties> {
  public props: Required<PlaneProperties> = {
    client_x: 0,
    client_y: 0,
    plane_type: "Albatros"
  };

  constructor() { }

  public getContainer(): PIXI.Container {
    return new PIXI.Container();
  }

  public updateCallbacks: EntityUpdateCallbacks<PlaneProperties> = {
    client_x: () => { },
    client_y: () => { },
    plane_type: () => { }
  };

  public destroy() { }
}
