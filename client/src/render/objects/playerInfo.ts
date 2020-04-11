import * as PIXI from "pixi.js";
import { Team } from "../../../../dogfight/src/constants";

interface PlayerInfoObject {
  [key: number]: PIXI.Text;
}

export class PlayerInfo {
  public container: PIXI.Container;
  private spritesheet: PIXI.Spritesheet;
  private info: PlayerInfoObject;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.info = {};
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();
  }

  public deletePlayer(id: number): void {
    this.container.removeChild(this.info[id]);
    delete this.info[id];
  }

  private createText(): PIXI.Text {
    const text = new PIXI.Text("", {
      fontSize: 10,
      fill: "black"
    });
    return text;
  }

  public setInfo(
    myTeam: Team,
    pid: number,
    playerInfo: any,
    gameObj: any
  ): void {
    if (this.info[pid] == undefined) {
      const newText = this.createText();
      this.container.addChild(newText);
      this.info[pid] = newText;
    }
    const text = this.info[pid];
    const name = playerInfo.name;
    const theirTeam = playerInfo.team;

    const { x, y } = gameObj;
    if (name != undefined && x != undefined && y != undefined) {
      text.text = name;
      text.position.set(x, -y + 35);
    }
  }
}
