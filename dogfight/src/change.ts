import { EntityType } from "./entity";
/**
 * Change Interfaces:
 *
 * A change interface is created and returned
 * from all different types of objects..
 *
 * They basically encapsulate all properties that have
 * changed in an object.
 *
 * Example of how changes propogate from server to client:
 * [Engine.Tick] -> List[Changes] -> Network.Pack(Changes)
 * -> Send Via Websockets -> ClientNetwork.Unpack(Changes)
 * -> ClientEngine.Apply(Changes) AND
 *    ClientRenderer.Apply(Changes)
 *
 * How a client engine could predict game movement
 * [ClientEngine.MovementTick] -> List[Changes]
 * -> ClientRenderer.Apply(Changes)
 *
 */
export enum ChangeType {
  World,
  Player,
  Entity
}

export interface Change {
  changeType: ChangeType;
}

export interface EntityChange extends Change {
  entityType: EntityType;
}
