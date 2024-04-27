import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer } from "../constants";
import { Team } from "dogfight-types/Team";
import { ManProperties } from "dogfight-types/ManProperties";

export class Man implements Entity<ManProperties> {
  public props: ManProperties = {};
  private container: PIXI.Container;
  private manSprite: PIXI.Sprite;

  constructor() {
    this.container = new PIXI.Container();
    this.manSprite = new PIXI.Sprite();

    const texture = Textures["parachuter1.gif"];

    this.manSprite.texture = texture;

    // set anchor point at bottom middle
    this.manSprite.anchor.set(0.5, 1);

    this.container.addChild(this.manSprite);

    this.container.zIndex = DrawLayer.LAYER_10_LAYER_12;
  }

  public callbackOrder: (keyof ManProperties)[] = ["client_x", "client_y"];

  public updateCallbacks: EntityUpdateCallbacks<ManProperties> = {
    client_x: () => this.updateX(),
    client_y: () => this.updateY(),
    team: () => this.updateTeam(),
    state: () => this.updateState(),
  };

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public destroy() {}

  private updateX(): void {
    if (!this.props.client_x) return;
    this.manSprite.position.x = this.props.client_x;
  }

  private updateY(): void {
    if (!this.props.client_y) return;
    this.manSprite.position.y = this.props.client_y;
  }

  private updateState(): void {}
  private updateTeam(): void {}
}
