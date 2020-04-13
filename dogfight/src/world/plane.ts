import { GameWorld } from "./world";
import { Plane } from "../objects/plane";
import { PlayerStatus } from "../objects/player";
import { GameObjectType } from "../object";
import { Explosion } from "../objects/explosion";

export function processPlanes(world: GameWorld, deltaTime: number): void {
  world.planes.forEach((plane): void => {
    plane.tick(world.cache, deltaTime);

    // if fuel has run out, kill entity.
    /*
    if (plane.fuel <= 0) {
      //world.removeObject(plane);
    }*/
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
  player.setStatus(world.cache, PlayerStatus.Takeoff);
  player.setControl(world.cache, GameObjectType.None, 0);
  world.removeObject(plane);
  if (doExplosion) {
    const explosion = new Explosion(world.nextID(), world.cache, x, y);
    world.explosions.push(explosion);
  }
}
