import { RectangleBody } from "../physics/rectangle";
import {
  isRectangleCollision,
  isPointRectCollision
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
      }
    }
    for (const ground of grounds) {
      if (isPointRectCollision(point, ground)) {
        world.removeObject(bullet);
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
      }
    }
    for (const ground of grounds) {
      if (isPointRectCollision(point, ground)) {
        world.createExplosion(bomb.x, bomb.y, bomb.droppedBy, bomb.team);
        world.removeObject(bomb);
      }
    }
  });

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
