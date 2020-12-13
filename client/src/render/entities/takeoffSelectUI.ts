import * as PIXI from "pixi.js";
import { Localizer } from "../../localization/localizer";
import { GameScreen } from "../constants";
import { PlaneType } from "../../../../dogfight/src/entities/Plane";
import { Translation } from "../../localization/translation";

const planeImages = {
  [PlaneType.Fokker]: "pic_plane6.gif",
  [PlaneType.Sopwith]: "pic_plane9.gif",

  [PlaneType.Albatros]: "pic_plane4.gif",
  [PlaneType.Bristol]: "pic_plane7.gif",

  [PlaneType.Junkers]: "pic_plane5.gif",
  [PlaneType.Salmson]: "pic_plane8.gif"
};

export class TakeoffSelectUI {
  public container: PIXI.Container;

  private enabled: boolean = false;

  private spritesheet: PIXI.Spritesheet;

  private infoBox: PIXI.Sprite;
  private planeImage: PIXI.Sprite;

  private bigText: PIXI.Text;
  private smallText: PIXI.Text;

  private planeType: PlaneType;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();

    const infoTex = spritesheet.textures["selectionScreen.gif"];
    const planeTex = spritesheet.textures["pic_plane4.gif"];
    this.infoBox = new PIXI.Sprite(infoTex);
    this.planeImage = new PIXI.Sprite(planeTex);

    this.planeType = PlaneType.Albatros;

    this.bigText = new PIXI.Text("", {
      fontSize: 20,
      fontWeight: "bold",
      fill: "white"
    });

    this.smallText = new PIXI.Text("", {
      fontSize: 17,
      fontWeight: "bold",
      fill: "black",
      leading: 6
    });

    // const flagCentralsTex = spritesheet.textures["germanflag.jpg"];
    // set team
    this.updateText();

    // set positioning of everything
    this.planeImage.position.set(10);
    this.bigText.position.set(15, 138);
    this.smallText.position.set(15, 173);

    // add everything to the containers
    this.container.addChild(this.infoBox);
    this.container.addChild(this.planeImage);
    this.container.addChild(this.bigText);
    this.container.addChild(this.smallText);

    // position container
    const x = GameScreen.Width / 2 - this.container.width / 2;
    // 150 = HUD height
    const y = (GameScreen.Height - 150) / 2 - this.container.height / 2;
    this.container.position.set(x, y);

    this.setEnabled(false);
  }

  public setPlane(planeType: PlaneType): void {
    this.planeType = planeType;
    this.planeImage.texture = this.spritesheet.textures[planeImages[planeType]];
    this.updateText();
  }

  public updateText(): void {
    const name = PlaneType[this.planeType];
    const planeTitle = `plane${name}Name`;
    const planeDesc = `plane${name}Description`;
    const title = Localizer.get(planeTitle as keyof Translation);
    const desc = Localizer.get(planeDesc as keyof Translation);
    this.bigText.text = title;
    this.smallText.text = desc;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(active: boolean): void {
    this.enabled = active;
    this.container.visible = this.enabled;
  }
}
