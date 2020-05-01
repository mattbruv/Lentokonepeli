import { RectangleBody } from "../physics/rectangle";
import {
  isRectangleCollision,
  isPointRectCollision,
  isCircleRectCollision
} from "../physics/collision";
import { GameWorld } from "./world";
import { destroyPlane } from "./plane";
import {
  getTrooperRect,
  TrooperState,
  trooperGlobals
} from "../objects/trooper";
import { getPlaneRect } from "../objects/plane";
import { getGroundRect } from "../objects/ground";
import { getWaterRect } from "../objects/water";
import { Vec2d } from "../physics/vector";
import { destroyTrooper } from "./trooper";
import { SCALE_FACTOR } from "../constants";
import { CircleBody } from "../physics/circle";
import { explosionGlobals } from "../objects/explosion";
import { bulletGlobals } from "../objects/bullet";

export function processCollision(world: GameWorld): void {
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
    for (const water of waters) {
      if (isPointRectCollision(point, water)) {
        world.removeObject(bullet);
        return;
      }
    }
    for (const ground of grounds) {
      if (isPointRectCollision(point, ground)) {
        world.removeObject(bullet);
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
        world.removeObject(bullet);
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
        plane.damagePlane(world.cache, bulletGlobals.damage);
        world.removeObject(bullet);
        return;
      }
    }
  });

  // if bombs collide with ground (plane in future)
  world.bombs.forEach((bomb): void => {
    const point: Vec2d = {
      x: bomb.x,
      y: bomb.y
    };
    for (const water of waters) {
      if (isPointRectCollision(point, water)) {
        world.removeObject(bomb);
        return;
      }
    }
    for (const ground of grounds) {
      if (isPointRectCollision(point, ground)) {
        world.createExplosion(bomb.x, bomb.y, bomb.droppedBy, bomb.team);
        world.removeObject(bomb);
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
      if (isPointRectCollision(point, planeRect)) {
        destroyPlane(world, plane, true);
        world.createExplosion(bomb.x, bomb.y, bomb.droppedBy, bomb.team);
        world.removeObject(bomb);
        return;
      }
    }

    for (const trooper of world.troopers) {
      if (bomb.team == trooper.team) {
        continue;
      }
      const troopRect = getTrooperRect(trooper.x, trooper.y, trooper.state);
      if (isPointRectCollision(point, troopRect)) {
        destroyTrooper(world, trooper, false);
        world.createExplosion(bomb.x, bomb.y, bomb.droppedBy, bomb.team);
        world.removeObject(bomb);
        return;
      }
    }
  });

  // Explosion damage/collision
  for (const explosion of world.explosions) {
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
      if (plane.explosionHits.includes(explosion.id)) {
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
        plane.explosionHits.push(explosion.id);
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
}
