// import * as PIXI from "pixi.js";
import { loadSpriteSheet } from "../src/render/textures";
import { CLASSIC_MAP } from "../../dogfight/src/maps/classic";
import { GameClient } from "../src/client";
import {
  ManOptions,
  ManStatus,
  createMan
} from "../../dogfight/src/entities/man";
import { getUniqueEntityID } from "../../dogfight/src/entities/entity";

let client: GameClient;

function loop(): void {
  client.localEngine.tick();
  window.requestAnimationFrame(loop);
}

function init(): void {
  client = new GameClient();
  client.localEngine.loadMap(CLASSIC_MAP);
  client.renderer.centerCamera(-1800, 0);

  const man: ManOptions = {
    position: { x: -1600, y: 100 },
    status: ManStatus.Parachuting
  };
  const man1 = createMan(man, getUniqueEntityID(client.localEngine.entities));
  client.localEngine.addEntity(man1);

  // append to document grid
  const grid = document.getElementById("container");
  grid.appendChild(client.renderer.getView());

  window.requestAnimationFrame(loop);
}

window.addEventListener("load", (): void => {
  loadSpriteSheet(init);
});
