import * as PIXI from "pixi.js";

let root: string;

export function loadResources(url: string, doneCB?: () => void) {
  if (!PIXI.Loader.shared.resources[url]) {
    console.log("Loading resource: " + url);
    root = url;
    PIXI.Loader.shared.add(url).load(() => {
      if (doneCB) doneCB();
    });
  } else {
    console.log("Failed to load resource: " + url);
  }
}

export function getTexture(texture: string) {
  return PIXI.Loader.shared.resources[root].spritesheet?.textures[texture];
}
