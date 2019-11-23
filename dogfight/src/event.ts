import { EntityType } from "./entity";
/**
 * Event Interfaces:
 *
 * An event interface is created and returned
 * from all different types of objects..
 *
 * They basically encapsulate all properties that have
 * changed in an object.
 *
 * Example of how changes propogate from server to client:
 * [Engine.Tick] -> List[Events] -> Network.Pack(Changes)
 * -> Send Via Websockets -> ClientNetwork.Unpack(Changes)
 * -> ClientEngine.Apply(Events) AND
 *    ClientRenderer.Apply(Events)
 *
 * How a client engine could predict game movement
 * [ClientEngine.MovementTick] -> List[Events]
 * -> ClientRenderer.Apply(Events)
 *
 */
export enum GameEventType {
  None,
  EntityAdd,
  EntityUpdate,
  EntityDelete,
  PlayerInput
  // and so on
}

export interface GameEvent {
  eventType: GameEventType;
}

export interface EntityEvent extends GameEvent {
  entityType: EntityType;
  entityId: number;
}
