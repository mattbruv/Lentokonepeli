require("dotenv").config();

const express = require("express");
const ws = require("ws");

const app = express();
app.use(express.json());

const port = 3259;

const wss = new ws.Server({ port: 420 });

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
