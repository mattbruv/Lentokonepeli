import { GroundProperties } from "dogfight-types/GroundProperties";
import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { WaterProperties } from "dogfight-types/WaterProperties";
import { DrawLayer, TERRAIN_WATER_COLOR } from "../constants";
import { Textures } from "../textures";
import { Facing } from "dogfight-types/Facing";

export class Water implements Entity<WaterProperties> {
  private container: PIXI.Container;
  private waterGraphics: PIXI.Graphics;
  private waves: PIXI.TilingSprite;

  private waveIndex = 0;
  private waveInterval: number;
  private facing: Facing = "Left";

  constructor() {
    this.container = new PIXI.Container();
    this.waterGraphics = new PIXI.Graphics();

    const wave1 = Textures["wave-l_1.gif"];
    this.waves = new PIXI.TilingSprite(wave1);
    this.waves.height = wave1.height;

    this.waveInterval = setInterval(() => {
      this.waveStep();
    }, 200);

    this.container.addChild(this.waterGraphics);
    this.container.addChild(this.waves);

    this.container.zIndex = DrawLayer.LAYER_11;
  }

  private waveStep() {
    const str = `wave-l_${this.waveIndex}.gif`;

    const map: Record<string, PIXI.Texture> = {
      "wave-l_1.gif": Textures["wave-l_1.gif"],
      "wave-l_2.gif": Textures["wave-l_2.gif"],
      "wave-l_3.gif": Textures["wave-l_3.gif"],
      "wave-l_4.gif": Textures["wave-l_4.gif"],
      "wave-l_5.gif": Textures["wave-l_5.gif"],
      "wave-l_6.gif": Textures["wave-l_6.gif"],
      "wave-l_7.gif": Textures["wave-l_7.gif"],
    };

    const waveTexture = map[str];
    this.waves.texture = waveTexture;

    this.waveIndex += 1;
    if (this.waveIndex == 8) {
      this.waveIndex = 0;
    }
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public updateProperties(props: WaterProperties): void {
    if (props.facing !== null) {
      this.facing = props.facing;
      this.waves.anchor.x = this.facing === "Left" ? 0 : 1;
      this.waves.scale.x = this.facing === "Left" ? 1 : -1;
    }

    if (props.width !== null) {
      this.waterGraphics.width = props.width;
      this.waves.width = props.width;
    }

    if (props.client_x !== null) {
      this.waterGraphics.position.x = props.client_x;
      this.waves.position.x = props.client_x;
    }

    if (props.client_y !== null) {
      this.waterGraphics.position.y = props.client_y;
      this.waves.position.y = props.client_y;
    }

    if (props.terrain !== null) {
      const color = TERRAIN_WATER_COLOR[props.terrain];
      this.waterGraphics.clear();
      this.waterGraphics.beginFill(color);
      this.waterGraphics.drawRect(0, 0, this.waves.width, 5000);
      this.waterGraphics.endFill();
    }
  }

  public destroy() {
    clearInterval(this.waveInterval);
  }
}
