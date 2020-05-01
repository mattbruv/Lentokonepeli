import { GameWorld } from "./world";
import { Plane } from "../objects/plane";
import { PlayerStatus } from "../objects/player";
import { GameObjectType } from "../object";
import { mod } from "../physics/helpers";
import { Bullet, bulletGlobals } from "../objects/bullet";
import { SCALE_FACTOR } from "../constants";
import { Bomb } from "../objects/bomb";

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
            world.cache,
            plane.id,
            plane.team
          );

          // set bullet speed/direction relative to plane.
          const vx = plane.v.x / plane.speed;
          const vy = plane.v.y / plane.speed;

          const speed =
            (bulletGlobals.speed + Math.round(plane.speed / SCALE_FACTOR)) *
            SCALE_FACTOR;
          bullet.setVelocity(world.cache, speed * vx, speed * vy);

          plane.set(
            world.cache,
            "ammo",
            Math.round((plane.ammoCount / plane.maxAmmo) * 255)
          );

          const bulletx = Math.round(plane.x + (plane.width * vx) / 2);
          const bullety = Math.round(plane.y + (plane.width * vy) / 2);
          bullet.setPos(world.cache, bulletx, bullety);
          world.addObject(bullet);
        }
      }
    } else if (plane.lastShot < plane.shotThreshold) {
      plane.lastShot += deltaTime;
    }

    // add time elapsed to our bomb timer
    if (plane.lastBomb <= plane.bombThreshold) {
      plane.lastBomb += deltaTime;
    }
    if (plane.isBombing) {
      // is it time to bomb again?
      if (plane.lastBomb >= plane.bombThreshold) {
        // do we have bombs to drop?
        if (plane.bombs > 0) {
          plane.lastBomb = mod(plane.lastBomb, plane.bombThreshold);
          plane.setBombs(world.cache, plane.bombs - 1);

          const bomb = new Bomb(
            world.nextID(GameObjectType.Bomb),
            world.cache,
            plane.controlledBy,
            plane.team
          );

          // set bomb speed/direction relative to plane.
          bomb.setVelocity(world.cache, plane.v.x, plane.v.y);

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
  if (doExplosion) {
    world.createExplosion(x, y, plane.controlledBy, plane.team);
  }
  world.removeObject(plane);
}
