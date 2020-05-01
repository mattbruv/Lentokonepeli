import { GameWorld } from "./world";
import { PlayerStatus } from "../objects/player";
import { GameObjectType, GameObject } from "../object";
import { mod } from "../physics/helpers";
import { Trooper, trooperGlobals, TrooperDirection } from "../objects/trooper";
import { Bullet, bulletGlobals } from "../objects/bullet";
import { SCALE_FACTOR, ROTATION_DIRECTIONS, Team } from "../constants";
import { distance, getAngle } from "../physics/vector";

function getTarget(world: GameWorld, trooper: Trooper, radius: number): any {
  const runways = world.runways.filter((runway): boolean => {
    return runway.team != trooper.team;
  });
  const troopers = world.troopers.filter((trooper): boolean => {
    return trooper.team != trooper.team;
  });
  const planes = world.planes.filter((plane): boolean => {
    return plane.team != trooper.team;
  });
  const targetables = [].concat(runways, troopers, planes);
  let chosenTarget: GameObject;
  let closest = Infinity;
  targetables.forEach((target): void => {
    const objDistance = distance(
      { x: target.x, y: target.y },
      { x: trooper.x, y: trooper.y }
    );
    if (objDistance < closest) {
      closest = objDistance;
      chosenTarget = target;
    }
  });
  if (closest <= radius) {
    return chosenTarget;
  } else {
    return null;
  }
}

export function processTroopers(world: GameWorld, deltaTime: number): void {
  world.troopers.forEach((trooper): void => {
    trooper.tick(world.cache, deltaTime);

    if (trooper.isShooting) {
      // add time elapsed to our shot timer
      trooper.lastShot += deltaTime;

      // is it time to shoot again?
      if (trooper.lastShot >= trooper.shotThreshold) {
        trooper.lastShot = mod(trooper.lastShot, trooper.shotThreshold);

        const bullet = new Bullet(
          world.nextID(GameObjectType.Bullet),
          world.cache,
          trooper.id,
          trooper.team
        );

        // set bullet speed/direction relative to trooper.
        const w0 = ROTATION_DIRECTIONS / 2;
        let shotAngle: number;
        const target = getTarget(world, trooper, trooperGlobals.targetRadius);
        if (target != null) {
          shotAngle = getAngle({
            x: target.x - trooper.x,
            y: target.y - trooper.y
          });
        } else {
          shotAngle = trooper.direction == TrooperDirection.Right ? 0 : w0;
          if (trooper.direction == TrooperDirection.None) {
            shotAngle = Math.random() * w0;
          }
        }
        const bulletSpeed = bulletGlobals.speed * SCALE_FACTOR;
        const vx = bulletSpeed * Math.cos((Math.PI * shotAngle) / w0);
        const vy = bulletSpeed * Math.sin((Math.PI * shotAngle) / w0);
        bullet.setVelocity(world.cache, vx, vy);

        bullet.setPos(world.cache, trooper.x, trooper.y + 7);
        world.addObject(bullet);
      }
    } else if (trooper.lastShot < trooper.shotThreshold) {
      trooper.lastShot += deltaTime;
    }
  });
}

export function destroyTrooper(
  world: GameWorld,
  trooper: Trooper,
  doExplosion: boolean
): void {
  // set player info to pre-flight
  const player = world.getPlayerControlling(trooper);
  if (player != undefined) {
    player.setStatus(world.cache, PlayerStatus.Takeoff);
    player.setControl(world.cache, GameObjectType.None, 0);
  }
  if (doExplosion) {
    world.createExplosion(trooper.x, trooper.y, player.id, trooper.team);
  }
  world.removeObject(trooper);
}
