import { PacketType, Packet } from "../../dogfight/src/network/types";
import { encodePacket, decodePacket } from "../../dogfight/src/network/encode";
import { ClientServer } from "./ClientServer";
import { BuildType } from "../../dogfight/src/constants";
import { ClientState, ConnectionState } from "./clientState";

const wssPath = "ws://" + location.host;

export type packetCallback = (data: Packet) => void;

export class NetworkHandler {
  /**
   * WebSocket connection
   */
  private ws: WebSocket;

  private onPacketRecieved: packetCallback;

  private clientOnly = process.env.BUILD == BuildType.Client;
  private clientServer: ClientServer;

  public constructor(callback: packetCallback, img) {
    // console.log("network handler made!");
    this.onPacketRecieved = callback;

    // create connection to server.
    // If we are in client only mode, fake a "server" locally.
    if (this.clientOnly == true) {
      this.clientServer = new ClientServer(this.onPacketRecieved, img);
      const syncRequest = { type: PacketType.RequestFullSync };
      this.send(syncRequest);
    }
    // connect to client normally.
    else {
      this.ws = new WebSocket(wssPath);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = (): void => {
        ClientState.connection = ConnectionState.OPEN;
        const syncRequest = { type: PacketType.RequestFullSync };
        this.send(syncRequest);
      };

      this.ws.onclose = (): void => {
        ClientState.connection = ConnectionState.CLOSED;
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
