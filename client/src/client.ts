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

  private onEntityAdd(newEntity: Entity): void {
    this.renderer.addEntity(newEntity);
  }

  private onEntityUpdate(data: Partial<Entity>): void {
    const fullObject = this.localEngine.getEntity(data.id);
    console.log("fullObj");
    console.log(fullObject);
    this.renderer.updateEntity(fullObject);
  }

  private deleteEntity(id: number): void {
    this.renderer.deleteEntity(id);
  }

  private clientCallbacks(): EngineCallbacks {
    return {
      onEntityAdd: (newEntity: Entity): void => {
        this.onEntityAdd(newEntity);
      },
      onEntityUpdate: (data: Partial<Entity>): void => {
        this.onEntityUpdate(data);
      },
      onEntityDelete: (id: number): void => {
        this.deleteEntity(id);
      }
    };
  }
}
