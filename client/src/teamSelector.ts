import { GameRenderer } from "./render/renderer";
import { Packet, PacketType } from "../../dogfight/src/network/types";
import { NetworkHandler } from "./networkHandler";
import { InputChange, InputKey } from "../../dogfight/src/input";
import Cookies from "js-cookie";

export enum TeamOption {
  Centrals,
  Random,
  Allies
}

export class TeamSelector {
  private selection: TeamOption;

  public constructor() {
    this.selection = TeamOption.Random;
  }

  public getSelection(): TeamOption {
    return this.selection;
  }

  public processInput(
    change: InputChange,
    renderer: GameRenderer,
    network: NetworkHandler
  ): void {
    if (!change.isPressed) {
      return;
    }
    const key = change.key;
    if (key === InputKey.Enter) {
      console.log("Requesting to join team:", TeamOption[this.selection]);
      const packet: Packet = {
        type: PacketType.RequestJoinTeam,
        data: {
          team: this.selection,
          name: Cookies.get("name")
        }
      };
      network.send(packet);
      return;
    }
    if (key == InputKey.Left || key == InputKey.Up) {
      this.changeSelection(-1, renderer);
      return;
    }
    if (key == InputKey.Right || key == InputKey.Down) {
      this.changeSelection(1, renderer);
    }
  }

  private changeSelection(offset: number, renderer: GameRenderer): void {
    const max = Object.keys(TeamOption).length / 2 - 1;
    let newSelection = this.selection + offset;
    if (newSelection < 0) {
      newSelection = max;
    }
    newSelection %= max + 1;
    this.selection = newSelection;
    renderer.teamChooserUI.setSelection(this.selection);
  }
}
