import { RectangleBody } from "../physics/rectangle";
import {
  isRectangleCollision,
  isPointRectCollision,
  isCircleRectCollision
} from "../physics/collision";
import { GameWorld } from "./world";
import {
  getTrooperRect,
  TrooperState,
  trooperGlobals
} from "../entities/Man";
import { getPlaneRect, Plane } from "../entities/Plane";
import { getGroundRect } from "../entities/Ground";
import { getWaterRect } from "../entities/water";
import { Vec2d } from "../physics/vector";
import { destroyTrooper } from "./trooper";
import { SCALE_FACTOR } from "../constants";
import { CircleBody } from "../physics/circle";
import { explosionGlobals } from "../entities/Explosion";
import { bulletGlobals } from "../entities/Bullet";
import { entityHash } from "../entity";
import { radiansToDirection } from "../physics/helpers";
import { getBombRect } from "../entities/Bomb";

export function processCollision(world: GameWorld): void {
  return;
  /*
  // get ground hitboxes
  const grounds = world.grounds.map(
    (g): RectangleBody => {
      return getGroundRect(g.x, g.y, g.width);
    }
  );
  // get water hitboxes
  const waters = world.waters.map(
    (w): RectangleBody => {
      return getWaterRect(w.x, w.y, w.width);
    }
  );

  // if bullets collide with entities, damage them.
  world.bullets.forEach((bullet): void => {
    // test
    const point: Vec2d = {
      x: bullet.x,
      y: bullet.y
    };
    for (const bomb of world.bombs) {
      if (isPointRectCollision(point, getBombRect(bomb.x, bomb.y, radiansToDirection(bomb.radians)))) {
        world.createExplosion(bomb.x, bomb.y, bomb.getPlayerInfo().getId(), bomb.team);
        world.removeEntity(bomb);
        world.removeEntity(bullet);
      }
    }
    for (const water of waters) {
      if (isPointRectCollision(point, water)) {
        world.removeEntity(bullet);
        return;
      }
    }
    for (const ground of grounds) {
      if (isPointRectCollision(point, ground)) {
        world.removeEntity(bullet);
        return;
      }
    }
    for (const trooper of world.troopers) {
      // don't kill our own teammates
      if (bullet.team == trooper.team) {
        continue;
      }
      const rect = getTrooperRect(trooper.x, trooper.y, trooper.state);
      if (isPointRectCollision(point, rect)) {
        world.removeEntity(bullet);
        destroyTrooper(world, trooper, false);
        return;
      }
    }
    for (const plane of world.planes) {
      // don't harm our own planes
      if (bullet.team == plane.team) {
        continue;
      }
      const rect = getPlaneRect(
        plane.x,
        plane.y,
        plane.direction,
        plane.planeType
      );
      if (isPointRectCollision(point, rect)) {
        //plane.damagePlane(world.cache, bulletGlobals.damage);
        world.removeEntity(bullet);
        return;
      }
    }
  });

  // if bombs collide with ground (plane in future)
  world.bombs.forEach((bomb): void => {
    const rectb = getBombRect(bomb.x, bomb.y, radiansToDirection(bomb.radians));
    //const point: Vec2d = {
    //  x: bomb.x,
    //  y: bomb.y
    //};
    for (const bomb2 of world.bombs) {
      if (!(bomb2.droppedBy == bomb.droppedBy && bomb2.age == bomb.age)) {
        if (isRectangleCollision(rectb, getBombRect(bomb2.x, bomb2.y, radiansToDirection(bomb2.radians)))) {
          world.createExplosion(bomb.x, bomb.y, bomb.getPlayerInfo().getId(), bomb.team);
          world.createExplosion(bomb2.x, bomb2.y, bomb2.getPlayerInfo().getId(), bomb2.team);
          world.removeEntity(bomb2);
          world.removeEntity(bomb);
        }
      }
    }
    for (const water of waters) {
      if (isRectangleCollision(rectb, water)) {
        world.removeEntity(bomb);
        return;
      }
    }
    for (const ground of grounds) {
      if (isRectangleCollision(rectb, ground)) {
        world.createExplosion(bomb.x, bomb.y, bomb.getPlayerInfo().getId(), bomb.team);
        world.removeEntity(bomb);
        return;
      }
    }

    for (const plane of world.planes) {
      if (bomb.team == plane.team) {
        continue;
      }
      const planeRect = getPlaneRect(
        plane.x,
        plane.y,
        plane.direction,
        plane.planeType
      );
      if (isRectangleCollision(rectb, planeRect)) {
        destroyPlane(world, plane, true);
        // world.createExplosion(bomb.x, bomb.y, bomb.droppedBy, bomb.team);
        world.removeEntity(bomb);
        return;
      }
    }

    for (const trooper of world.troopers) {
      if (bomb.team == trooper.team) {
        continue;
      }
      const troopRect = getTrooperRect(trooper.x, trooper.y, trooper.state);
      if (isRectangleCollision(rectb, troopRect)) {
        destroyTrooper(world, trooper, false);
        world.createExplosion(bomb.x, bomb.y, bomb.getPlayerInfo().getId(), bomb.team);
        world.removeEntity(bomb);
        return;
      }
    }
  });

  // Explosion damage/collision
  for (const explosion of world.explosions) {
    if (explosion.age > explosionGlobals.duration) {
      continue;
    }
    const explosionCircle: CircleBody = {
      center: { x: explosion.x, y: explosion.y },
      radius: explosionGlobals.radius
    };

    for (const t of world.troopers) {
      const tRect = getTrooperRect(t.x, t.y, t.state);
      if (isCircleRectCollision(explosionCircle, tRect)) {
        destroyTrooper(world, t, false);
      }
    }

    for (const plane of world.planes) {
      // make sure this explosion hasn't harmed this plane before.
      const hash = entityHash(plane);
      if (hash in explosion.affectedObjects) {
        break;
      }
      const pRect = getPlaneRect(
        plane.x,
        plane.y,
        plane.direction,
        plane.planeType
      );
      if (isCircleRectCollision(explosionCircle, pRect)) {
        plane.damagePlane(world.cache, explosionGlobals.damage);
        explosion.affectedObjects[hash] = true;
      }
    }
  }

  // see if planes collide with entities
  for (const plane of world.planes) {
    let isDead = false;
    const planeRect = getPlaneRect(
      plane.x,
      plane.y,
      plane.direction,
      plane.planeType
    );
    for (const ground of grounds) {
      if (isRectangleCollision(planeRect, ground)) {
        destroyPlane(world, plane, true);
        isDead = true;
        break;
      }
    }
    if (isDead) {
      continue;
    }
    // process water collisions.
    for (const water of waters) {
      if (isRectangleCollision(planeRect, water)) {
        destroyPlane(world, plane, false);
        isDead = true;
        break;
      }
    }

    // trooper collisions
    for (const trooper of world.troopers) {
      // don't kill teammates
      if (plane.team == trooper.team) {
        continue;
      }
      const rect = getTrooperRect(trooper.x, trooper.y, trooper.state);
      if (isRectangleCollision(planeRect, rect)) {
        destroyTrooper(world, trooper, false);
      }
    }
  }

  // see if troopers collide with water/ground
  for (const trooper of world.troopers) {
    const onGround =
      trooper.state == TrooperState.Standing ||
      trooper.state == TrooperState.Walking;
    let isDead = false;
    const trooperRect = getTrooperRect(trooper.x, trooper.y, trooper.state);
    for (const ground of grounds) {
      if (isRectangleCollision(trooperRect, ground)) {
        const slowEnoughToLand =
          trooper.vy > -trooperGlobals.crashSurviveSpeed * SCALE_FACTOR;
        if (slowEnoughToLand) {
          if (!onGround) {
            trooper.setState(world.cache, TrooperState.Standing);
          }
        } else {
          destroyTrooper(world, trooper, false);
          isDead = true;
        }
        break;
      } else if (onGround) {
        trooper.setState(world.cache, TrooperState.Falling);
      }
    }
    if (isDead) {
      continue;
    }

    // process trooper/water collisions.
    for (const water of waters) {
      if (isRectangleCollision(trooperRect, water)) {
        destroyTrooper(world, trooper, false);
        isDead = true;
        break;
      }
    }
  }
  //*/
}
