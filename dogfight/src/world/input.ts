import { GameWorld } from "./world";
import { GameObjectType } from "../object";
import { Player } from "../objects/player";
import { Plane } from "../objects/plane";
import { KeyChangeList, InputKey } from "../input";
import { destroyPlane } from "./plane";

export function planeInput(
  world: GameWorld,
  player: Player,
  plane: Plane,
  changes: KeyChangeList
): void {
  for (const keyType in changes) {
    const key: InputKey = parseInt(keyType);
    const isPressed = changes[keyType];
    switch (key) {
      case InputKey.Left:
      case InputKey.Right: {
        break;
      }
      case InputKey.Up: {
        if (isPressed) {
          plane.setFlipped(world.cache, !plane.flipped);
        }
        break;
      }
      case InputKey.Down: {
        if (isPressed) {
          plane.setEngine(world.cache, !plane.engineOn);
        }
        break;
      }
      case InputKey.Jump: {
        if (isPressed) {
          destroyPlane(world, plane, true);
        }
        break;
      }
    }
  }
  if (player.inputState[InputKey.Left] && !player.inputState[InputKey.Right])
    plane.setRotation(world.cache, InputKey.Left, true);
  if (!player.inputState[InputKey.Left] && player.inputState[InputKey.Right])
    plane.setRotation(world.cache, InputKey.Right, true);
  if (player.inputState[InputKey.Left] == player.inputState[InputKey.Right])
    plane.setRotation(world.cache, InputKey.Right, false);
}

export function processInputs(world: GameWorld): void {
  // process input...
  for (const playerID in world.inputQueue) {
    const id = parseInt(playerID);
    const player = world.getObject(GameObjectType.Player, id) as Player;
    if (player === undefined) {
      return;
    }
    const cID = player.controlID;
    const cType = player.controlType;
    const controlling = world.getObject(cType, cID);
    if (controlling !== undefined) {
      switch (cType) {
        case GameObjectType.Plane: {
          planeInput(world, player, controlling as Plane, world.inputQueue[id]);
          break;
        }
      }
    }
  }
  // reset queue
  world.inputQueue = {};
}
