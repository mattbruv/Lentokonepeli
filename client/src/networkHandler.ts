import { PacketType, Packet } from "../../dogfight/src/network/types";
import { encodePacket, decodePacket } from "../../dogfight/src/network/encode";

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

  public send(packet: Packet): void {
    const data = encodePacket(packet);
    this.ws.send(data);
  }

  private processServerMessage(event: MessageEvent): void {
    const packet = decodePacket(event.data);
    this.onPacketRecieved(packet);
  }
}
