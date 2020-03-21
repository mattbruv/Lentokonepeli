import * as PIXI from "pixi.js";
import { GameSprite } from "./sprite";
import { GameScreen } from "./constants";
import { DebugView } from "./objects/debug";
import { Vec2d } from "../../../dogfight/src/physics/vector";
import { toPixiCoords } from "./coords";
import { SkyBackground } from "./objects/sky";
import { GameHud } from "./objects/hud";
import { GameObjectType } from "../../../dogfight/src/object";
import { FlagSprite } from "./sprites/flag";
import { GroundSprite } from "./sprites/ground";
import { WaterSprite } from "./sprites/water";
import { TowerSprite } from "./sprites/tower";
import { HillSprite } from "./sprites/hill";
import { RunwaySprite } from "./sprites/runway";
import { PlayerSprite } from "./sprites/player";
import { TrooperSprite } from "./sprites/trooper";
import { Cache, CacheEntry } from "../../../dogfight/src/network/cache";

/**
 * A class which renders the game world.
 * Uses PIXI.js for 2d Rendering.
 */
export class GameRenderer {
  private spriteSheet: PIXI.Spritesheet;

  /** A JS container of all Game Objects and their Srite Objects */
  private sprites: {};

  private pixiApp: PIXI.Application;

  /**
   * A container that holds the game
   * as it is seen fully.
   * Eg. entities, HUD, etc.
   */
  public gameContainer: PIXI.Container;

  /**
   * Contains all major containers
   * in the world that scale together,
   * such as entities and usernames, etc.
   */
  public worldContainer: PIXI.Container;

  /**
   * This is the overall container for all standard in the game.
   * Entities that belong in the game world go here.
   */
  public entityContainer: PIXI.Container;

  /**
   * A container which draws grids, coords, and
   * bounding boxes onto the screen to help with debugging
   */
  private debug: DebugView;

  public sky: SkyBackground;

  private HUD: GameHud;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spriteSheet = spritesheet;
    // Initialize PIXI classes
    this.pixiApp = new PIXI.Application({
      width: GameScreen.Width,
      height: GameScreen.Height,
      backgroundColor: 0xf984e5,
      antialias: true
    });

    this.gameContainer = new PIXI.Container();
    this.worldContainer = new PIXI.Container();
    this.entityContainer = new PIXI.Container();
    this.gameContainer.interactive = true;

    this.debug = new DebugView(this.pixiApp.renderer);
    this.debug.setEnabled(false);
    this.toggleDebugMode();
    this.toggleGrid();

    this.sky = new SkyBackground(this.spriteSheet);

    this.HUD = new GameHud(spritesheet);

    // Setup pixi classes
    // Make the screen objects layerable.
    this.entityContainer.sortableChildren = true;

    // Add stuff to the appropriate containers
    this.worldContainer.addChild(this.sky.container);
    this.worldContainer.addChild(this.entityContainer);
    this.worldContainer.addChild(this.debug.worldContainer);

    this.gameContainer.addChild(this.worldContainer);
    this.gameContainer.addChild(this.debug.gameContainer);
    this.gameContainer.addChild(this.HUD.container);

    this.pixiApp.stage.addChild(this.gameContainer);

