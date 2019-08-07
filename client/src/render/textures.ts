import * as PIXI from "pixi.js";

export let spriteSheet: PIXI.Spritesheet;

const SPRITESHEET_PATH = "images/images.json";
const loader = PIXI.Loader.shared;

loader.onError.add((): void => {
  console.log("Error loading spritesheet! path: " + SPRITESHEET_PATH);
});

loader.onStart.add((): void => {
  console.log("loading spritesheet...");
});

export function loadSpriteSheet(callback: () => void): void {
  loader.onLoad.add((): void => {
    const percent = loader.progress;
    console.log("Loading... " + percent + "%");
    if (percent >= 100) {
      console.log("Successfully loaded spritesheet!");
      spriteSheet = loader.resources[SPRITESHEET_PATH].spritesheet;
      callback();
    }
  });

  loader.add(SPRITESHEET_PATH).load();
}
