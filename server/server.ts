import * as path from "path";
import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";

const app = express();
const filepath = path.join(__dirname, "../dist");
console.log(filepath);
app.use(express.static(filepath));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws): void => {
  ws.on("message", (message): void => {
    console.log("recieved" + message);
    ws.send("Hello, you sent" + message);
  });

  ws.send("Hello, I am the server");
});

server.listen(process.env.PORT || 3259, (): void => {
  console.log("Server started on port" + server.address().toString());
});
