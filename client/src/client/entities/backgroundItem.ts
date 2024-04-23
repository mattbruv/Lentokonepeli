import { Entity } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { Facing } from "dogfight-types/Facing";
import { DrawLayer } from "../constants";
import { BackgroundItemProperties } from "dogfight-types/BackgroundItemProperties";
import { BackgroundItemType } from "dogfight-types/BackgroundItemType";

type FlagTypes = "FlagAllies" | "FlagCentrals";

type FlagTextureMap = {
  [key in FlagTypes]: PIXI.Texture[];
};

export class BackgroundItem implements Entity<BackgroundItemProperties> {
  private container: PIXI.Container;
  private itemSprite: PIXI.Sprite;

  private itemTextures: Record<BackgroundItemType, PIXI.Texture>;
  private itemType: BackgroundItemType;
  private flagTypes: BackgroundItemType[];
  private flagInterval: number | null = null;
  private flagTextures: FlagTextureMap;
  private flagIndex = 0;

  constructor() {
    this.container = new PIXI.Container();
    this.itemSprite = new PIXI.Sprite();
    this.itemType = "PalmTree";

    this.itemTextures = {
      ControlTower: Textures["controlTower.gif"],
      DesertTower: Textures["controlTowerDesert.gif"],
      FlagAllies: Textures["flag_raf_1.gif"],
      FlagCentrals: Textures["flag_ger_1.gif"],
      PalmTree: Textures["palmtree.gif"],
    };

    this.flagTextures = {
      FlagCentrals: [
        Textures["flag_ger_1.gif"],
        Textures["flag_ger_2.gif"],
        Textures["flag_ger_3.gif"],
        Textures["flag_ger_2.gif"],
      ],
      FlagAllies: [
        Textures["flag_raf_1.gif"],
        Textures["flag_raf_2.gif"],
        Textures["flag_raf_3.gif"],
        Textures["flag_raf_2.gif"],
      ],
    };

    this.flagTypes = ["FlagAllies", "FlagCentrals"];

    this.container.addChild(this.itemSprite);

    this.container.zIndex = DrawLayer.LAYER_15;
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public updateProperties(props: BackgroundItemProperties): void {
    if (props.bg_item_type !== null) {
      if (this.flagInterval !== null) {
        clearInterval(this.flagInterval);
      }

      this.itemType = props.bg_item_type;

      const texture = this.itemTextures[props.bg_item_type];
      this.itemSprite.texture = texture;

      if (this.flagTypes.includes(props.bg_item_type)) {
        this.flagInterval = setInterval(() => this.waveFlag(), 100);
      }
    }

    if (props.client_x !== null) {
      let xDiff = Math.floor(this.itemSprite.texture.width / 2);
      if (this.flagTypes.includes(this.itemType)) {
        xDiff = 0;
      }
      this.itemSprite.position.x = props.client_x - xDiff;
    }

    if (props.client_y !== null) {
      let yDiff = this.itemSprite.texture.height;
      if (this.flagTypes.includes(this.itemType)) {
        yDiff = 0;
      }
      this.itemSprite.position.y = props.client_y - yDiff;
    }

    if (props.facing !== null) {
      this.itemSprite.anchor.x = props.facing === "Right" ? 0 : 1;
      this.itemSprite.scale.x = props.facing === "Right" ? 1 : -1;
    }
  }

  waveFlag() {
    if (this.itemType !== "FlagAllies" && this.itemType !== "FlagCentrals")
      return;

    const texture = this.flagTextures[this.itemType][this.flagIndex];
    this.itemSprite.texture = texture;
    this.flagIndex++;
    this.flagIndex %= 4;
  }

  public destroy() {
    if (this.flagInterval !== null) {
      clearInterval(this.flagInterval);
    }
  }
}
