import * as PIXI from "pixi.js";
import { Vec2d } from "../../../dogfight/src/physics/vector";
import { toGameCoords } from "./helpers";
import { GameRenderer } from "./renderer";

export interface MouseClickEvent {
  clickPos: Vec2d;
  dragging: boolean;
}

export class EventManager {
  private mouseClick: MouseClickEvent;
  private renderer: GameRenderer;

  public constructor(renderer: GameRenderer) {
    this.renderer = renderer;

    this.mouseClick = {
      clickPos: { x: 0, y: 0 },
      dragging: false
    };
  }

  public makeInteractive(): void {
    this.renderer.app.stage.interactive = true;

    window.addEventListener("keypress", (event: KeyboardEvent): void => {
      if (event.code === "Backquote") {
        this.renderer.setDebug(!this.renderer.debug);
      }
      if (this.renderer.debug) {
        if (event.code === "KeyX") {
          this.renderer.grid.toggleAxes();
        }
      }
    });

    this.renderer.app.stage.on(
      "pointerdown",
      (event: PIXI.interaction.InteractionEvent): void => {
        // if (!this.renderer.debug) return;
        this.mouseClick.clickPos = {
          x: event.data.global.x,
          y: event.data.global.y
        };
        this.mouseClick.dragging = true;
      }
    );

    this.renderer.app.stage.on("pointerup", (): void => {
      // if (!this.renderer.debug) return;
      this.mouseClick.dragging = false;
    });

    this.renderer.app.stage.on("pointerupoutside", (): void => {
      // if (!this.renderer.debug) return;
      this.mouseClick.dragging = false;
    });

    this.renderer.app.stage.on(
      "pointermove",
      (event: PIXI.interaction.InteractionEvent): void => {
        // if (!this.renderer.debug) return;
        const local = event.data.getLocalPosition(this.renderer.worldContainer);
        const cursor = toGameCoords(local);
        this.renderer.grid.setCursorCoords(cursor.x, cursor.y);
        if (this.mouseClick.dragging) {
          const pos = event.data.global;
          const prev = this.mouseClick.clickPos;
          const worldPos = this.renderer.worldContainer.position;
          const dx = pos.x - prev.x;
          const dy = pos.y - prev.y;
          const camX = Math.round(worldPos.x + dx);
          const camY = Math.round(worldPos.y + dy);
          this.renderer.setCamera(camX, camY);
          this.mouseClick.clickPos = {
            x: pos.x,
            y: pos.y
          };
        }
      }
    );
  }
}
