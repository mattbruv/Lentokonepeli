import * as path from "path";
import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { GameWorld } from "../dogfight/src/world";
import { MAP_CLASSIC } from "../dogfight/src/maps/classic";
import { PacketType, Packet } from "../dogfight/src/network/types";
import { Player } from "../dogfight/src/objects/player";
import { TeamOption } from "../client/src/teamSelector";
import { Team } from "../dogfight/src/constants";
import { decodePacket, encodePacket } from "../dogfight/src/network/encode";
import { InputChange, InputKey } from "../dogfight/src/input";

const PORT = 3259;

const app = express();
const filepath = path.join(__dirname, "../dist");
console.log(filepath);
app.use(express.static(filepath));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize game world.
const world = new GameWorld();
world.loadMap(MAP_CLASSIC);

// Game loop timing variables
let startTime = Date.now();
let lastTick = 0;

// Game loop function
function loop(): void {
  const currentTick = Date.now() - startTime;
  const deltaTime = currentTick - lastTick;
  // console.log(lastTick, currentTick, deltaTime);
  const updates = world.tick(deltaTime);
  world.clearCache();

  if (Object.keys(updates).length > 0) {
    const packet = { type: PacketType.ChangeSync, data: updates };
    // send updates to each client
    wss.clients.forEach((client): void => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(encodePacket(packet));
      }
    });
  }
  lastTick = currentTick;
}

setInterval(loop, 1000 / 60);

wss.on("connection", (ws): void => {
  console.log("New connection!");
  ws.binaryType = "arraybuffer";

  let player: Player = undefined;

  ws.on("message", (message): void => {
    // parse into packet structure
    const packet = decodePacket(message as string | ArrayBuffer);

    // process user input
    if (packet.type == PacketType.UserGameInput) {
      const data: InputChange = packet.data;
      const key = data.key;
      const isPressed = data.isPressed === true;
      // if they sent a valid key, send it to server.
      if (key in InputKey) {
        // set in our player keys
        const state = player.inputState[key];
        // if there is an actual difference, send it to the engine.
        if (state !== isPressed) {
          world.queueInput(player.id, key, isPressed);
          player.inputState[key] = isPressed;
        }
      }
    }

    // send world state to newly connected player.
    if (packet.type == PacketType.RequestFullSync) {
      // get current world state and send it to newly player
      const state = world.getState();
      const data: Packet = { type: PacketType.FullSync, data: state };
      ws.send(encodePacket(data));
      return;
    }

    if (packet.type == PacketType.RequestTakeoff) {
      world.requestTakeoff(player, packet.data);
    }

    if (packet.type == PacketType.RequestJoinTeam) {
      // Ignore this if we've already assigned them a player.
      if (player !== undefined) {
        return;
      }
      // make sure our data is valid
      let selection = packet.data.team;
      // validate selection
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
      player = world.addPlayer(selection);
      console.log("Created new Player: id", player.id, Team[player.team]);

      const response: Packet = {
        type: PacketType.AssignPlayer,
        data: { id: player.id, team: player.team }
      };
      ws.send(encodePacket(response));
      return;
    }
  });

  ws.on("close", (): void => {
    if (player !== undefined) {
      world.removePlayer(player);
      console.log("Client disconnected: Player", player.id);
    }
  });
});

server.listen(PORT, (): void => {
  console.log("Server started on port", PORT);
});
