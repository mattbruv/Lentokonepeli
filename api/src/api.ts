import express from "express";
import { WebSocketServer } from "ws";

const app = express();
app.use("/lang", express.static("lang"))
app.use(express.json());

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
    ws.on("message", (data) => {
    });

    ws.send("hello from API server!");
});


app.listen(3259, () => {
    console.log("Listening at http://localhost:3259");
});
