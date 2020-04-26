import { GameWorld } from "./world";
import { PlayerStatus } from "../objects/player";
import { GameObjectType } from "../object";
import { Trooper } from "../objects/trooper";

export function processTroopers(world: GameWorld, deltaTime: number): void {
  world.troopers.forEach((trooper): void => {
    trooper.tick(world.cache, deltaTime);
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
