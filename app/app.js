require("dotenv").config();

const express = require("express");
const ws = require("ws");

const app = express();
const port = 3259;

const wss = new ws.Server({ port: 420 });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("Recieved message => " + message);
  });
  ws.send("Hello from server!");
});

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/test", (req, res) => {
  res.send(
    JSON.stringify({
      foo: true,
    })
  );
});

// server post route
app.post("/server", (req, res) => {
  console.log(req.body);
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
