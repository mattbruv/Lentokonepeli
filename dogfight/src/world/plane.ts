import { GameWorld } from "./world";
import { Plane } from "../objects/plane";
import { PlayerStatus } from "../objects/player";
import { GameObjectType } from "../object";
import { Explosion } from "../objects/explosion";
import { mod } from "../physics/helpers";
import { Bullet } from "../objects/bullet";

export function processPlanes(world: GameWorld, deltaTime: number): void {
  world.planes.forEach((plane): void => {
    plane.tick(world.cache, deltaTime);

    // Process machine gun
    if (plane.isShooting) {
      // add time elapsed to our shot timer
      plane.lastShot += deltaTime;

      // is it time to shoot again?
      if (plane.lastShot >= plane.shotThreshold) {
        // do we have ammo to shoot?
        if (plane.ammoCount > 0) {
          plane.lastShot = mod(plane.lastShot, plane.shotThreshold);
          plane.ammoCount--;
          const bullet = new Bullet(
            world.nextID(GameObjectType.Bullet),
            world.cache
          );
          plane.set(
            world.cache,
            "ammo",
            Math.round((plane.ammoCount / plane.maxAmmo) * 255)
          );

          bullet.setPos(world.cache, plane.x, plane.y);
          world.addObject(bullet);
        }
      }
    }
  });
}

export function destroyPlane(
  world: GameWorld,
  plane: Plane,
  doExplosion: boolean
): void {
  const x = plane.x;
  const y = plane.y;
  // set player info to pre-flight
  const player = world.getPlayerControlling(plane);
  if (player != undefined) {
    player.setStatus(world.cache, PlayerStatus.Takeoff);
    player.setControl(world.cache, GameObjectType.None, 0);
  }
  world.removeObject(plane);
  if (doExplosion) {
    const explosion = new Explosion(
      world.nextID(GameObjectType.Explosion),
      world.cache,
      x,
      y
    );
    world.explosions.push(explosion);
  }
}
