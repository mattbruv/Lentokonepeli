import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, DrawLayer, Entity, Team } from "../entity";
import { getTexture } from "../resources";

const TEX_STRING = "headquarter_{state}.gif";

export interface ImportantBuildingProps {
  x?: number;
  y?: number;
  team?: number;
  health?: number;
}

export class ImportantBuilding extends Entity {
  x = 0;
  y = 0;
  team = 0;
  health = 0;

  type = EntityType.IMPORTANT_BUILDING;

  private container = new PIXI.Container();
  healthBar = new PIXI.Graphics();
  currentTexture: string = "runway.gif";

  sprite = new PIXI.Sprite(getTexture("runway.gif"));

  constructor() {
    super();

    this.container.sortableChildren = true;
    this.container.addChild(this.sprite);
    this.container.addChild(this.healthBar);
    this.container.zIndex = DrawLayer.Runway;
    this.sprite.zIndex = DrawLayer.Runway;
  }

  getContainer(): PIXI.Container {
    return this.container;
  }

  redraw() {
    this.healthBar.zIndex = DrawLayer.Runway;
    this.sprite.position.x = this.x;
    this.sprite.position.y = this.y;
    this.drawHealthBar();
    this.sprite.texture = this.getTexture();
  }

  private getTexture() {
    const centrals = TEX_STRING.replace("{state}", "germans");
    const allies = TEX_STRING.replace("{state}", "raf");
    if (this.health > 0) {
      const tex = (this.team == Team.CENTRALS) ? centrals : allies;
      return getTexture(tex);
    }
    return getTexture(TEX_STRING.replace("{state}", "broke"));
  }

  drawHealthBar() {
    if (this.health == 0) {
      this.healthBar.visible = false;
    } else {
      this.healthBar.visible = true;
      this.healthBar.clear();
      this.healthBar.beginFill(0xffffff, 1);
      const xPos = this.x + 10;
      const yPos = this.y + this.sprite.height - 3 - 1;
      const width = (this.sprite.width - 20) * (this.health / 255);
      const height = 3;
      this.healthBar.drawRect(xPos, yPos, width, height);
      this.healthBar.endFill();
    }
  }

  destroy() { }
}
