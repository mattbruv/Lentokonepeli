import { Entity, EntityUpdateCallbacks, Followable, Point, RadarEnabled } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { Facing } from "dogfight-types/Facing";
import { DrawLayer, TeamColor, TERRAIN_WATER_COLOR } from "../constants";
import { RunwayProperties } from "dogfight-types/RunwayProperties";
import { Stats } from "../hud";
import { RadarObject, RadarObjectType } from "../radar";

export class Runway implements Entity<RunwayProperties>, Followable, RadarEnabled {

  public props: Required<RunwayProperties> = {
    client_x: 0,
    client_y: 0,
    facing: "Left",
    team: "Allies",
    client_health: 0
  };

  private container: PIXI.Container;
  private runwaySprite: PIXI.Sprite;
  private runwayBack: PIXI.Sprite;
  private healthBar: PIXI.Graphics;

  public updateCallbacks: EntityUpdateCallbacks<RunwayProperties> = {
    client_x: () => {
      const { client_x } = this.props;
      if (client_x === undefined) return;
      this.runwaySprite.position.x = client_x;
      this.runwayBack.position.x = client_x + 217;
    },
    client_health: () => {
      this.updateTexture()
      this.drawHealthBar()
    },
    client_y: () => {
      const { client_y } = this.props;
      if (client_y === undefined) return;
      this.runwaySprite.position.y = client_y;
      this.runwayBack.position.y = client_y;
    },
    facing: () => {
      const { facing } = this.props;
      if (facing === undefined) return;
      this.updateTexture();
      this.runwayBack.visible = facing === "Left" ? true : false;
    },
    team: () => { },
  };

  constructor() {
    this.container = new PIXI.Container();
    this.runwaySprite = new PIXI.Sprite();
    this.runwayBack = new PIXI.Sprite(Textures["runway2b.gif"]);
    this.runwayBack.visible = false;
    this.props.facing = "Left";

    this.healthBar = new PIXI.Graphics();

    this.container.addChild(this.runwayBack);
    this.container.addChild(this.runwaySprite);
    this.container.addChild(this.healthBar);

    this.container.zIndex = DrawLayer.Runway;
  }

  private getTexture() {
    const facing = this.props.facing;
    const textureMapNormal: Record<Facing, PIXI.Texture> = {
      Left: Textures["runway2.gif"],
      Right: Textures["runway.gif"],
    };
    const textureMapBroke: Record<Facing, PIXI.Texture> = {
      Left: Textures["runway2_broke.gif"],
      Right: Textures["runway_broke.gif"],
    };
    const atlas = (this.props.client_health > 0) ? textureMapNormal : textureMapBroke
    return atlas[facing];
  }

  private updateTexture(): void {
    this.runwaySprite.texture = this.getTexture()
  }

  public getStats(): Stats {
    return {}
  }

  public getCenter(): Point {
    const halfWidth = this.runwaySprite.texture.width / 2;
    const halfHeight = this.runwaySprite.texture.height / 2;

    return {
      x: (this.props.client_x ?? 0) + halfWidth,
      y: (this.props.client_y ?? 0) - halfHeight,
    };
  }

  private drawHealthBar() {
    const { team, client_health, client_x, client_y } = this.props
    // console.log(client_health)

    if (client_health <= 0) {
      this.healthBar.visible = false;
      return;
    }

    this.healthBar.visible = true;

    const tex = this.getTexture()
    this.healthBar.position.y = client_y + tex.height - 3 - 1;
    this.healthBar.position.x = client_x + 10;

    const color = (team === "Allies") ? TeamColor.OwnBackground : TeamColor.OpponentBackground
    const amount = Math.round((tex.width - 20) * (client_health / 255))

    this.healthBar.clear()
    this.healthBar.beginFill(color)
    this.healthBar.drawRect(0, 0, amount, 3)
    this.healthBar.endFill()
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public destroy() { }

  public getRadarInfo(): RadarObject {
    return {
      type: RadarObjectType.Runway,
      x: this.props.client_x,
      y: this.props.client_y,
      health: this.props.client_health,
      team: this.props.team,
      width: this.runwaySprite.width,
    }
  }
}
