import { Entity, EntityUpdateCallbacks, Followable, Point } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer } from "../constants";
import { Team } from "dogfight-types/Team";
import { ManProperties } from "dogfight-types/ManProperties";

export class Man implements Entity<ManProperties>, Followable {
  public props: ManProperties = {};
  private container: PIXI.Container;
  private manSprite: PIXI.Sprite;
  private frameCount = 0;

  constructor() {
    this.container = new PIXI.Container();
    this.manSprite = new PIXI.Sprite();

    const texture = Textures["parachuter1.gif"];

    this.manSprite.texture = texture;

    // set anchor point at bottom middle
    this.manSprite.anchor.set(0.5, 1);

    this.container.addChild(this.manSprite);

    this.container.zIndex = DrawLayer.Man;

    setInterval(() => this.animateWalk(), 100);
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
  public getCenter(): Point {
    return {
      x: this.props.client_x ?? 0,
      y: this.props.client_y ?? 0,
    };
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

  private updateState(): void {
    switch (this.props.state) {
      case "Falling": {
        this.manSprite.texture = Textures["parachuter0.gif"];
        break;
      }
      case "Parachuting": {
        this.manSprite.texture = Textures["parachuter1.gif"];
        break;
      }
      case "Standing": {
        this.manSprite.texture = Textures["parachuter0.gif"];
        break;
      }
      case "WalkingLeft": {
        //this.manSprite.anchor.x = -0.5;
        this.manSprite.scale.x = 1;
        break;
      }
      case "WalkingRight": {
        //this.manSprite.anchor.x = 1;
        this.manSprite.scale.x = -1;
        break;
      }
    }
  }
  private updateTeam(): void {}

  private animateWalk(): void {
    if (
      !(this.props.state == "WalkingLeft" || this.props.state == "WalkingRight")
    ) {
      return;
    }

    if (this.frameCount == 0) {
      this.manSprite.texture = Textures["parachuter3.gif"];
      this.frameCount = 1;
    } else if (this.frameCount == 1) {
      this.manSprite.texture = Textures["parachuter2.gif"];
      this.frameCount = 0;
    }
  }
}
