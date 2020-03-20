import * as PIXI from "pixi.js";

/**
 * Read all ye' who enter this wretched file:
 *
 * I'm pretty sure the sky is an entity on the old game.
 * I think each player was given his own "Sky", or there was at least
 * one main Sky entity.
 *
 * The reason for this is because in the old client code,
 * the sky has an (x, y) property which is used within
 * the parllalax draw function.
 *
 * I tried doing the parallax relative to the game camera,
 * but the sky just flies by.
 *
 * However, when I set the sky's coordinates to the center
 * of the player's view and THEN apply the parallax,
 * the sky looks a lot more like what was in the
 * original game.
 *
 * In my opinion, there is no point in making
 * the sky an entity that has to be networked,
 * becuase the sky has nothing to do with the game.
 * It is purely visual.
 *
 * I just do some hacky shit to make the sky
 * appear in the middle of the screen, and apply the parallax.
 *
 * Then I manually create two rectangles, one at the top
 * and one at the bottom of the sky.
 *
 * This is to extend the top and bottom sky colors
 * when the texture runs out.
 *
 * This may or may not need to be improved in the future,
 * depending on how well it holds up to criticism from players
 * and if it looks believable in-game.
 */

const SKY_Y_OFFSET = -375;
const SKY_HEIGHT = 10000;
const SKY_WIDTH = 10000;

const SKY_DARK_BLUE = 0x076ed3;
const SKY_LIGHT_BLUE = 0xf2f7fd;

export class SkyBackground {
  public container: PIXI.Container;

  private sky: PIXI.TilingSprite;
  private upper: PIXI.Graphics;
  private lower: PIXI.Graphics;

  private x: number = 0;
  private y: number = 0;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.container = new PIXI.Container();
    const textureSky: PIXI.Texture = spritesheet.textures["sky3b.jpg"];
    this.sky = new PIXI.TilingSprite(textureSky);

    this.upper = new PIXI.Graphics();
    this.upper.beginFill(SKY_DARK_BLUE);
    this.upper.drawRect(0, 0, SKY_WIDTH, SKY_HEIGHT);
    this.upper.position.x = -Math.round(SKY_WIDTH / 2);
    this.upper.position.y = -SKY_HEIGHT - Math.round(textureSky.height / 2) + 2;
    this.upper.endFill();

    this.lower = new PIXI.Graphics();
    this.lower.beginFill(SKY_LIGHT_BLUE);
    this.lower.drawRect(0, 0, SKY_WIDTH, SKY_HEIGHT);
    this.lower.position.x = -Math.round(SKY_WIDTH / 2);
    this.lower.position.y = Math.round(textureSky.height / 2) - 2;
    this.lower.endFill();

    this.sky.anchor.set(0.5, 0.5);
    this.sky.height = textureSky.height;
    this.sky.width = 0xffff;
    this.container.addChild(this.sky);
    this.container.addChild(this.upper);
    this.container.addChild(this.lower);
  }

  public setPosition(x: number, y: number): void {
    const newX = Math.round(x);
    const newY = Math.round(y);
    this.x = newX;
    this.y = newY + SKY_Y_OFFSET;
    this.container.x = newX;
    this.container.y = newY + SKY_Y_OFFSET;
  }

  public setCamera(x: number, y: number): void {
    /*
     The original Parallax function:

     int i = paramX / 6 - this.x;
     paramY /= 3;

     paramGraphics2D.drawImage(image, i, this.y + paramY, null);
     paramGraphics2D.drawImage(image, i - image.getWidth(), this.y + paramY, null);
    */
    const iX = Math.round(x / 6);
    const iY = Math.round(y / 3);
    this.sky.tilePosition.x = iX;
    this.container.y = this.y + iY;
  }
}
