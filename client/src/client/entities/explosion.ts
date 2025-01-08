import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { DrawLayer } from "../constants";
import { ExplosionProperties } from "dogfight-types/ExplosionProperties";
import { Textures } from "../textures";

export class Explosion implements Entity<ExplosionProperties> {

  public props: Required<ExplosionProperties> = {
    client_x: 0,
    client_y: 0,
    team: null
  };

  private container: PIXI.Container;
  private bombSprite: PIXI.Sprite;

  public updateCallbacks: EntityUpdateCallbacks<ExplosionProperties> = {
    client_x: () => {
      this.bombSprite.position.x = this.props.client_x;
    },
    client_y: () => {
      this.bombSprite.position.y = this.props.client_y;
    },
    team: () => { },
  };

  constructor() {
    this.container = new PIXI.Container();

    const texture = Textures["explosion0001.gif"]
    this.bombSprite = new PIXI.Sprite(texture);

    this.container.addChild(this.bombSprite);
    //this.bombSprite.anchor.set(0.5)

    this.container.zIndex = DrawLayer.Bomb;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public destroy() { }
}
