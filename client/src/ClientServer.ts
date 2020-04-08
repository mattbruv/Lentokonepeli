import { GameWorld } from "../../dogfight/src/world";
import { MAP_CLASSIC } from "../../dogfight/src/maps/classic";
import { PacketType, Packet } from "../../dogfight/src/network/types";
import { Player } from "../../dogfight/src/objects/player";
import { TeamOption } from "./teamSelector";
import { Team } from "../../dogfight/src/constants";

type messageCallback = (data: Packet) => void;

/**
 * A fake "server" that runs only on the client.
 * Useful for testing things that only require one person,
 * such as plane physics, etc.
 *
 * Eventually could be used to parse game replay files.
 */
export class ClientServer {
  private world: GameWorld;

  // Game loop timing variables
  public startTime = Date.now();
  public lastTick = 0;
  private serverMsg: messageCallback;
  private player: Player;
  private hasJoined = false;

  // Game loop function
  public constructor(callback: messageCallback) {
    console.log("Local game server started!");

    this.serverMsg = callback;

    this.world = new GameWorld();
    this.world.loadMap(MAP_CLASSIC);
    setInterval((): void => {
      this.loop();
    }, 1000 / 60);
  }

  public packetRecieved(packet: Packet): void {
    switch (packet.type) {
      case PacketType.UserGameInput: {
        const key = packet.data.key;
        const isPressed = packet.data.isPressed === true;
        this.player.inputState[key] = isPressed;
        this.world.queueInput(this.player.id, key, isPressed);
        break;
      }
      case PacketType.RequestFullSync: {
        const state = this.world.getState();
        const data: Packet = { type: PacketType.FullSync, data: state };
        console.log(data);
        this.serverMsg(data);
        this.hasJoined = true;
        break;
      }
      case PacketType.RequestTakeoff: {
        this.world.requestTakeoff(this.player, packet.data);
        break;
      }
      case PacketType.RequestJoinTeam: {
        let selection = packet.data.team;
        switch (selection) {
          case TeamOption.Centrals:
            selection = Team.Centrals;
            break;
          case TeamOption.Allies:
            selection = Team.Allies;
            break;
          default:
            selection = Math.random() < 0.5 ? Team.Centrals : Team.Allies;
            break;
        }
        this.player = this.world.addPlayer(selection);
        console.log(
          "Created new Player: id",
          this.player.id,
          Team[this.player.team]
        );
        const response: Packet = {
          type: PacketType.AssignPlayer,
          data: { id: this.player.id, team: this.player.team }
        };
        this.serverMsg(response);
        break;
      }
    }
  }

  private loop(): void {
    const currentTick = Date.now() - this.startTime;
    const deltaTime = currentTick - this.lastTick;
    const updates = this.world.tick(deltaTime);
    this.world.clearCache();

    if (Object.keys(updates).length > 0 && this.hasJoined) {
      const packet = { type: PacketType.ChangeSync, data: updates };
      this.serverMsg(packet);
    }
    this.lastTick = currentTick;
  }
}
