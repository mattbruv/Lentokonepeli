import { PIXI } from 'node-pixi';
const app = new PIXI.Application({ forceCanvas: true });

export let spriteSheet: PIXI.spriteSheet;

const sheetPath = "https://raw.githubusercontent.com/APN-Pucky/Lentokonepeli/master/client/public/images/images.json";//"assets/images/images.json";
//const sheetPath = "assets/images/images.json";
const loader = PIXI.loader;

loader.onError.add((): void => {
  console.log("Error loading spritesheet! path: " + sheetPath);
});

loader.onStart.add((): void => {
  console.log("loading spritesheet...");
});

export function loadSpriteSheet(callback: () => void, sheetPat = sheetPath) {
  loader.onLoad.add((): void => {
    const percent = loader.progress;
    console.log("Loading... " + percent + "%");
    if (percent >= 100) {
      console.log("Successfully loaded spritesheet!");
      spriteSheet = loader.resources[sheetPath].spritesheet;
      callback();
    }
  });
  loader.add(sheetPat).load();
  //spriteSheet = { textures: { width: 0, height: 0 } };
  //callback();
}
