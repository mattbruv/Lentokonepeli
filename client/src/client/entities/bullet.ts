import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { Howl } from "howler"
import { BulletProperties } from "dogfight-types/BulletProperties";


export class Bullet implements Entity<BulletProperties> {

  private container: PIXI.Container;
  private bulletGraphics: PIXI.Graphics;

  private sound: Howl

  public props: Required<BulletProperties> = {
    client_x: 0,
    client_y: 0,
    speed: 0,
    direction: 0,
  };

  constructor() {
    this.container = new PIXI.Container();
    this.bulletGraphics = new PIXI.Graphics();
    this.bulletGraphics.lineStyle({
      color: "black"
    })
    this.bulletGraphics.beginFill()
    this.bulletGraphics.drawRect(0, 0, 2, 2)
    this.bulletGraphics.endFill()
    //this.bulletGraphics.anchor.set(0.5, 0.5)
    //this.bulletGraphics.position.set(texture.width / 2, texture.height / 2)
    this.container.addChild(this.bulletGraphics)

    // play bullet sound
    this.sound = new Howl({
      src: "audio/m16.mp3"
    })

    this.sound.play()
  }

  public getContainer(): PIXI.Container {
    return this.container
  }

  public updateCallbacks: EntityUpdateCallbacks<BulletProperties> = {
    client_x: () => {
      this.container.position.x = this.props.client_x
      console.log("bullet X: " + this.props.client_x)
    },
    client_y: () => {
      this.container.position.y = this.props.client_y
      console.log("bullet y: " + this.props.client_y)
    },
    speed: () => {
      console.log("speed", this.props.speed)
    },
    direction: () => {
      // console.log(this.props.direction)
      //this.bulletGraphics.rotation = directionToRadians(this.props.direction)
    }
  };

  public destroy() {
    this.sound.stop()
  }
}
