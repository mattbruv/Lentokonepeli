import * as PIXI from "pixi.js";
import { State, StateAction } from "../../../dogfight/src/state";
import { GameSprite } from "./sprite";
import { EntityType } from "../../../dogfight/src/entity";
import { GroundSprite } from "./sprites/ground";
import { GameScreen } from "./constants";
import { DebugView } from "./objects/debug";
import { Vec2d } from "../../../dogfight/src/physics/vector";
import { toPixiCoords } from "./coords";
import { SkyBackground } from "./objects/sky";

/**
 * A class which renders the game world.
 * Uses PIXI.js for 2d Rendering.
 */
export class GameRenderer {
  private spriteSheet: PIXI.Spritesheet;
  /** A list of all Game Entities and their Srite Objects */
  private sprites: GameSprite[] = [];

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

    this.sky = new SkyBackground(this.spriteSheet);

    // Setup pixi classes
    // Make the screen objects layerable.
    this.entityContainer.sortableChildren = true;

    // Add stuff to the appropriate containers
    this.worldContainer.addChild(this.sky.container);
    this.worldContainer.addChild(this.entityContainer);
    this.worldContainer.addChild(this.debug.worldContainer);

    this.gameContainer.addChild(this.worldContainer);
    this.gameContainer.addChild(this.debug.gameContainer);

    // this.pixiApp.stage.addChild(this.sky.container);
    this.pixiApp.stage.addChild(this.gameContainer);

    this.reset();
  }

  private reset(): void {
    this.sprites = [];
  }

  public renderStateList(list: State[]): void {
    list.forEach((state): void => {
      this.renderState(state);
    });
  }

  private renderState(state: State): void {
    if (state.action == StateAction.Delete) {
      this.removeSprite(state.id);
      return;
    }
    if (state.action == StateAction.Create) {
      this.removeSprite(state.id);
      const sprite = this.createSprite(state);
      if (sprite) {
        sprite.update(state.properties);
        this.entityContainer.addChild(sprite.container);
        this.debug.worldContainer.addChild(sprite.debugContainer);
        this.sprites.push(sprite);
      }
      return;
    }
    if (state.action == StateAction.Update) {
      const sprite = this.getSprite(state.id);
      if (sprite) {
        sprite.update(state.properties);
      }
      return;
    }
  }

  private createSprite(state: State): GameSprite {
    switch (state.type) {
      case EntityType.Ground:
        return new GroundSprite(this.spriteSheet, state.id);
    }
  }

  /**
   * Gets a reference to a sprite object by a specific ID
   */
  private getSprite(id: number): GameSprite {
    return this.sprites[this.getSpriteIndex(id)];
  }

  /** Gets the sprite index in the array */
  private getSpriteIndex(id: number): number {
    return this.sprites.findIndex((sprite: GameSprite): boolean => {
      return sprite.entityId === id;
    });
  }

  /**
   * Removes an entity from the game renderer.
   * @param id The entity to remove from the renderer.
   */
  private removeSprite(id: number): void {
    const index = this.getSpriteIndex(id);
    if (index >= 0) {
      this.sprites.splice(index, 1);
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
    this.sky.setCamera(x, y);
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