    this.reset();
  }

  private reset(): void {
    this.sprites = {};
  }

  public updateCache(cache: Cache): void {
    for (const id in cache) {
      this.updateCacheEntry(cache[id], id);
    }
  }

  private updateCacheEntry(entry: CacheEntry, id: string): void {
    const { type, ...data } = entry;
    if (this.sprites[type] === undefined) {
      this.sprites[type] = {};
    }
    // if the sprite doesn't exist, create it
    // and add the containers.
    if (this.sprites[type][id] === undefined) {
      this.sprites[type][id] = this.createSprite(type);
      for (const container of this.sprites[type][id].renderables) {
        this.entityContainer.addChild(container);
      }
    }
    const dataLength = Object.keys(data).length;
    if (dataLength > 0) {
      this.sprites[type][id].update(entry);
    } else {
      // if data is empty, that is a signal from the engine to delete the object.
      this.deleteSprite(type, id);
    }
    // console.log(this.sprites[GameObjectType.Player]);
  }

  private deleteSprite(type: number, id: string): void {
    const sprite: GameSprite = this.sprites[type][id];
    if (sprite === undefined) {
      console.log("Attempted to delete undefined sprite:", type, id);
      return;
    }
    // Destroy all window setintervals, etc.
    sprite.destroy();
    for (const container of sprite.renderables) {
      this.worldContainer.removeChild(container);
      container.destroy({ children: true });
    }
    for (const container of sprite.renderablesDebug) {
      this.debug.worldContainer.removeChild(container);
      container.destroy({ children: true });
    }
    delete this.sprites[type][id];
  }

  private createSprite(type: GameObjectType): GameSprite {
    switch (type) {
      case GameObjectType.Flag:
        return new FlagSprite(this.spriteSheet);
      case GameObjectType.Ground:
        return new GroundSprite(this.spriteSheet);
      case GameObjectType.Water:
        return new WaterSprite(this.spriteSheet);
      case GameObjectType.ControlTower:
        return new TowerSprite(this.spriteSheet);
      case GameObjectType.Hill:
        return new HillSprite(this.spriteSheet, this.entityContainer);
      case GameObjectType.Runway:
        return new RunwaySprite(this.spriteSheet);
      case GameObjectType.Player:
        return new PlayerSprite(this.spriteSheet);
      case GameObjectType.Trooper:
        return new TrooperSprite(this.spriteSheet);
      default:
        console.log(
          "ERROR: Failed to create undefined object sprite:",
          GameObjectType[type]
        );
        break;
    }
  }

  public getStage(): PIXI.Container {
    return this.pixiApp.stage;
  }

  public getView(): HTMLCanvasElement {
    return this.pixiApp.view;
  }

  public setCursorPosInGame(gameCoords: Vec2d): void {
    this.debug.setCursorPos(gameCoords);
  }

  /**
   * Sets the camera at a given location
   *
   * WARNING!
   * Coordinates are in PIXIJS form!!
   */
  public setCamera(x: number, y: number): void {
    this.worldContainer.position.set(x, y);
    this.debug.setCamera(x, y);

    // get center of screen to set sky to
    const px = GameScreen.Width / 2;
    const py = GameScreen.Height / 2;
    const point = new PIXI.Point(px, py);
    const center = this.worldContainer.toLocal(point);
    this.sky.setPosition(center.x, center.y);
    this.sky.setCamera(x, y);

    // set hill position
    const hills = this.sprites[GameObjectType.Hill];
    for (const id in hills) {
      hills[id].setCamera();
    }
  }

  public resetZoom(): void {
    this.worldContainer.scale.set(1);
    this.debug.resetZoom();
  }

  public zoom(x: number, y: number, isZoomIn: boolean): void {
    const current = this.worldContainer.scale.x;
    if (isZoomIn && current > 5.0) return;
    if (!isZoomIn && current < 0.1) return;
    const mouse = new PIXI.Point(x, y);
    const local = this.worldContainer.toLocal(mouse);
    const direction = isZoomIn ? 1 : -1;
    const factor = 1 + direction * 0.1;
    this.worldContainer.scale.x *= factor;
    this.worldContainer.scale.y *= factor;
    const newX = Math.round(-(local.x * this.worldContainer.scale.x) + mouse.x);
    const newY = Math.round(-(local.y * this.worldContainer.scale.y) + mouse.y);
    this.debug.zoom(factor);
    this.setCamera(newX, newY);
  }

  /**
   * Center the camera view on a specific (x, y) location
   * Coordinates must be in game world space.
   */
  public centerCamera(x: number, y: number): void {
    const canvasHeight = this.pixiApp.screen.height;
    const canvasWidth = this.pixiApp.screen.width;
    const pos = toPixiCoords({ x: -x, y: -y });
    pos.x += Math.round(canvasWidth / 2);
    pos.y += Math.round(canvasHeight / 2);
    this.setCamera(pos.x, pos.y);
  }

  public dragCamera(deltaX: number, deltaY: number): void {
    const worldPos = this.worldContainer.position;
    const newX = Math.round(worldPos.x + deltaX);
    const newY = Math.round(worldPos.y + deltaY);
    this.setCamera(newX, newY);
  }

  public isDebugEnabled(): boolean {
    return this.debug.isEnabled();
  }

  public toggleDebugMode(): void {
    const active = !this.isDebugEnabled();
    this.debug.setEnabled(active);
    this.pixiApp.stage.cursor = active ? "grab" : "default";
  }

  public toggleGrid(): void {
    this.debug.toggleGrid();
  }
}
