import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, DrawLayer, Entity, Team } from "../entity";
import { getTexture } from "../resources";

const FLAG_PHASE_TIME = 256; // Milliseconds
const TEX_STRING = "flag_{team}_{n}.gif";

export interface FlagProps {
  x?: number;
  y?: number;
  team?: number;
}

export class Flag extends Entity {
  x = 0;
  y = 0;
  team = Team.CENTRALS;
  type = EntityType.FLAG;

  phase: number = 1;
  windowInterval: number;


  container = new PIXI.Container();
  flag = new PIXI.Sprite();

  constructor() {
    super();
    this.container.addChild(this.flag);
    this.container.zIndex = DrawLayer.Flag;

    this.windowInterval = window.setInterval(() => {
      this.waveFlag();
    }, FLAG_PHASE_TIME);
  }

  getContainer(): PIXI.Container {
      return this.container;
  }

  waveFlag() {
    this.flag.texture = this.getTexture();
    this.phase = (this.phase == 3) ? 1 : this.phase + 1;
  }

  getTexture() {
    let texString = TEX_STRING;
    texString = texString.replace("{team}", (this.team == Team.CENTRALS) ? "ger" : "raf");
    texString = texString.replace("{n}", this.phase.toString());
    return getTexture(texString);
  }

  redraw() {
    this.flag.position.set(this.x, this.y);
  }

  destroy() {
    window.clearInterval(this.windowInterval);
  }
}
