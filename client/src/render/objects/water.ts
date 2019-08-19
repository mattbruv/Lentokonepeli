import * as PIXI from "pixi.js";
import { spriteSheet } from "../textures";
import { EntitySprite } from "./entity";
import { EntityType, Facing } from "../../../../dogfight/src/constants";
import { WaterEntity } from "../../../../dogfight/src/entities/water";
import { toPixiCoords } from "../helpers";
import { WaterColor, DrawLayer, WAVE_PHASE_TIME } from "../constants";

export class WaterSprite implements EntitySprite {
  public id: number;
  public type: EntityType;
  public renderables: PIXI.DisplayObject[];

  private water: PIXI.Graphics;
  private waves: PIXI.TilingSprite;

  private renderWaves: number;
  private waveFrame: number;

  public constructor(data: WaterEntity) {
    this.id = data.id;
    this.type = data.type;
    this.renderables = [];

    const pos = toPixiCoords(data.position);
    const halfWidth = Math.round(data.width / 2);

    const wavy: PIXI.Texture = spriteSheet.textures["wave-l_1.gif"];

    this.water = new PIXI.Graphics();
    this.water.beginFill(WaterColor.Normal);
    this.water.drawRect(pos.x - halfWidth, pos.y, data.width, 2000);
    this.water.endFill();

    this.waves = new PIXI.TilingSprite(wavy, data.width, wavy.height);
    this.waves.anchor.set(0.5, 0);
    this.waves.position.set(pos.x, pos.y);

    if (data.waveDirection === Facing.Right) {
      this.waves.scale.x = -1;
    }

    this.animateWaves();

    this.water.zIndex = DrawLayer.LAYER11;
    this.waves.zIndex = DrawLayer.LAYER11;

    this.renderables.push(this.water);
    this.renderables.push(this.waves);
  }

  private animateWaves(): void {
    this.waveFrame = 1;
    this.renderWaves = window.setInterval((): void => {
      const nextWave = "wave-l_" + this.waveFrame + ".gif";
      const texture = spriteSheet.textures[nextWave];
      this.waves.texture = texture;
      this.waveFrame = this.waveFrame > 7 ? 1 : this.waveFrame + 1;
    }, WAVE_PHASE_TIME);
  }

  public update(data: WaterEntity): void {
    console.log(data);
  }

  public onDestroy(): void {
    window.clearInterval(this.renderWaves);
  }
}
