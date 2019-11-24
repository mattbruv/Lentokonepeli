import * as PIXI from "pixi.js";
import { State, StateAction } from "../../../dogfight/src/state";
import { GameSprite } from "./sprite";
import { EntityType } from "../../../dogfight/src/entity";
import { GroundSprite } from "./sprites/ground";
import { GameScreen } from "./constants";
import { DebugView } from "./objects/debug";
import { Vec2d } from "../../../dogfight/src/physics/vector";

/**
 * A class which renders the game world.
 * Uses PIXI.js for 2d Rendering.
 */
export class GameRenderer {
  private spriteSheet: PIXI.Spritesheet;
  /** A list of all Game Entities and their Srite Objects */
  private sprites: GameSprite[] = [];

  private pixiApp: PIXI.Application;
  public gameContainer: PIXI.Container;
  public worldContainer: PIXI.Container;
  private debug: DebugView;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spriteSheet = spritesheet;
    // Initialize PIXI classes
    this.pixiApp = new PIXI.Application({
      width: GameScreen.Width,
      height: GameScreen.Height,
      backgroundColor: 0xf984e5,
      antialias: false
    });
    this.gameContainer = new PIXI.Container();
    this.worldContainer = new PIXI.Container();
    this.debug = new DebugView(this.pixiApp.renderer);
    this.debug.setEnabled(true);

    // Setup pixi classes
    // Make the screen objects layerable.
    this.gameContainer.sortableChildren = true;
    this.worldContainer.sortableChildren = true;

    // Add stuff to the appropriate containers
    this.gameContainer.addChild(this.debug.container);
    this.gameContainer.addChild(this.worldContainer);

    // Add containers to main stage
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
        this.worldContainer.addChild(sprite.container);
        this.debug.container.addChild(sprite.debugContainer);
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

  public setCursorPosInGame(pos: Vec2d): void {
    if (this.debug.isEnabled()) {
      this.debug.setCursorPos(pos);
    }
  }

  public toggleDebugMode(): void {
    const active = this.debug.isEnabled();
    this.debug.setEnabled(!active);
  }
}
