import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

import { EntityState, readBinaryPacket } from "../client";
import { EntityType } from "../network/game/EntityType";
import { Background } from "./background";
import { Ground } from "./entities/ground";
import { World } from "./world";
import { SocketConnection } from "../network/socket";
import { Debug } from "./debug";
import { Entity } from "./entity";
import { Coast } from "./entities/coast";
import { Runway } from "./entities/runway";

let conn: SocketConnection;

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

interface EntityMap {
  [key: number]: Entity;
}

export class GameClient {
  private app: PIXI.Application;
  private viewport: Viewport;
  private debug: Debug;

  private background = new Background();
  private world = new World();
  private entities: EntityMap = {};

  constructor() {
    this.app = new PIXI.Application({
      antialias: false,
    });

    this.app.stage.interactive = true;

    this.debug = new Debug(this.app.renderer);

    this.viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 1000,
      worldHeight: 1000,

      interaction: this.app.renderer.plugins.interaction,
    });

    this.viewport.drag().pinch().wheel().clampZoom({
      minWidth: 100,
      maxWidth: 3000,
    });

    this.app.stage.addChild(this.background.container);
    this.app.stage.addChild(this.viewport);
    this.viewport.addChild(this.world.container);

    // Debug info
    this.app.stage.addChild(this.debug.grid.container);
    this.app.stage.addChild(this.debug.container);
    console.log(this.debug);

    this.viewport.addListener("moved", (event) => {
      this.updateGrid(event);
    });
    this.debug.grid.setSize(this.app.view.width, this.app.view.height);

    this.app.stage.on("mousemove", (ev: PIXI.InteractionEvent) => {
      const pos = this.viewport.toLocal(ev.data.global);
      this.debug.setCoords(pos.x, pos.y);
    });
  }

  public disconnect() {
    if (conn) {
      conn.socket.close();
    }
  }

  public connect(url: string, onConnect: () => void) {
    console.log(url);

    conn = new SocketConnection(url);

    conn.socket.onopen = (ev) => {
      console.log("Connected to " + url);
      onConnect();
    };

    conn.socket.onmessage = (ev) => {
      let data;
      if (ev.data instanceof ArrayBuffer) {
        data = readBinaryPacket(ev.data);
        this.applyGameState(data);
      } else {
        data = JSON.parse(ev.data);
      }
    };
  }

  private updateGrid(event: any) {
    const view = event.viewport;
    const box = view.hitArea;
    //console.log(view)
    this.debug.grid.setScale(event.viewport.scale);
    const height = view.screenHeightInWorldPixels;
    const width = view.screenWidthInWorldPixels;
    this.debug.grid.setSize(width, height);
    this.debug.grid.setPos(-view.left, -view.top);
  }

  public appendCanvas(element: string) {
    const el = document.querySelector(element);
    if (el) {
      el.appendChild(this.app.view);
    }
  }

  private addEntity(id: number, ent: Entity) {
    if (this.entities[id] !== undefined) {
      console.log("Entity alread exists with id", id);
    }
    this.entities[id] = ent;
  }

  private getEntity(id: number): Entity {
    return this.entities[id];
  }

  private removeEntity(id: number) {
    if (this.entities[id] == undefined) {
      console.log("Attempted to remove non-existing entity:", id);
      return;
    }
    this.entities[id].destroy();
    delete this.entities[id];
  }

  public applyGameState(state: EntityState[]) {
    for (const s of state) {
      const id = s.id;
      const type = s.type;
      //console.log("apply", "id:", id, "type:", EntityType[type]);

      const ent = this.getEntity(id);

      if (ent) {
        ent.update(s.data);
        continue;
      }

      switch (type) {
        case EntityType.GROUND: {
          const g = new Ground();
          g.update(s.data);
          this.addEntity(id, g);
          this.world.container.addChild(g.sprite);
          break;
        }
        case EntityType.COAST: {
          const c = new Coast();
          c.update(s.data);
          this.addEntity(id, c);
          this.world.container.addChild(c.sprite);
          break;
        }
        case EntityType.RUNWAY: {
          const r = new Runway();
          r.update(s.data);
          this.addEntity(id, r);
          this.world.container.addChild(r.container);
          break;
        }
      }
    }
  }
}
