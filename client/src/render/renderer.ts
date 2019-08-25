import * as PIXI from "pixi.js";
import { GridSprite } from "./objects/grid";
import { toPixiCoords } from "./helpers";
import { EventManager } from "./event";
import { SCREEN_WIDTH, SCREEN_HEIGHT, PANEL_HEIGHT } from "./constants";
import { EntitySprite } from "./objects/entity";
import { Entity } from "../../../dogfight/src/entities/entity";
import { EntityType } from "../../../dogfight/src/constants";
import { WaterSprite } from "./objects/water";
import { WaterEntity } from "../../../dogfight/src/entities/water";
import { GroundSprite } from "./objects/ground";
import { GroundEntity } from "../../../dogfight/src/entities/ground";
import { SkySprite } from "./objects/sky";
import { HillSprite } from "./objects/hill";
import { HillEntity } from "../../../dogfight/src/entities/hill";
import { RunwaySprite } from "./objects/runway";
import { RunwayEntity } from "../../../dogfight/src/entities/runway";
import { GameHUD } from "./objects/hud";

/**
 * A class which holds the PIXI object
 * and a renderable representation of game state.
 */
export class GameRenderer {
  public app: PIXI.Application;
  public worldContainer: PIXI.Container;
  public grid: GridSprite;
  public HUD: GameHUD;
  public debug: boolean;

  private sky: SkySprite;

  /** A list of all game sprite objects currently being rendered */
  public entitySprites: EntitySprite[];

  private eventManager: EventManager;

  public constructor() {
    this.app = new PIXI.Application({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: 0xf984e5,
      antialias: false
    });

    this.entitySprites = [];

    this.worldContainer = new PIXI.Container();
    this.worldContainer.sortableChildren = true;

    this.HUD = new GameHUD();

    this.grid = new GridSprite(this.app.renderer);
    this.sky = new SkySprite();

    this.app.stage.addChild(this.sky.sprite);
    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.grid.gridContainer);
    this.app.stage.addChild(this.HUD.container);

    this.eventManager = new EventManager(this);
    this.eventManager.makeInteractive();

    this.setDebug(false);
  }

  public addEntity(entity: Entity): void {
    if (this.entityExists(entity.id)) {
      this.deleteEntity(entity.id);
    }

    let newEntity: EntitySprite;

    switch (entity.type) {
      case EntityType.Water:
        newEntity = new WaterSprite(entity as WaterEntity);
        break;
      case EntityType.Ground:
        newEntity = new GroundSprite(entity as GroundEntity);
        break;
      case EntityType.Hill:
        newEntity = new HillSprite(entity as HillEntity);
        break;
      case EntityType.Runway:
        newEntity = new RunwaySprite(entity as RunwayEntity);
        break;
      default:
        return;
    }

    newEntity.renderables.map((obj): void => {
      this.worldContainer.addChild(obj);
    });

    this.entitySprites.push(newEntity);
  }

  /**
   * Deletes an entity's sprite and removes it from the internal entity list.
   * @param destroyID The entity id to reference for deletion
   */
  public deleteEntity(destroyID: number): void {
    // Find the entity in the sprite list
    const entObj = this.entitySprites.find((e): boolean => e.id === destroyID);

    if (entObj === undefined) {
      console.log("Attempted to delete undefined entity id: " + destroyID);
      return;
    }

    // Gracefully stop and clean up all animations, etc.
    entObj.onDestroy();

    // Destroy all of its renderable PIXI objects
    entObj.renderables.map((obj): void => {
      obj.destroy();
    });

    // Update our entity array to omit this entity ID
    this.entitySprites = this.entitySprites.filter(
      (e: EntitySprite): boolean => {
        return e.id !== destroyID;
      }
    );
  }

  private entityExists(entityID: number): boolean {
    const result =
      this.entitySprites.find((e): boolean => e.id === entityID) !== undefined;
    return result;
  }

  /**
   * Sets the camera to an (x, y) position in PIXI space.
   * @param x PIXI world X position
   * @param y PIXI world Y position
   */
  public setCamera(x: number, y: number): void {
    // this.updateParallax(x, y);
    this.worldContainer.position.set(x, y);
    this.grid.setCamera(x, y);
    this.sky.setCamera(x, y);
  }

  /**
   * Centers the camera on a (x, y) position.
   *
   * Coordinates must be in game world space.
   * @param x Game world X position
   * @param y Game world Y position
   */
  public centerCamera(x: number, y: number): void {
    const canvasWidth = this.app.screen.width;
    const canvasHeight = this.app.screen.height - PANEL_HEIGHT;
    const pos = toPixiCoords({ x: -x, y: -y });
    pos.x += Math.round(canvasWidth / 2);
    pos.y += Math.round(canvasHeight / 2);

    this.worldContainer.position.set(pos.x, pos.y);
    this.grid.setCamera(pos.x, pos.y);
    this.sky.setCamera(pos.x, pos.y);
  }

  private getSpritesByType(type: EntityType): EntitySprite[] {
    return this.entitySprites.filter((e): boolean => {
      return e.type === type;
    });
  }

  /**
   * Returns the PIXI view
   */
  public getView(): HTMLCanvasElement {
    return this.app.view;
  }

  public setDebug(active: boolean): void {
    this.debug = active;
    this.grid.setEnabled(this.debug);

    this.entitySprites.map((e): void => {
      e.setDebug(this.debug);
    });
  }

  /**
   * Resizes the view of the canvas
   * and adjusts all game elements accordingly
   */
  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.grid.resizeGrid(width, height);
    this.sky.resizeSky(width, height);
  }
}
