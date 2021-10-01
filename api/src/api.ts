import express from "express";
import { WebSocketServer } from "ws";
import { APIPacketOut, APIPacketOutType } from "lento-gui"
import { getServers } from "./servers";

const app = express();
app.use(express.static("public"))
app.use(express.json());

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
    ws.on("message", (data) => {
    });

    const servers: APIPacketOut = {
        type: APIPacketOutType.SERVER_INFO,
        servers: getServers()
    }
    ws.send(JSON.stringify(servers));
});

app.listen(3259, () => {
    console.log("Listening at http://localhost:3259");
});
