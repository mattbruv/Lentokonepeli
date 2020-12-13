import { GameWorld } from "./world";
import { bulletGlobals } from "../entities/Bullet";
export function processBullets(world: GameWorld, deltaTime: number): void {
  world.bullets.forEach((bullet): void => {
    bullet.tick(world.cache, deltaTime);
    // if the bullet is too old, destroy it.
    if (bullet.age > bulletGlobals.lifetime) {
      //world.removeObject(bullet);
      return;
    }
  });
}
