import * as PIXI from "pixi.js";
import { EntityType } from "../../../dogfight/src/entity";

export abstract class GameSprite {
  public id: number;
  public type: EntityType;
  public renderables: PIXI.Container[];
  public renderablesDebug: PIXI.Container[];

  public constructor() {
    this.renderables = [];
    this.renderablesDebug = [];
  }

  /**
   * Updates a game object's display after new property changes.
   */
  public update(data: any): void {
    for (const key in data) {
      let value = data[key];
      if (key == "y") {
        // kind of hacky, but it is what it is.
        value *= -1;
      }
      this[key] = value;
    }
    this.redraw();
  }

  /**
   * Renders a game sprite based on the object's properties.
   * Should be called after properties are updated.
   */
  public abstract redraw(): void;

  /**
   * Called when a game object is deleted.
   * Used to clear pixi memory, callbacks,
   * and other client things floating about.
   */
  public abstract destroy(): void;
}
