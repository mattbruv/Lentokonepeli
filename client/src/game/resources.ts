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
    console.log("FAILED TO LOAD RESOURCE: " + url);
  }
}

export function getTexture(texture: string) {
  console.log(
    PIXI.Loader.shared.resources[root].spritesheet?.textures[texture]
  );
  return PIXI.Loader.shared.resources[root].spritesheet?.textures[texture];
}
