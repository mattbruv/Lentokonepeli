import { GameWorld } from "./world";
import { Plane, planeData } from "../objects/plane";
import { PlayerStatus } from "../objects/player";
import { GameObjectType } from "../object";
import { Explosion } from "../objects/explosion";
import { mod } from "../physics/helpers";
import { Bullet, Bomb } from "../objects/bullet";
import { SCALE_FACTOR } from "../constants";
import { magnitude, scale } from "../physics/vector";

export function processPlanes(world: GameWorld, deltaTime: number): void {
  world.planes.forEach((plane): void => {
    plane.tick(world.cache, deltaTime);

    // Process machine gun
    // add time elapsed to our shot timer
    if (plane.lastShot <= plane.shotThreshold) {
      plane.lastShot += deltaTime;
    }
    if (plane.isShooting) {
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

          const vx = plane.v.x / plane.speed;
          const vy = plane.v.y / plane.speed;
          const speed = (bullet.speed + Math.round(plane.speed / SCALE_FACTOR)) * SCALE_FACTOR;
          bullet.setVelocity(world.cache, speed * vx, speed * vy);

          // set bullet speed/direction relative to plane.
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


    // add time elapsed to our shot timer
    if (plane.lastBomb <= plane.bombThreshold) {
      plane.lastBomb += deltaTime;
    }
    if (plane.isBombing) {
      // is it time to shoot again?
      if (plane.lastBomb >= plane.bombThreshold) {
        // do we have ammo to shoot?
        if (plane.bombs > 0) {
          plane.lastBomb = mod(plane.lastBomb, plane.bombThreshold);
          plane.bombs--;
          const bomb = new Bomb(
            world.nextID(GameObjectType.Bomb),
            world.cache
          );

          bomb.setVelocity(world.cache, plane.v.x, plane.v.y);

          // set bomb speed/direction relative to plane.
          plane.set(
            world.cache,
            "bombs",
            plane.bombs
          );

          bomb.setPos(world.cache, plane.x, plane.y);
          world.addObject(bomb);
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
