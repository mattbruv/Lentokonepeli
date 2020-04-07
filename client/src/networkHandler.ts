import { PacketType, Packet } from "../../dogfight/src/network/types";
import { encodePacket, decodePacket } from "../../dogfight/src/network/encode";
import { ClientServer } from "./ClientServer";

const wssPath = "ws://" + location.host;

export type packetCallback = (data: Packet) => void;

export class NetworkHandler {
  /**
   * WebSocket connection
   */
  private ws: WebSocket;

  private onPacketRecieved: packetCallback;

  private clientOnly = process.env.MODE == "client";
  private clientServer: ClientServer;

  public constructor(callback: packetCallback) {
    console.log("network handler made!");
    this.onPacketRecieved = callback;

    // create connection to server.
    // If we are in client only mode, fake a "server" locally.
    if (this.clientOnly == true) {
      this.clientServer = new ClientServer(this.onPacketRecieved);
      const syncRequest = { type: PacketType.RequestFullSync };
      this.send(syncRequest);
    }
    // connect to client normally.
    else {
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
  }

  public send(packet: Packet): void {
    const data = encodePacket(packet);
    if (this.clientOnly) {
      this.clientServer.packetRecieved(packet);
    } else {
      this.ws.send(data);
    }
  }

  private processServerMessage(event: MessageEvent): void {
    const packet = decodePacket(event.data);
    this.onPacketRecieved(packet);
  }
}
