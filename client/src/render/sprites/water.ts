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
    this.createWater(100);

    this.container.addChild(this.water);
    this.container.addChild(this.waves);

    this.windowInterval = window.setInterval((): void => {
      this.phaseWave();
    }, WAVE_PHASE_TIME);

    this.container.zIndex = DrawLayer.Water;
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

  private setDirection(dir: WaveDirection): void {
    if (dir == WaveDirection.Right) {
      this.waves.scale.x = -1;
      this.waves.position.x = this.waves.width;
    }
  }

  private createWater(width: number): void {
    this.water.clear();
    this.water.beginFill(this.waterColor);
    this.water.drawRect(0, 0, width, WATER_HEIGHT);
    this.water.endFill();
    this.waves.width = width;
  }

  private center(newX: number): void {
    const halfWidth = Math.round(this.container.width / 2);
    this.container.x = newX - halfWidth;
  }

  public update(props: Properties): void {
    if (props.width !== undefined) {
      this.createWater(props.width);
    }
    if (props.x !== undefined) {
      this.center(props.x);
    }
    if (props.y !== undefined) {
      this.container.position.y = -props.y;
    }
    if (props.direction !== undefined) {
      this.setDirection(props.direction);
    }
  }

  public destroy(): void {
    window.clearInterval(this.windowInterval);
  }
}
