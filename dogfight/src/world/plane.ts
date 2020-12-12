import { GameWorld } from "./world";
import { Plane } from "../entities/plane";
import { PlayerStatus } from "../entities/player";
import { EntityType } from "../TypedEntity";
import { mod, directionToRadians } from "../physics/helpers";
import { Bullet, bulletGlobals } from "../entities/bullet";
import { SCALE_FACTOR } from "../constants";
import { Bomb } from "../entities/bomb";

export function processPlanes(world: GameWorld, deltaTime: number): void {
  world.planes.forEach((plane): void => {
    plane.tick(world.cache, deltaTime);

    ///*
    // if below health, lose control
    if (plane.health <= 0 && !plane.isAbandoned) {
      plane.abandonPlane(world.cache);
    }

    // Process machine gun
    if (plane.isShooting) {
      // add time elapsed to our shot timer
      plane.lastShot += deltaTime;

      // is it time to shoot again?
      if (plane.lastShot >= plane.shotDelay) {
        // do we have ammo to shoot?
        if (plane.ammo > 0) {
          plane.lastShot = mod(plane.lastShot, plane.shotDelay);
          plane.ammo--;

          const bullet = new Bullet(
            world.nextID(EntityType.Bullet),
            world.cache,
            plane.id,
            plane.team
          );
          const vx = Math.cos(directionToRadians(plane.direction));
          const vy = Math.sin(directionToRadians(plane.direction));

          const speed =
            (bulletGlobals.speed + plane.speed) *
            SCALE_FACTOR;
          bullet.setVelocity(world.cache, speed * vx, speed * vy);

          //plane.set(
          //  world.cache,
          //  "ammo",
          //  Math.round((plane.ammo / plane.maxAmmo) * 255)
          //);

          //const bulletx = Math.round(plane.x + (plane.width * vx) / 2);
          //const bullety = Math.round(plane.y + (plane.width * vy) / 2);

          // set bullet speed/direction relative to plane.
          bullet.setPos(world.cache, plane.x + Math.cos(directionToRadians(plane.direction)) * (plane.width / 2 + 2),
            plane.y + Math.sin(directionToRadians(plane.direction)) * (plane.width / 2 + 2));
          world.addObject(bullet);
        }
      }
    } else if (plane.lastShot < plane.shotDelay) {
      plane.lastShot += deltaTime;
    }
    //*/

    // add time elapsed to our bomb timer
    if (plane.lastBomb <= plane.bombDelay) {
      plane.lastBomb += deltaTime;
    }
    if (plane.isBombing) {
      //console.log("bomb" + plane.lastBomb + " " + plane.bombDelay)
      // is it time to bomb again?
      if (plane.lastBomb >= plane.bombDelay) {
        // do we have bombs to drop?
        if (plane.bombs > 0) {
          plane.lastBomb = mod(plane.lastBomb, plane.bombDelay);
          plane.setBombs(world.cache, plane.bombs - 1);

          const bomb = new Bomb(
            world.nextID(EntityType.Bomb),
            world.cache,
            plane.controlledBy,
            plane.team
          );

          // set bomb speed/direction relative to plane.
          bomb.setPos(world.cache, plane.x, plane.y);
          bomb.setDirection(world.cache, plane.direction);
          bomb.setSpeed(world.cache, plane.speed);
          world.addObject(bomb);
        }
      }
    }
    //*/
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
    player.setControl(world.cache, EntityType.None, 0);
  }
  if (doExplosion) {
    world.createExplosion(x, y, plane.controlledBy, plane.team);
  }
  world.removeObject(plane);
}
