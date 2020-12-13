import { GameWorld } from "./world";
import { PlaneType, Plane, teamPlanes } from "../entities/Plane";
import { PlayerInfo, PlayerStatus } from "../entities/PlayerInfo";
import { EntityType } from "../entity";
import { Runway } from "../entities/Runway";
import { FacingDirection, ROTATION_DIRECTIONS } from "../constants";

export interface TakeoffEntry {
  playerID: number;
  request: TakeoffRequest;
}

export interface TakeoffRequest {
  plane: PlaneType;
  runway: number;
}

export function requestTakeoff(
  world: GameWorld,
  player: PlayerInfo,
  takeoffRequest: TakeoffRequest
): void {
  const team = player.team;
  const { plane, runway } = takeoffRequest;
  if (!teamPlanes[team].includes(plane)) {
    return;
  }
  const runwayID = world.getObjectIndex(EntityType.Runway, runway);
  // if runway exists, add request to queue to be processed.
  if (runwayID >= 0) {
    world.takeoffQueue.push({
      playerID: player.id,
      request: takeoffRequest
    });
  }
}

export function doTakeoff(world: GameWorld, takeoff: TakeoffEntry): void {
  // test if player exists
  const player = world.getObject(
    EntityType.Player,
    takeoff.playerID
  ) as PlayerInfo;
  if (player === undefined) {
    return;
  }
  // make sure he's not controlling anything
  if (player.controlType !== EntityType.None) {
    return;
  }
  const runway = world.getObject(
    EntityType.Runway,
    takeoff.request.runway
  ) as Runway;
  if (runway === undefined) {
    return;
  }
  // make sure runway isn't dead
  if (runway.health <= 0) {
    return;
  }

  if (runway.reserveFor(1)) {
    console.log("reservation done");
    // create plane
    const plane = new Plane(
      world.nextID(EntityType.Plane),
      world,
      world.cache,
      takeoff.request.plane,
      player,
      player.team,
      runway
    );
    let offsetX = 100;
    //let simpleDirection = -1;
    if (runway.direction == FacingDirection.Right) {
      offsetX *= -1;
      //simpleDirection = 1;
    }
    //plane.setPos(world.cache, runway.x + offsetX, 300);
    //plane.setMotor(world.cache, true);
    //plane.setVelocity(world.cache, 0, 0);
    /*
    plane.setVelocity(world.cache, plane.minSpeed * simpleDirection * 1.1, 0);
    */
    plane.init();
    plane.setFlipped(world.cache, runway.direction == FacingDirection.Left);
    const direction =
      runway.direction == FacingDirection.Left
        ? Math.round(ROTATION_DIRECTIONS / 2)
        : 0;
    plane.setDirection(world.cache, direction);
    world.planes.push(plane);
    // assign plane to player
    player.setControl(world.cache, plane.type, plane.id);
    player.setStatus(world.cache, PlayerStatus.Playing);
  }
}

export function processTakeoffs(world: GameWorld): void {
  for (const takeoff of world.takeoffQueue) {
    doTakeoff(world, takeoff);
  }
  world.takeoffQueue = [];
}
