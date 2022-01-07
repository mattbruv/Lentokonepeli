import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, Entity } from "../entity";
import { getTexture } from "../resources";

export interface RunwayProps {
  x?: number;
  y?: number;
  team?: number;
  direction?: number;
  health?: number;
}

export class Runway implements Entity {
  type = EntityType.RUNWAY;

  container = new PIXI.Container();
  healthBar = new PIXI.Graphics();
  currentTexture: string = "runway.gif";

  sprite = new PIXI.Sprite(getTexture("runway.gif"));
  back = new PIXI.Sprite(getTexture("runway2b.gif"));
  direction = Direction.LEFT;
  x = 0;
  y = 0;

  constructor() {
    this.sprite.height = this.sprite.texture.height;
    this.back.visible = false;
    this.container.addChild(this.back);
    this.container.addChild(this.sprite);
    this.container.addChild(this.healthBar);
  }

  destroy() {}

  update(props: RunwayProps) {
    if (props.x !== undefined) {
      this.sprite.position.x = props.x;
      this.back.x = props.x + 217;
      this.x = props.x;
    }
    if (props.y !== undefined) {
      this.sprite.position.y = props.y;
      this.back.y = props.y;
      this.y = props.y;
    }
    if (props.direction !== undefined) {
      this.direction = props.direction;
      if (props.direction == Direction.LEFT) {
        this.back.visible = true;
        this.sprite.texture = getTexture("runway2.gif")!;
      }
    }
    if (props.health !== undefined) {
      if (props.health == 0) {
        this.healthBar.visible = false;
        const tex =
          this.direction == Direction.RIGHT
            ? "runway_broke.gif"
            : "runway2_broke.gif";
        this.back.visible = false;
        if (this.currentTexture != tex) {
          this.sprite.texture = getTexture(tex)!;
          this.currentTexture = tex;
        }
      } else {
        // draw health bar
        this.healthBar.visible = true;
        this.healthBar.clear();
        this.healthBar.beginFill(0xffffff, 1);
        const runwayHeight = 36;
        const runwayWidth = 290;
        this.healthBar.drawRect(
          this.x + 10,
          this.y + runwayHeight - 3 - 1,
          ((runwayWidth - 20) * props.health) / 255,
          3
        );
        this.healthBar.endFill();

        const tex =
          this.direction == Direction.RIGHT ? "runway.gif" : "runway2.gif";
        if (this.direction == Direction.LEFT) {
          this.back.visible = true;
        }
        if (this.currentTexture != tex) {
          this.sprite.texture = getTexture(tex)!;
          this.currentTexture = tex;
        }
      }
    }
  }
}
