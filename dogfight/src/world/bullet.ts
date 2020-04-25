import { GameWorld } from "./world";
import { bulletGlobals } from "../objects/bullet";
export function processBullets(world: GameWorld, deltaTime: number): void {
  world.bullets.forEach((bullet): void => {
    bullet.tick(world.cache, deltaTime);
    // if the bullet is too old, destroy it.
    if (bullet.age > bulletGlobals.lifetime) {
      world.removeObject(bullet);
      return;
    }
  });
}

export function processBombs(world: GameWorld, deltaTime: number): void {
  world.bombs.forEach((bomb): void => {
    bomb.tick(world.cache, deltaTime);
    // if the bullet is too old, destroy it.
    if (bomb.age > bulletGlobals.lifetime) {
      world.removeObject(bomb);
      return;
    }
  });
}
