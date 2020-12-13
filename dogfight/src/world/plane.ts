import { GameWorld } from "./world";
import { Plane } from "../entities/Plane";
import { PlayerStatus } from "../entities/PlayerInfo";
import { EntityType } from "../entity";
import { mod, directionToRadians } from "../physics/helpers";
import { Bullet, bulletGlobals } from "../entities/Bullet";
import { SCALE_FACTOR } from "../constants";
import { Bomb } from "../entities/Bomb";

export function processPlanes(world: GameWorld, deltaTime: number): void {
  world.planes.forEach((plane): void => {
    plane.tick(world.cache, deltaTime);

    ///*
    // if below health, lose control
    if (plane.health <= 0 && !plane.isAbandoned) {
      plane.abandonPlane(world.cache);
    }


    //*/


    //*/
  });
}
