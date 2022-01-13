import * as PIXI from "pixi.js";
import { EntityType } from "../../network/game/EntityType";
import { Direction, DrawLayer, Entity, TerrainType } from "../entity";
import { getTexture } from "../resources";

export const WATER_COLOR = 3051728;
export const WATER_DESERT_COLOR = 2344139;
export const WATER_HEIGHT = 5000;

const WAVE_PHASE_TIME = 200; // Milliseconds
const WAVE_TEXTURE_STRING = "wave-l_{n}.gif"; // replace {n}

export interface WaterProps {
  x?: number;
  y?: number;
  width?: number;
  direction?: number;
  type?: number;
}

export class Water extends Entity {
  x = 0
  y = 0
  width = 100
  direction = Direction.RIGHT;
  type = EntityType.WATER;
  subType = TerrainType.NORMAL;

  private container = new PIXI.Container();
  private water = new PIXI.Graphics();
  private waves: PIXI.TilingSprite; 

  private wavePhase = 1;
  private windowInterval = 0;

  constructor() {
    super();

    // do the wave
    const tex = this.getWaveTexture();
    this.waves = new PIXI.TilingSprite(tex);
    this.waves.height = tex.height;

    // Start wave animation
    this.windowInterval = window.setInterval(() => {
      this.phaseWave();
    }, WAVE_PHASE_TIME);

    this.container.sortableChildren = true;
    this.container.addChild(this.water);
    this.container.addChild(this.waves);
    this.container.zIndex = DrawLayer.Water;

  }

  getContainer(): PIXI.Container {
    return this.container;
  }

  private phaseWave() {
    this.wavePhase = this.wavePhase == 7 ? 1 : this.wavePhase + 1;
    this.waves.texture = this.getWaveTexture();
  }

  private getWaveTexture() {
    const tex = WAVE_TEXTURE_STRING.replace("{n}", this.wavePhase.toString())
    return getTexture(tex);
  }

  redraw() {
    //console.log(this.x, this.y, this.width);

    const color = (this.subType == TerrainType.NORMAL) ? WATER_COLOR : WATER_DESERT_COLOR;
    this.water.beginFill(color);
    //const randColor = Math.round(Math.random() * 0xffffff);
    //this.water.beginFill(randColor);
    this.water.drawRect(this.x, this.y, this.width, WATER_HEIGHT);
    this.water.endFill();

    this.waves.width = this.width;
    this.waves.position.set(this.x, this.y);
    this.waves.position.x = this.x;

    if (this.direction == Direction.RIGHT) {
      this.waves.scale.x = -1;
      this.waves.position.x = this.x + this.width;
    }

  }

  destroy() {
    window.clearInterval(this.windowInterval);
  }
}
