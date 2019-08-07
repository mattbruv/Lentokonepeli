import { GameWorld } from "../../../dogfight/src/engine/world";
import { GroundSprite } from "./sprites/ground";

export interface RenderWorld {
  world: PIXI.Container;
  grounds: GroundSprite[];
}

export function renderNewWorldState(
  renderer: RenderWorld,
  newData: GameWorld
): void {
  newData.grounds.map((x): void => {
    const sprite = new GroundSprite(renderer.world);
    sprite.addSprite(x);
    renderer.grounds.push(sprite);
  });
}
