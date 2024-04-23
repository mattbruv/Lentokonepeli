import * as PIXI from "pixi.js";
import { SKY_COLOR } from "./constants";
import { Viewport } from "pixi-viewport";
import { Ground } from "./entities/ground";
import { Water } from "./entities/water";
import { EntityChange } from "dogfight-types/EntityChange";
import { EntityProperties } from "dogfight-types/EntityProperties";
import { EntityType } from "dogfight-types/EntityType";
import { loadTextures } from "./textures";
import { Coast } from "./entities/coast";

export class DogfightClient {
  // https://pixijs.download/v7.x/docs/index.html
  private app: PIXI.Application<HTMLCanvasElement>;
  private viewport: Viewport;

  private grounds: Map<number, Ground> = new Map();
  private waters: Map<number, Water> = new Map();
  private coasts: Map<number, Coast> = new Map();

  constructor() {
    this.app = new PIXI.Application<HTMLCanvasElement>({
      backgroundColor: SKY_COLOR,
    });

    this.viewport = new Viewport({
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);

    this.viewport.drag().pinch().wheel().decelerate();
  }
  public async init(element: HTMLDivElement) {
    await loadTextures();
    this.appendView(element);
  }

  private appendView(element: HTMLDivElement) {
    element?.appendChild(this.app.view);
  }

  public updateEntities(changes: EntityChange[]) {
    for (const change of changes) {
      const { ent_type, id, update } = change;

      switch (update.type) {
        case "Deleted": {
          this.deleteEntity(id, ent_type);
          break;
        }
        case "Properties": {
          this.updateEntity(id, update.data);
        }
      }
    }
  }

  private deleteEntity(id: number, ent_type: EntityType) {
    switch (ent_type) {
      case "Ground": {
        this.grounds.get(id)?.destroy();
        this.grounds.delete(id);
        break;
      }
      case "Water": {
        this.waters.get(id)?.destroy();
        this.waters.delete(id);
        break;
      }
      case "Coast": {
        this.coasts.get(id)?.destroy();
        this.coasts.delete(id);
        break;
      }
    }
  }

  private updateEntity(id: number, data: EntityProperties) {
    switch (data.type) {
      case "Ground": {
        let ground = this.grounds.get(id);
        if (!ground) {
          ground = new Ground();
          this.grounds.set(id, ground);
          this.viewport.addChild(ground.getContainer());
        }
        ground.updateProperties(data.props);
        break;
      }
      case "Water": {
        let water = this.waters.get(id);
        if (!water) {
          water = new Water();
          this.waters.set(id, water);
          this.viewport.addChild(water.getContainer());
        }
        water.updateProperties(data.props);
        break;
      }
      case "Coast": {
        let coast = this.coasts.get(id);
        if (!coast) {
          coast = new Coast();
          this.coasts.set(id, coast);
          this.viewport.addChild(coast.getContainer());
        }
        coast.updateProperties(data.props);
        break;
      }
    }
  }
}
