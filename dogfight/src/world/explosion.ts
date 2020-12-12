import { GameWorld } from "./world";
import { explosionGlobals } from "../entities/explosion";

export function processExplosions(world: GameWorld, deltaTime: number): void {
  world.explosions.forEach((explosion): void => {
    explosion.tick(world.cache, deltaTime);
    if (explosion.age > explosionGlobals.despawnTime) {
      world.removeEntity(explosion);
    }
  });
}
