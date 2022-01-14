import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, DrawLayer, Entity } from "../entity";
import { getTexture } from "../resources";

export interface RunwayProps {
  x?: number;
  y?: number;
  team?: number;
  direction?: Direction;
  health?: number;
}

export class Runway extends Entity {
  x = 0;
  y = 0;
  team = 0;
  direction = Direction.RIGHT;
  health = 0;

  type = EntityType.RUNWAY;

  private container = new PIXI.Container();
  healthBar = new PIXI.Graphics();
  currentTexture: string = "runway.gif";

  sprite = new PIXI.Sprite(getTexture("runway.gif"));
  back = new PIXI.Sprite(getTexture("runway2b.gif"));

  constructor() {
    super();
    this.sprite.height = this.sprite.texture.height;
    this.back.visible = false;

    this.container.sortableChildren = true;
    this.container.addChild(this.back);
    this.container.addChild(this.sprite);
    this.container.addChild(this.healthBar);
    this.container.zIndex = DrawLayer.Runway;
  }

  getContainer(): PIXI.Container {
    return this.container;
  }

  getDrawLayer() {
    return DrawLayer.Runway;
  }

  redraw() {

    // TODO: DrawLayer depends on health
    this.sprite.zIndex = this.getDrawLayer();
    this.back.zIndex = this.getDrawLayer();
    this.healthBar.zIndex = DrawLayer.Runway;

    // x
    this.sprite.position.x = this.x;
    this.back.x = this.x + 217;

    // y
    this.sprite.position.y = this.y;
    this.back.y = this.y;

    // direction
    if (this.direction == Direction.LEFT) {
      this.back.visible = true;
      this.sprite.texture = getTexture("runway2.gif");
    } else {
      this.back.visible = false;
      this.sprite.texture = getTexture("runway.gif");
    }

    // health
    this.drawHealthBar();
  }

  drawHealthBar() {
    if (this.health == 0) {
      this.healthBar.visible = false;
      this.back.visible = false;
      const tex =
        this.direction == Direction.RIGHT
          ? "runway_broke.gif"
          : "runway2_broke.gif";
      this.sprite.texture = getTexture(tex);
    } else {
      this.healthBar.visible = true;
      this.healthBar.clear();
      this.healthBar.beginFill(0xffffff, 1);
      const runwayHeight = 36;
      const runwayWidth = 290;
      this.healthBar.drawRect(
        this.x + 10,
        this.y + runwayHeight - 3 - 1,
        ((runwayWidth - 20) * this.health) / 255,
        3
      );
      this.healthBar.endFill();

      const tex =
        this.direction == Direction.RIGHT ? "runway.gif" : "runway2.gif";
      if (this.direction == Direction.LEFT) {
        this.back.visible = true;
      }
      if (this.currentTexture != tex) {
        this.sprite.texture = getTexture(tex);
        this.currentTexture = tex;
      }
    }
  }

  destroy() { }
}
