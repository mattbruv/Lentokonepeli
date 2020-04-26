import { GameWorld } from "./world";

export function processBombs(world: GameWorld, deltaTime: number): void {
  world.bombs.forEach((bomb): void => {
    bomb.tick(world.cache, deltaTime);
  });
}
