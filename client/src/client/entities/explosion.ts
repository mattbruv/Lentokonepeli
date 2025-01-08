import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { DrawLayer } from "../constants";
import { ExplosionProperties } from "dogfight-types/ExplosionProperties";
import { Textures } from "../textures";

const PHASE_TEXTURES: Record<number, PIXI.Texture> = {
  0: Textures["explosion0001.gif"],
  1: Textures["explosion0002.gif"],
  2: Textures["explosion0003.gif"],
  3: Textures["explosion0004.gif"],
  4: Textures["explosion0005.gif"],
  5: Textures["explosion0006.gif"],
  6: Textures["explosion0007.gif"],
  7: Textures["explosion0008.gif"],
}

export class Explosion implements Entity<ExplosionProperties> {

  public props: Required<ExplosionProperties> = {
    client_x: 0,
    client_y: 0,
    phase: 0,
    team: null,
  };

  private container: PIXI.Container;
  private bombSprite: PIXI.Sprite;

  public updateCallbacks: EntityUpdateCallbacks<ExplosionProperties> = {
    client_x: () => {
      this.bombSprite.position.x = this.props.client_x;
      console.log(this.props.client_x);
    },
    client_y: () => {
      this.bombSprite.position.y = this.props.client_y;
      console.log(this.props.client_y);
    },
    phase: () => {
      this.bombSprite.texture = PHASE_TEXTURES[this.props.phase]
      console.log("PHASE: ", this.props.phase);
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
