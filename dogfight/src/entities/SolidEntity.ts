import { Entity, EntityType } from "../entity";
import { RectangleBody, Rectangle } from "../physics/rectangle";
import { GameWorld } from "../world/world"
//import { spriteSheet } from "../../../server/textures";
import { BufferedImage } from "../BufferedImage";
import { Bullet } from "./Bullet";
import { Runway } from "./Runway";

export abstract class SolidEntity extends Entity {
  public team: number;

  public constructor(id: number, world: GameWorld, team: number) {
    super(id, world);
    this.team = team;
  }
  public abstract getCollisionBounds(): Rectangle;
  public getCollisionImage(): BufferedImage { return null }; //TODO pixel perfect check

  public checkCollisionWith(paramSolidEntity: SolidEntity): boolean {
    if ((paramSolidEntity.isAlive()) && (this.getCollisionBounds().intersects(paramSolidEntity.getCollisionBounds()))) {
      let localRectangle1 = paramSolidEntity.getCollisionBounds();
      let localRectangle2 = this.getCollisionBounds();
      let localRectangle3 = localRectangle2.intersection(localRectangle1);
      let localBufferedImage1 = this.getCollisionImage();
      let localBufferedImage2 = paramSolidEntity.getCollisionImage();
      if ((localBufferedImage1 == null) && (localBufferedImage2 == null)) {
        return true;
      }
      let i: number;
      if (localBufferedImage1 == null) {
        let arrayOfInt1 = this.getPix(localBufferedImage2, localRectangle3, localRectangle1);
        //console.log("RGB : " + arrayOfInt1[1])
        for (i = 0; i < arrayOfInt1.length; i++) {
          if ((arrayOfInt1[i] == 255)) {
            //console.log("GOOOOD " + arrayOfInt1.length + " vs " + localRectangle3.height * localRectangle3.width + " " + localBufferedImage2.getDataLength());
            if (localRectangle2.x != localRectangle3.x || localRectangle2.y != localRectangle3.y) {
              //console.log(localRectangle2);
              //console.log(localRectangle1);
              //console.log(localRectangle3);
              //console.log();
            }
            return true;
          }
        }
        return false;
      }
      if (localBufferedImage2 == null) {
        let arrayOfInt1 = this.getPix(localBufferedImage1, localRectangle3, localRectangle2);
        for (i = 0; i < arrayOfInt1.length; i++) {
          if ((arrayOfInt1[i] == 255)) {
            //console.log("GOOOOD");
            return true;
          }
        }
        return false;
      }
      if (localRectangle2.x != localRectangle3.x || localRectangle2.y != localRectangle3.y) {
        //console.log(localRectangle2);
        //console.log(localRectangle1);
        //console.log(localRectangle3);
        //console.log();
      }
      let arrayOfInt1 = this.getPix(localBufferedImage1, localRectangle3, localRectangle2);
      let arrayOfInt2 = this.getPix(localBufferedImage2, localRectangle3, localRectangle1);
      return this.checkPix(localRectangle3, arrayOfInt1, arrayOfInt2);
    }
    return false;
  }

  public getPix(img: BufferedImage, paramRectangle1: Rectangle, paramRectangle2: Rectangle): number[] {
    //console.log("got pix");

    let x0 = -Math.round(paramRectangle2.getMinX() - paramRectangle1.getMinX());
    let y0 = Math.round(paramRectangle2.getMaxY() - paramRectangle1.getMaxY());

    //console.log(paramRectangle2);
    //console.log(paramRectangle1);
    let datan = []

    let arrayOfInt = img.data;
    //console.log(img.data.length);
    //console.log(paramRectangle2.width * paramRectangle2.height);
    //console.log(paramRectangle1.width * paramRectangle1.height);
    for (let y = y0; y < y0 + paramRectangle1.height; y++) {
      for (let x = x0; x < x0 + paramRectangle1.width; x++) {
        datan.push(arrayOfInt[4 * (x + y * paramRectangle2.width) + 3]);
      }
    }
    //console.log(x0, y0, datan[0]);
    //return arrayOfInt;
    return datan;
    //return getRGB(paramRectangle1.x - paramRectangle2.x, paramRectangle1.y - paramRectangle2.y, paramRectangle1.width, paramRectangle1.height, null, 0, paramRectangle1.width);
  }

  private checkPix(paramRectangle: Rectangle, paramArrayOfInt1: number[], paramArrayOfInt2: number[]): boolean {
    for (let i = 0; i < paramRectangle.getHeight(); i++) {
      for (let j = 0; j < paramRectangle.getWidth(); j++) {
        if (((paramArrayOfInt1[(i * paramRectangle.width + j)] == 255)) && ((paramArrayOfInt2[(i * paramRectangle.width + j)] == 255))) {
          return true;
        }
      }
    }
    return false;
  }

  public checkCollision(): boolean {
    let bool = false;
    let entities = this.world.getEntities();

    entities.forEach((list): void => {
      list.forEach((entity): void => {
        if (entity instanceof SolidEntity && entity != this) {
          let se: SolidEntity = entity;
          if (se.isAlive() && this.checkCollisionWith(se)) {
            bool = true;
            this.hit(se);
            se.hit(this);
          }
        }
      });
    });
    return bool;
  }

  public hit(se: SolidEntity): void { }
  public getTeam(): number { return this.team; }
  public isAlive(): boolean { return true; }
}