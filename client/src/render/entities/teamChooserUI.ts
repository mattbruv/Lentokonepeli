import * as PIXI from "pixi.js";
import { GameScreen } from "../constants";
import { Localizer } from "../../localization/localizer";
import { TeamOption } from "../../teamSelector";

const gap = 10;
const borderSize = 3;

export class TeamChooserUI {
  public container: PIXI.Container;

  private enabled: boolean = false;

  private spritesheet: PIXI.Spritesheet;

  private infoBox: PIXI.Sprite;

  private bigText: PIXI.Text;
  private smallText: PIXI.Text;

  private flagContainer: PIXI.Container;
  private flagCentrals: PIXI.Sprite;
  private flagRandom: PIXI.Sprite;
  private flagAllies: PIXI.Sprite;
  private selection: PIXI.Graphics;

  private flagWidth: number;
  private flagHeight: number;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();

    const infoTex = spritesheet.textures["info_box.gif"];
    this.infoBox = new PIXI.Sprite(infoTex);

    this.bigText = new PIXI.Text("", {
      fontSize: 20,
      fontWeight: "bold",
      fill: "white"
    });

    this.smallText = new PIXI.Text("", {
      fontSize: 17,
      fontWeight: "bold",
      fill: "yellow",
      leading: 4
    });

    const flagCentralsTex = spritesheet.textures["germanflag.jpg"];
    const flagRandomTex = spritesheet.textures["randomflag.jpg"];
    const flagAlliesTex = spritesheet.textures["royalairforcesflag.jpg"];

    this.flagWidth = flagRandomTex.width;
    this.flagHeight = flagRandomTex.height;
    this.flagContainer = new PIXI.Container();
    this.flagCentrals = new PIXI.Sprite(flagCentralsTex);
    this.flagRandom = new PIXI.Sprite(flagRandomTex);
    this.flagAllies = new PIXI.Sprite(flagAlliesTex);

    this.selection = new PIXI.Graphics();

    this.selection.clear();
    this.selection.beginFill(0xffff00);
    this.selection.drawRect(
      0,
      0,
      this.flagWidth + borderSize * 2,
      this.flagHeight + borderSize * 2
    );
    this.selection.endFill();

    this.flagRandom.x = this.flagWidth + gap;
    this.flagAllies.x = this.flagWidth * 2 + gap * 2;

    this.flagContainer.addChild(this.flagCentrals);
    this.flagContainer.addChild(this.flagRandom);
    this.flagContainer.addChild(this.flagAllies);

    // center flags on screen
    this.flagContainer.x = Math.round(
      GameScreen.Width / 2 - this.flagContainer.width / 2
    );
    this.flagContainer.y = 235;

    this.setSelection(TeamOption.Random);

    this.updateText();

    // set positioning of everything
    this.infoBox.position.set(5, 27);
    this.bigText.position.set(22, 42);
    this.smallText.position.set(27, 42 + 20 + 8);

    // add everything to the containers
    this.container.addChild(this.infoBox);
    this.container.addChild(this.bigText);
    this.container.addChild(this.smallText);
    this.container.addChild(this.selection);
    this.container.addChild(this.flagContainer);

    this.setEnabled(false);
  }

  public setSelection(team: TeamOption): void {
    const offsetX = gap * team + this.flagWidth * team;
    const x = this.flagContainer.x + offsetX - borderSize;
    const y = this.flagContainer.y - borderSize;
    this.selection.position.set(x, y);
  }

  public updateText(): void {
    const title = Localizer.get("teamChooserTitle");
    const desc = Localizer.get("teamChooserDescription");
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
