import { InputKey, Team } from "../../dogfight/src/constants";
import { GameRenderer } from "./render/renderer";
import { Packet, PacketType } from "../../dogfight/src/network/types";
import { pack } from "../../dogfight/src/network/packer";
import { PlaneType } from "../../dogfight/src/objects/plane";

const centralPlanes: PlaneType[] = [
  PlaneType.Albatros,
  PlaneType.Fokker,
  PlaneType.Junkers
];

const alliedPlanes: PlaneType[] = [
  PlaneType.Bristol,
  PlaneType.Sopwith,
  PlaneType.Salmson
];

export class TakeoffSelector {
  private planeSelection: PlaneType;
  private team: Team;
  private index: number = 0;

  public constructor() {
    this.planeSelection = PlaneType.Albatros;
    this.team = Team.Centrals;
    this.index = 0;
  }

  public setTeam(team: Team): void {
    this.team = team;
    this.setPlane(this.index);
  }

  private setPlane(index: number): void {
    if (this.team == Team.Centrals) {
      this.planeSelection = centralPlanes[index];
    } else {
      this.planeSelection = alliedPlanes[index];
    }
  }

  public getPlaneSelection(): PlaneType {
    return this.planeSelection;
  }

  public processInput(
    key: InputKey,
    renderer: GameRenderer,
    websocket: WebSocket
  ): void {
    if (key === InputKey.Enter) {
      console.log("Send takeoff request");
      const packet: Packet = {
        type: PacketType.RequestTakeoff,
        data: {}
      };
      websocket.send(pack(packet));
      return;
    }
    if (key == InputKey.Left || key == InputKey.Up) {
      // this.changeSelection(-1, renderer);
      return;
    }
    if (key == InputKey.Right || key == InputKey.Down) {
      // this.changeSelection(1, renderer);
    }
  }

  private changeSelection(renderer: GameRenderer): void {
    // renderer.teamChooser.setSelection(this.selection);
  }
}
