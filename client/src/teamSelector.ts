import { InputKey } from "../../dogfight/src/constants";
import { GameRenderer } from "./render/renderer";
import { Packet, PacketType } from "../../dogfight/src/network/types";
import { pack } from "../../dogfight/src/network/packer";

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
    key: InputKey,
    renderer: GameRenderer,
    websocket: WebSocket
  ): void {
    if (key === InputKey.Enter) {
      console.log("Requesting to join team:", this.selection);
      const packet: Packet = {
        type: PacketType.RequestJoinTeam,
        data: {
          team: this.selection
        }
      };
      websocket.send(pack(packet));
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
    renderer.teamChooser.setSelection(this.selection);
  }
}
