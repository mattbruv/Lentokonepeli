import { GameWorld } from "./world";

export function processExplosions(world: GameWorld, deltaTime: number): void {
  world.explosions.forEach((explosion): void => {
    explosion.tick(world.cache, deltaTime);
    if (explosion.age > 1000) {
      world.removeObject(explosion);
    }
  });
}
