import * as path from "path";
import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { GameWorld } from "../dogfight/src/world";
import { MAP_CLASSIC } from "../dogfight/src/maps/classic";
import { pack, unpack } from "../dogfight/src/network/packer";
import { PacketType, Packet } from "../dogfight/src/network/types";

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
    // send updates to each client
    wss.clients.forEach((client): void => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(pack({ type: PacketType.ChangeSync, data: updates }));
      }
    });
  }
  // console.log(updates);
  lastTick = currentTick;
}

setInterval(loop, 1000 / 30);

wss.on("connection", (ws): void => {
  console.log("New connection!");
  // Create this new player and add them to the game.
  // const me = world.addPlayer();

  ws.on("message", (message): void => {
    // parse into packet structure
    const packet = unpack(message as string);
    console.log("Recieved", packet);

    // send world state to newly connected player.
    if (packet.type == PacketType.RequestFullSync) {
      // get current world state and send it to newly player
      const state = world.getState();
      const data: Packet = { type: PacketType.FullSync, data: state };
      ws.send(pack(data));
    }
  });

  ws.on("close", (): void => {
    // world.removePlayer(me);
    // console.log("Client disconnected: Player", me.id);
  });
});

server.listen(PORT, (): void => {
  console.log("Server started on port", PORT);
});
