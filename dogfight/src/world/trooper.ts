import { GameWorld } from "./world";
import { PlayerStatus } from "../entities/PlayerInfo";
import { EntityType, Entity } from "../entity";
import { mod } from "../physics/helpers";
import { Man, trooperGlobals, TrooperDirection } from "../entities/Man";
import { Bullet, bulletGlobals } from "../entities/Bullet";
import { SCALE_FACTOR, ROTATION_DIRECTIONS } from "../constants";
import { distance, getAngle } from "../physics/vector";

function getTarget(world: GameWorld, trooper: Man, radius: number): any {
  const troopers = world.troopers.filter((troop): boolean => {
    return troop.team != trooper.team;
  });
  let closestTrooper: Entity;
  let trooperDistance = Infinity;
  troopers.forEach((target): void => {
    const objDistance = distance(
      { x: target.x, y: target.y },
      { x: trooper.x, y: trooper.y }
    );
    if (objDistance < trooperDistance) {
      trooperDistance = objDistance;
      closestTrooper = target;
    }
  });
  if (trooperDistance <= radius) {
    return closestTrooper;
  }
  const planes = world.planes.filter((plane): boolean => {
    return plane.team != trooper.team;
  });
  let closestPlane: Entity;
  let planeDistance = Infinity;
  planes.forEach((target): void => {
    const objDistance = distance(
      { x: target.x, y: target.y },
      { x: trooper.x, y: trooper.y }
    );
    if (objDistance < planeDistance && target.isAbandoned == false) {
      planeDistance = objDistance;
      closestPlane = target;
    }
  });
  if (planeDistance <= radius) {
    return closestPlane;
  }
  const runways = world.runways.filter((runway): boolean => {
    return runway.team != trooper.team;
  });
  let closestRunway: Entity;
  let runwayDistance = Infinity;
  runways.forEach((target): void => {
    const objDistance = distance(
      { x: target.x, y: target.y },
      { x: trooper.x, y: trooper.y }
    );
    if (objDistance < runwayDistance) {
      runwayDistance = objDistance;
      closestRunway = target;
    }
  });
  if (runwayDistance <= radius) {
    return closestRunway;
  } else {
    return null;
  }
}

export function processTroopers(world: GameWorld, deltaTime: number): void {
  world.troopers.forEach((trooper): void => {
    trooper.tick(world.cache, deltaTime);
    return;
    /*

    if (trooper.isShooting) {
      // add time elapsed to our shot timer
      trooper.lastShot += deltaTime;

      // is it time to shoot again?
      if (trooper.lastShot >= trooper.shotThreshold) {
        trooper.lastShot = mod(trooper.lastShot, trooper.shotThreshold);

        const bullet = new Bullet(
          world.nextID(EntityType.Bullet),
          world,
          world.cache,
          trooper,
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
            shotAngle = w0 / 2;
          }
        }
        const bulletSpeed = bulletGlobals.speed * SCALE_FACTOR;
        const vx = bulletSpeed * Math.cos((Math.PI * shotAngle) / w0);
        const vy = bulletSpeed * Math.sin((Math.PI * shotAngle) / w0);
        //bullet.setVelocity(world.cache, vx, vy);

        bullet.setPos(world.cache, trooper.x, trooper.y + 7);
        world.addEntity(bullet);
      }
    } else if (trooper.lastShot < trooper.shotThreshold) {
      trooper.lastShot += deltaTime;
    }
  //*/
  });
}

export function destroyTrooper(
  world: GameWorld,
  trooper: Man,
  doExplosion: boolean
): void {
  // set player info to pre-flight
  console.log("destroy");
  const player = world.getPlayerControlling(trooper);
  if (player != undefined) {
    player.setStatus(world.cache, PlayerStatus.Takeoff);
    player.setControl(world.cache, EntityType.None, 0);
  }
  if (doExplosion) {
    world.createExplosion(trooper.x, trooper.y, trooper);
  }
  world.removeEntity(trooper);
}
