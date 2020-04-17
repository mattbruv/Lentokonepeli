import { RectangleBody } from "../physics/rectangle";
import { isRectangleCollision } from "../physics/collision";
import { GameWorld } from "./world";
import { destroyPlane } from "./plane";
import { getPlaneRect } from "../objects/plane";
import { getGroundRect } from "../objects/ground";
import { getWaterRect } from "../objects/water";

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
}
