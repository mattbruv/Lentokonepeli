import * as path from "path";
import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import { GameWorld } from "../dogfight/src/world";
import { MAP_CLASSIC } from "../dogfight/src/maps/classic";

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
  const json = JSON.stringify(updates);
  world.clearCache();

  if (json !== "{}") {
    // send updates to each client
    wss.clients.forEach((client): void => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(updates));
      }
    });
  }
  // console.log(updates);
  lastTick = currentTick;
}

setInterval(loop, 1000 / 20);

wss.on("connection", (ws): void => {
  console.log("New connection!");
  // get current world state and send it to newly player
  ws.send(JSON.stringify(world.getState()));

  ws.on("message", (message): void => {
    console.log("recieved" + message);
    ws.send("Hello, you sent" + message);
  });

  ws.on("close", (): void => {
    console.log("Client disconnected!");
  });
});

server.listen(PORT, (): void => {
  console.log("Server started on port", PORT);
});
