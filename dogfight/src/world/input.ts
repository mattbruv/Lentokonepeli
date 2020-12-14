import { GameWorld } from "./world";
import { EntityType } from "../entity";
import { PlayerInfo } from "../entities/PlayerInfo";
import { Plane } from "../entities/Plane";
import { KeyChangeList, InputKey, GameKey } from "../input";
import { Man, TrooperState } from "../entities/Man";
import { destroyTrooper } from "./trooper";

export function planeInput(
  world: GameWorld,
  player: PlayerInfo,
  plane: Plane,
  changes: KeyChangeList
): void {
  for (const keyType in changes) {
    const key: InputKey = parseInt(keyType);
    const isPressed = changes[keyType];
    switch (key) {

      case InputKey.Up: {
        plane.setKeyPressed(GameKey.PLANE_FLIP, isPressed);
        //if (isPressed && !plane.isAbandoned) {
        //  plane.setFlipped(world.cache, !plane.flipped);
        //}
        break;
      }
      case InputKey.Down: {
        plane.setKeyPressed(GameKey.PLANE_MOTOR, isPressed);
        //if (isPressed && !plane.isAbandoned) {
        //  plane.setMotor(world.cache, !plane.motorOn);
        //}
        break;
      }
      case InputKey.Jump: {
        plane.setKeyPressed(GameKey.PLANE_JUMP, isPressed);
        //if (isPressed) {
        //  // destroyPlane(world, plane, true);
        //  const trooper = new Man(
        //    world.nextID(EntityType.Trooper),
        //    world,
        //    world.cache,
        //    plane.x,
        //    plane.y,
        //    player
        //  );
        //  trooper.setPos(world.cache, plane.x, plane.y);
        //  trooper.set(world.cache, "team", player.team);
        //  trooper.setVelocity(world.cache, 0, 0);
        //  world.addEntity(trooper);
        //  console.log(player.controlID);
        //  console.log(trooper.id);
        //  player.setControl(world.cache, EntityType.Trooper, trooper.id);
        //  plane.abandonPlane(world.cache);
        //  return;
        //}
        break;
      }
      case InputKey.Fire: {
        plane.setKeyPressed(GameKey.PLANE_SHOOT, isPressed);
        //if (!plane.isAbandoned) {
        //  plane.isShooting = isPressed;
        //}
        break;
      }
      case InputKey.Bomb: {
        plane.setKeyPressed(GameKey.PLANE_BOMB, isPressed);
        //if (!plane.isAbandoned) {
        //  plane.isBombing = isPressed;
        //}
        break;
      }
      case InputKey.Left: {
        plane.setKeyPressed(GameKey.PLANE_UP, isPressed);
        break;
      }
      case InputKey.Right: {
        plane.setKeyPressed(GameKey.PLANE_DOWN, isPressed);
        break;
      }
      case InputKey.Left:
      case InputKey.Right: {
        break;
      }
      //case InputKey.Left: 
      //case InputKey.Right: {
      //  break;
      //}
    }
  }
  /*
  if (plane.isAbandoned) {
    return;
  }
  if (player.inputState[InputKey.Left] && !player.inputState[InputKey.Right])
    plane.setRotation(InputKey.Left, true);
  if (!player.inputState[InputKey.Left] && player.inputState[InputKey.Right])
    plane.setRotation(InputKey.Right, true);
  if (player.inputState[InputKey.Left] == player.inputState[InputKey.Right])
    plane.setRotation(InputKey.Right, false);
    */
}

export function trooperInput(
  world: GameWorld,
  player: PlayerInfo,
  trooper: Man,
  changes: KeyChangeList
): void {
  for (const keyType in changes) {
    const key: InputKey = parseInt(keyType);
    const isPressed = changes[keyType];
    switch (key) {
      case InputKey.Jump: {
        trooper.setKeyPressed(GameKey.MAN_PARACHUTE, isPressed);
        //if (isPressed) {
        //  if (trooper.state == TrooperState.Falling) {
        //    trooper.setState(world.cache, TrooperState.Parachuting);
        //  }
        //  break;
        //}
        break;
      }
      case InputKey.Bomb: {
        trooper.setKeyPressed(GameKey.MAN_SUICIDE, isPressed);
        //if (isPressed) {
        //  if (
        //    trooper.state == TrooperState.Standing ||
        //    trooper.state == TrooperState.Walking
        //  ) {
        //    destroyTrooper(world, trooper, true);
        //  }
        //}
        break;
      }
      case InputKey.Fire: {
        trooper.setKeyPressed(GameKey.MAN_SHOOT, isPressed);
        //if (trooper.state != TrooperState.Falling) {
        //  trooper.isShooting = isPressed;
        //}
        break;
      }
      case InputKey.Left: {
        trooper.setKeyPressed(GameKey.MAN_LEFT, isPressed);
        break;
      }
      case InputKey.Right: {
        trooper.setKeyPressed(GameKey.MAN_RIGHT, isPressed);
        break;
      }
      //case InputKey.Left:
      //case InputKey.Right: {
      //  break;
      //}
    }
    /*
    if (player.inputState[InputKey.Left] && !player.inputState[InputKey.Right])
      trooper.setDirection(world.cache, InputKey.Left, true);
    if (!player.inputState[InputKey.Left] && player.inputState[InputKey.Right])
      trooper.setDirection(world.cache, InputKey.Right, true);
    if (player.inputState[InputKey.Left] == player.inputState[InputKey.Right])
      trooper.setDirection(world.cache, InputKey.Right, false);
      */
  }
}

export function processInputs(world: GameWorld): void {
  // process input...
  for (const playerID in world.inputQueue) {
    const id = parseInt(playerID);
    const player = world.getObject(EntityType.Player, id) as PlayerInfo;
    if (player === undefined) {
      return;
    }
    const cID = player.controlID;
    const cType = player.controlType;
    const controlling = world.getObject(cType, cID);
    if (controlling !== undefined) {
      switch (cType) {
        case EntityType.Plane: {
          planeInput(world, player, controlling as Plane, world.inputQueue[id]);
          break;
        }
        case EntityType.Trooper: {
          trooperInput(
            world,
            player,
            controlling as Man,
            world.inputQueue[id]
          );
          break;
        }
      }
    }
  }
  // reset queue
  world.inputQueue = {};
}
