import * as PIXI from "pixi.js";
import { GameSprite } from "../sprite";
import { EntityType } from "../../../../dogfight/src/entity";
import { Properties } from "../../../../dogfight/src/state";
import { WaterColor, DrawLayer, WAVE_PHASE_TIME } from "../constants";
import { WaveDirection } from "../../../../dogfight/src/constants";

const WATER_HEIGHT = 10000;

const WAVE_TEXTURE_STR = "wave-l_N.gif";

export class WaterSprite implements GameSprite {
  public entityId: number;
  public entityType = EntityType.Water;
  public container: PIXI.Container;
  public debugContainer: PIXI.Container;

  private spritesheet: PIXI.Spritesheet;

  private water: PIXI.Graphics;
  private waves: PIXI.TilingSprite;

  private waterColor: WaterColor = WaterColor.Normal;
  private wavePhase = 1;

  private windowInterval: number;

  private x: number;
  private y: number;
  private width: number;
  private direction: WaveDirection;

  public constructor(spritesheet: PIXI.Spritesheet, id: number) {
    this.spritesheet = spritesheet;
    this.entityId = id;

    this.container = new PIXI.Container();
    this.debugContainer = new PIXI.Container();
    this.water = new PIXI.Graphics();
    const texStr = this.getWaveTextureString();
    const texture = spritesheet.textures[texStr];
    this.waves = new PIXI.TilingSprite(texture);
    this.waves.height = texture.height;

    this.container.addChild(this.water);
    this.container.addChild(this.waves);

    this.windowInterval = window.setInterval((): void => {
      this.phaseWave();
    }, WAVE_PHASE_TIME);

    this.container.zIndex = DrawLayer.Water;

    this.draw();
  }

  private phaseWave(): void {
    this.wavePhase = this.wavePhase == 7 ? 1 : this.wavePhase + 1;
    const texStr = this.getWaveTextureString();
    const texture = this.spritesheet.textures[texStr];
    this.waves.texture = texture;
  }

  private getWaveTextureString(): string {
    return WAVE_TEXTURE_STR.replace("N", this.wavePhase.toString());
  }

  public update(props: Properties): void {
    if (props.width !== undefined) {
      this.width = props.width;
    }
    if (props.x !== undefined) {
      this.x = props.x;
    }
    if (props.y !== undefined) {
      this.y = -props.y;
    }
    if (props.direction !== undefined) {
      this.direction = props.direction;
    }
    this.draw();
  }

  private draw(): void {
    // create water
    this.water.clear();
    this.water.beginFill(this.waterColor);
    this.water.drawRect(0, 0, this.width, WATER_HEIGHT);
    this.water.endFill();
    this.waves.width = this.width;

    // set wave directions
    if (this.direction == WaveDirection.Right) {
      this.waves.scale.x = -1;
      this.waves.position.x = this.waves.width;
    }

    // center water.
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = this.x - halfWidth;

    // set water y-offset
    this.container.y = this.y;
  }

  public destroy(): void {
    window.clearInterval(this.windowInterval);
  }
}
