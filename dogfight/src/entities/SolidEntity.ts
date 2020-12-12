import { TypedEntity, EntityType } from "../TypedEntity";
import { RectangleBody, Rectangle } from "../physics/rectangle";
import { GameWorld } from "../world/world"
import { spriteSheet } from "../../../client/src/render/textures";

export abstract class SolidEntity extends TypedEntity {
  public team: number;

  public constructor(id: number, team: number) {
    super(id);
    this.team = team;
  }
  public abstract getCollisionBounds(): Rectangle;
  public getCollisionImage() { return spriteSheet }; //TODO pixel perfect check

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
      return true;
      /*
      if (localBufferedImage1 == null) {
        arrayOfInt1 = getPix(localBufferedImage2, localRectangle3, localRectangle1);
        for (i = 0; i < arrayOfInt1.length; i++) {
          if ((arrayOfInt1[i] & 0xFF000000) != 0) {
            return true;
          }
        }
        return false;
      }
      if (localBufferedImage2 == null) {
        arrayOfInt1 = getPix(localBufferedImage1, localRectangle3, localRectangle2);
        for (i = 0; i < arrayOfInt1.length; i++) {
          if ((arrayOfInt1[i] & 0xFF000000) != 0) {
            return true;
          }
        }
        return false;
      }
      int[] arrayOfInt1 = getPix(localBufferedImage1, localRectangle3, localRectangle2);
      int[] arrayOfInt2 = getPix(localBufferedImage2, localRectangle3, localRectangle1);
      return checkPix(localRectangle3, arrayOfInt1, arrayOfInt2);
      //*/
    }
    return false;
  }

  public getPix(img, r1: Rectangle, r2: Rectangle): number[] {
    return null;
  }
  public checkPix(r: Rectangle): boolean {
    return null;
  }

  public checkCollision(world: GameWorld): boolean {
    let bool = false;
    let entities = world.getEntities();

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