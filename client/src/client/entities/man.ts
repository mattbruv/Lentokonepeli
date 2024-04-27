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
    client_x: [0, () => this.updateX()],
    client_y: [1, () => this.updateY()],
    team: [2, () => this.updateTeam()],
    state: [3, () => this.updateState()],
  };

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public destroy() {}

  private updateX(): void {
    console.log("UDPATE MAN X");
    if (!this.props.client_x) return;
    this.manSprite.position.x = this.props.client_x;
  }

  private updateY(): void {
    console.log("UDPATE MAN Y");
    if (!this.props.client_y) return;
    this.manSprite.position.y = this.props.client_y;
  }

  private updateState(): void {
    console.log("UDPATE MAN STATE");
  }
  private updateTeam(): void {
    console.log("UDPATE MAN TEAM");
  }
}
