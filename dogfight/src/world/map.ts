import { GameWorld } from "./world";
import { Ground } from "../objects/ground";
import { Flag } from "../objects/flag";
import { Hill } from "../objects/hill";
import { Runway } from "../objects/runway";
import { Tower } from "../objects/tower";
import { Water } from "../objects/water";

/**
 * A declaritive object that describes a level.
 * You can list all of the objects
 * that are to appear in this map here.
 */
export interface GameMap {
  grounds: any[];
  waters: any[];
  runways: any[];
  flags: any[];
  towers: any[];
  hills: any[];
}

export function loadMap(world: GameWorld, map: GameMap): void {
  map.grounds.forEach((ground): void => {
    const obj = new Ground(world.nextID(), world.cache);
    obj.setData(world.cache, ground);
    world.grounds.push(obj);
  });
  map.flags.forEach((flag): void => {
    const obj = new Flag(world.nextID(), world.cache);
    obj.setData(world.cache, flag);
    world.flags.push(obj);
  });
  map.hills.forEach((hill): void => {
    const obj = new Hill(world.nextID(), world.cache);
    obj.setData(world.cache, hill);
    world.hills.push(obj);
  });
  map.runways.forEach((runway): void => {
    const obj = new Runway(world.nextID(), world.cache);
    obj.setData(world.cache, runway);
    world.runways.push(obj);
  });
  map.towers.forEach((tower): void => {
    const obj = new Tower(world.nextID(), world.cache);
    obj.setData(world.cache, tower);
    world.towers.push(obj);
  });
  map.waters.forEach((water): void => {
    const obj = new Water(world.nextID(), world.cache);
    obj.setData(world.cache, water);
    world.waters.push(obj);
  });
}
