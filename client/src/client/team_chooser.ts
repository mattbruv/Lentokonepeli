import * as PIXI from "pixi.js";
import { Textures } from "./textures";
import { DrawLayer } from "./constants";

export class TeamChooser {
  public container: PIXI.Container;

  public flag_centrals: PIXI.Sprite;
  public flag_random: PIXI.Sprite;
  public flag_allies: PIXI.Sprite;

  constructor() {
    this.container = new PIXI.Container();

    this.flag_centrals = new PIXI.Sprite();
    this.flag_random = new PIXI.Sprite();
    this.flag_allies = new PIXI.Sprite();

    this.container.addChild(this.flag_centrals);
    this.container.addChild(this.flag_random);
    this.container.addChild(this.flag_allies);

    //this.container.anchor.set();
  }

  public init() {
    this.flag_centrals.texture = Textures["germanflag.jpg"];
    this.flag_random.texture = Textures["randomflag.jpg"];
    this.flag_allies.texture = Textures["royalairforcesflag.jpg"];

    const gap = 15;
    const width = this.flag_centrals.width;

    this.flag_random.position.x = width + gap;
    this.flag_allies.position.x = this.flag_random.width + width + gap * 2;
  }
}
