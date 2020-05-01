import { GameWorld } from "./world";
import { explosionGlobals } from "../objects/explosion";

export function processExplosions(world: GameWorld, deltaTime: number): void {
  world.explosions.forEach((explosion): void => {
    explosion.tick(world.cache, deltaTime);
    if (explosion.age > explosionGlobals.despawnTime) {
      world.removeObject(explosion);
    }
  });
}
