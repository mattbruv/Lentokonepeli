import { GameWorld } from "./world";

export function processTroopers(world: GameWorld, deltaTime: number): void {
  world.troopers.forEach((trooper): void => {
    trooper.tick(world.cache, deltaTime);
  });
}
