import { Entity, EntityUpdateCallbacks, Followable, Point, RadarEnabled } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer } from "../constants";
import { ManProperties } from "dogfight-types/ManProperties";
import { Stats } from "../hud";
import { RadarObject, RadarObjectType } from "../radar";

export class Man implements Entity<ManProperties>, Followable, RadarEnabled {

  public props: Required<ManProperties> = {
    client_x: 0,
    client_y: 0,
    state: "Standing",
    team: "Allies",
  };

  private container: PIXI.Container;
  private manSprite: PIXI.Sprite;
  private frameCount = 0;

  constructor() {
    this.container = new PIXI.Container();
    this.manSprite = new PIXI.Sprite();

    const texture = Textures["parachuter0.gif"];

    this.manSprite.texture = texture;

    // set anchor point at bottom middle
    this.manSprite.anchor.set(0.5, 0);
    this.manSprite.position.x = texture.width / 2

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

  public getStats(): Stats {
    return {
      health: 255,
      ammo: 255,
      bombs: 1
    }
  }

  public getCenter(): Point {
    return {
      x: this.props.client_x ?? 0,
      y: this.props.client_y ?? 0,
    };
  }

  public destroy() { }

  private updateX(): void {
    this.container.position.x = this.props.client_x;
  }

  private updateY(): void {
    this.container.position.y = this.props.client_y;
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
  private updateTeam(): void { }

  public getRadarInfo(): RadarObject {
    return {
      type: RadarObjectType.Man,
      x: this.props.client_x,
      y: this.props.client_y,
      team: this.props.team
    }
  }

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
