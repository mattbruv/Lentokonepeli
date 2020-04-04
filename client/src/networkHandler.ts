import { pack, unpack } from "../../dogfight/src/network/packer";
import { PacketType, Packet } from "../../dogfight/src/network/types";
import { decodePacket } from "../../dogfight/src/network/encode";

const wssPath = "ws://" + location.host;

export class NetworkHandler {
  /**
   * WebSocket connection
   */
  private ws: WebSocket;

  public onPacketRecieved: (data: Packet) => void;

  public constructor() {
    console.log("network handler made!");
    // create connection to server.
    this.ws = new WebSocket(wssPath);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = (): void => {
      const syncRequest = { type: PacketType.RequestFullSync };
      this.send(syncRequest);
    };

    this.ws.onmessage = (event): void => {
      this.processServerMessage(event);
    };
  }

  public send(data: Packet): void {
    const info = pack(data);
    this.ws.send(info);
  }

  private processServerMessage(event: MessageEvent): void {
    if (typeof event.data == "string") {
      const packet = unpack(event.data);
      this.onPacketRecieved(packet);
    } else {
      const packet = decodePacket(event.data);
      this.onPacketRecieved(packet);
    }
  }
}
