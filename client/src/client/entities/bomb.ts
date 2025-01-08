import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { directionToRadians } from "../helpers";
import { BombProperties } from "dogfight-types/BombProperties";


export class Bomb implements Entity<BombProperties> {

  private container: PIXI.Container;
  private bombSprite: PIXI.Sprite;

  public props: Required<BombProperties> = {
    client_x: 0,
    client_y: 0,
    direction: 0,
  };

  constructor() {
    this.container = new PIXI.Container();
    const texture = Textures["bomb.gif"]
    this.bombSprite = new PIXI.Sprite(texture);
    this.bombSprite.anchor.set(0.5, 0.5)
    this.bombSprite.position.set(texture.width / 2, texture.height / 2)
    this.container.addChild(this.bombSprite)
  }

  public getContainer(): PIXI.Container {
    console.log(this.container)
    console.log("FUCK")
    return this.container
  }

  public updateCallbacks: EntityUpdateCallbacks<BombProperties> = {
    client_x: () => {
      this.container.position.x = this.props.client_x
    },
    client_y: () => {
      this.container.position.y = this.props.client_y
    },
    direction: () => {
      console.log(this.props.direction)
      this.bombSprite.rotation = directionToRadians(this.props.direction)
    }
  };

  public destroy() { }
}
