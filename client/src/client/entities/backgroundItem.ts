import { Entity, EntityUpdateCallbacks } from "./entity";
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
  props: BackgroundItemProperties = {};

  private container: PIXI.Container;
  private itemSprite: PIXI.Sprite;

  private itemTextures: Record<BackgroundItemType, PIXI.Texture>;
  private flagTypes: BackgroundItemType[];
  private flagInterval: number | null = null;
  private flagTextures: FlagTextureMap;
  private flagIndex = 0;

  constructor() {
    this.container = new PIXI.Container();
    this.itemSprite = new PIXI.Sprite();

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

  public updateCallbacks: EntityUpdateCallbacks<BackgroundItemProperties> = {
    bg_item_type: () => {
      const { bg_item_type } = this.props;
      if (bg_item_type === undefined) return;
      if (!this.props.bg_item_type) return;
      if (this.flagInterval !== null) {
        clearInterval(this.flagInterval);
      }

      const texture = this.itemTextures[bg_item_type];
      this.itemSprite.texture = texture;

      if (this.flagTypes.includes(bg_item_type)) {
        this.flagInterval = setInterval(() => this.waveFlag(), 100);
      }
    },
    facing: () => {
      const { facing } = this.props;
      this.itemSprite.anchor.x = facing === "Right" ? 0 : 1;
      this.itemSprite.scale.x = facing === "Right" ? 1 : -1;
    },
    client_x: () => {
      const { facing, client_x, client_y } = this.props;
      if (
        facing === undefined ||
        client_x === undefined ||
        client_y === undefined
      )
        return;

      let xDiff = Math.floor(this.itemSprite.texture.width / 2);
      if (
        this.props.bg_item_type &&
        this.flagTypes.includes(this.props.bg_item_type)
      ) {
        xDiff = 0;
      }
      this.itemSprite.position.x = client_x - xDiff;
    },
    client_y: () => {
      const { client_y } = this.props;
      if (client_y === undefined) return;
      let yDiff = this.itemSprite.texture.height;
      if (
        this.props.bg_item_type &&
        this.flagTypes.includes(this.props.bg_item_type)
      ) {
        yDiff = 0;
      }
      this.itemSprite.position.y = client_y - yDiff;
    },
  };

  private waveFlag() {
    if (
      this.props.bg_item_type !== "FlagAllies" &&
      this.props.bg_item_type !== "FlagCentrals"
    )
      return;

    const texture = this.flagTextures[this.props.bg_item_type][this.flagIndex];
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
