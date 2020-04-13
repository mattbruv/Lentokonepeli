import { RectangleBody } from "../physics/rectangle";
import { isRectangleCollision } from "../physics/collision";
import { GameWorld } from "./world";
import { destroyPlane } from "./plane";

export function processCollision(world: GameWorld): void {
  // get ground hitboxes
  const grounds = world.grounds.map(
    (g): RectangleBody => {
      return g.getRect();
    }
  );
  // get water hitboxes
  const waters = world.waters.map(
    (w): RectangleBody => {
      return w.getRect();
    }
  );

  // see if planes collide with water/ground
  for (const plane of world.planes) {
    let isDead = false;
    const planeRect = plane.getRect();
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
