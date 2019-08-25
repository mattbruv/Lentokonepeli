import { GameEngine } from "../../dogfight/src/engine/engine";
import { GameRenderer } from "./render/renderer";
import { Entity } from "../../dogfight/src/entities/entity";
import { EngineCallbacks } from "../../dogfight/src/engine/callbacks";

export class GameClient {
  public renderer: GameRenderer;
  public localEngine: GameEngine;

  public constructor() {
    this.renderer = new GameRenderer();
    this.localEngine = new GameEngine(this.clientCallbacks());
  }

  public onEntityAdd(newEntity: Entity): void {
    this.renderer.addEntity(newEntity);
  }

  public deleteEntity(id: number): void {
    this.renderer.deleteEntity(id);
  }

  private clientCallbacks(): EngineCallbacks {
    return {
      onEntityAdd: (newEntity: Entity): void => {
        this.onEntityAdd(newEntity);
      },
      onEntityDelete: (id: number): void => {
        this.deleteEntity(id);
      }
    };
  }
}
