import * as PIXI from "pixi.js";
import { SKY_COLOR, VIEW_HEIGHT, VIEW_WIDTH } from "./constants";
import { Viewport } from "pixi-viewport";
import { Ground } from "./entities/ground";
import { Water } from "./entities/water";
import { EntityChange } from "dogfight-types/EntityChange";
import { EntityProperties } from "dogfight-types/EntityProperties";
import { EntityType } from "dogfight-types/EntityType";
import { loadTextures } from "./textures";
import { Coast } from "./entities/coast";
import { Runway } from "./entities/runway";
import { BackgroundItem } from "./entities/backgroundItem";
import { Bunker } from "./entities/bunker";
import { Man } from "./entities/man";
import { GameEvent } from "dogfight-types/GameEvent";

export class DogfightClient {
  // https://pixijs.download/v7.x/docs/index.html
  private app: PIXI.Application<HTMLCanvasElement>;
  private viewport: Viewport;

  private grounds: Map<number, Ground> = new Map();
  private backgroundItems: Map<number, BackgroundItem> = new Map();
  private waters: Map<number, Water> = new Map();
  private coasts: Map<number, Coast> = new Map();
  private runways: Map<number, Runway> = new Map();
  private bunkers: Map<number, Bunker> = new Map();
  private men: Map<number, Man> = new Map();

  constructor() {
    this.app = new PIXI.Application<HTMLCanvasElement>({
      backgroundColor: SKY_COLOR,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
    });

    this.viewport = new Viewport({
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);

    this.viewport.drag().pinch().wheel().decelerate();

    this.viewport.onpointermove = (e) => {
      const pos = this.viewport.toWorld(e.data.global);
      console.log("x", Math.round(pos.x), "y", Math.round(pos.y));
    };
  }
  public async init(element: HTMLDivElement) {
    await loadTextures();
    this.appendView(element);
  }

  private appendView(element: HTMLDivElement) {
    element?.appendChild(this.app.view);
  }

  public handleGameEvents(events: GameEvent[]) {
    for (const event of events) {
      switch (event.type) {
        case "EntityChanges": {
          this.updateEntities(event.data);
          break;
        }
      }
    }
  }

  private updateEntities(changes: EntityChange[]) {
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
      case "Man": {
        this.men.get(id)?.destroy();
        this.men.delete(id);
        break;
      }
      case "BackgroundItem": {
        this.backgroundItems.get(id)?.destroy();
        this.backgroundItems.delete(id);
        break;
      }
      case "Runway": {
        this.runways.get(id)?.destroy();
        this.runways.delete(id);
        break;
      }
      case "Bunker": {
        this.bunkers.get(id)?.destroy();
        this.bunkers.delete(id);
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
      case "Man": {
        let man = this.men.get(id);
        if (!man) {
          man = new Man();
          this.men.set(id, man);
          this.viewport.addChild(man.getContainer());
        }
        man.updateProperties(data.props);
        break;
      }
      case "BackgroundItem": {
        let item = this.backgroundItems.get(id);
        if (!item) {
          item = new BackgroundItem();
          this.backgroundItems.set(id, item);
          this.viewport.addChild(item.getContainer());
        }
        item.updateProperties(data.props);
        break;
      }
      case "Bunker": {
        let bunker = this.bunkers.get(id);
        if (!bunker) {
          bunker = new Bunker();
          this.bunkers.set(id, bunker);
          this.viewport.addChild(bunker.getContainer());
        }
        bunker.updateProperties(data.props);
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
      case "Runway": {
        let runway = this.runways.get(id);
        if (!runway) {
          runway = new Runway();
          this.runways.set(id, runway);
          this.viewport.addChild(runway.getContainer());
        }
        runway.updateProperties(data.props);
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
