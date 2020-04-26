import { RectangleBody } from "../physics/rectangle";
import {
  isRectangleCollision,
  isPointRectCollision
} from "../physics/collision";
import { GameWorld } from "./world";
import { destroyPlane } from "./plane";
import { getTrooperRect, TrooperState } from "../objects/trooper";
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

  // if bullets collide with ground (plane in future)
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

  // see if planes collide with water/ground
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
  }

  // see if troopers collide with water/ground
  for (const trooper of world.troopers) {
    if (
      trooper.state == TrooperState.Standing ||
      trooper.state == TrooperState.Walking
    ) {
      break;
    }
    let isDead = false;
    const trooperRect = getTrooperRect(trooper.x, trooper.y);
    for (const ground of grounds) {
      if (isRectangleCollision(trooperRect, ground)) {
        if (trooper.vy > -200 * SCALE_FACTOR) {
          trooper.setState(world.cache, TrooperState.Standing);
        } else {
          destroyTrooper(world, trooper, false);
          isDead = true;
        }
        break;
      }
    }
    if (isDead) {
      continue;
    }
    // process water collisions.
    for (const water of waters) {
      if (isRectangleCollision(trooperRect, water)) {
        destroyTrooper(world, trooper, false);
        isDead = true;
        break;
      }
    }
  }
}
