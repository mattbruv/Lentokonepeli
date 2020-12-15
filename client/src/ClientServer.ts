import { GameWorld } from "../../dogfight/src/world/world";
import { PacketType, Packet } from "../../dogfight/src/network/types";
import { PlayerInfo } from "../../dogfight/src/entities/PlayerInfo";
import { TeamOption } from "./teamSelector";
import { Team } from "../../dogfight/src/constants";
import { requestTakeoff } from "../../dogfight/src/world/takeoff";
import { loadMap } from "../../dogfight/src/world/map";
import { MAP_CLASSIC_2 } from "../../dogfight/src/maps/classic2";
import { isNameValid } from "../../dogfight/src/validation";
import { ClientState, ConnectionState } from "./clientState";
import { spriteSheet } from "./render/textures";

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
  private player: PlayerInfo;
  private hasJoined = false;

  // Game loop function
  public constructor(callback: messageCallback, img) {
    console.log("Local game server started!");

    this.serverMsg = callback;
    ClientState.connection = ConnectionState.OPEN;

    this.world = new GameWorld(img);
    loadMap(this.world, MAP_CLASSIC_2);
    setInterval((): void => {
      this.loop();
    }, 1000 / 100);
  }

  public packetRecieved(packet: Packet): void {
    switch (packet.type) {
      case PacketType.UserGameInput: {
        if (this.player == undefined) {
          break;
        }
        const key = packet.data.key;
        const isPressed = packet.data.isPressed === true;
        this.player.inputState[key] = isPressed;
        this.world.queueInput(this.player.id, key, isPressed);
        break;
      }
      case PacketType.RequestFullSync: {
        const state = this.world.getState();
        const data: Packet = { type: PacketType.FullSync, data: state };
        // console.log(data);
        this.serverMsg(data);
        this.hasJoined = true;
        break;
      }
      case PacketType.RequestTakeoff: {
        requestTakeoff(this.world, this.player, packet.data);
        break;
      }
      case PacketType.ChangeName: {
        const newName = packet.data.name;
        console.log("processing", newName);

        if (isNameValid(newName) && this.player !== undefined) {
          this.player.setName(this.world.cache, newName);
        }
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
        if (packet.data.name !== undefined) {
          const name = packet.data.name;
          if (isNameValid(name)) {
            this.player.setName(this.world.cache, name);
          }
        }
        console.log(
          "Created new Player: id",
          this.player.id,
          Team[this.player.team]
        );
        const response: Packet = {
          type: PacketType.AssignPlayer,
          data: {
            id: this.player.id,
            team: this.player.team,
            name: this.player.name
          }
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
