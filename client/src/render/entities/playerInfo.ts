import * as PIXI from "pixi.js";
import { Team } from "../../../../dogfight/src/constants";
import { TeamColor, DrawLayer } from "../constants";
import { EntityType } from "../../../../dogfight/src/entity";

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
    this.container.zIndex = DrawLayer.Player;
  }

  public deletePlayer(id: number): void {
    this.container.removeChild(this.info[id]);
    delete this.info[id];
  }

  private createText(): PIXI.Text {
    const text = new PIXI.Text("", {
      fontSize: 10,
      fontWeight: "bold",
      fill: TeamColor.SpectatorBackground
    });
    text.anchor.x = 0.5;
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
    const objTeam = playerInfo.team;
    let color = TeamColor.SpectatorForeground;

    if (objTeam == myTeam) {
      color = TeamColor.OwnForeground;
    } else {
      color = TeamColor.OpponentForeground;
    }
    if (myTeam == Team.Spectator) {
      color = TeamColor.SpectatorForeground;
    }

    const { x, y } = gameObj;
    if (name != undefined && x != undefined && y != undefined) {
      text.text = name;
      if (playerInfo.controlType == EntityType.Plane) {
        text.position.set(x, (y - 25) * -1);
      } else if (playerInfo.controlType == EntityType.Trooper) {
        text.position.set(x, (y + 48) * -1);
      }

      text.style.fill = color;
    }
  }
}
