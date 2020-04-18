export type SendableType = number | string | boolean;

/**
 * All networked information is sent through packets.
 * Some packets may be compressed to binary, but most are not.
 *
 * Large or high bandwidth packets will be compressed.
 * Infrequent packets will be sent as JSON strings.
 * It all depends on packet type.
 */
export interface Packet {
  type: PacketType;
  data?: any;
}

/**
 * Container Object which holds all information
 * that is to be sent out over the wire.
 */
export enum PacketType {
  /* User --> Server */
  RequestFullSync,
  RequestJoinTeam,
  RequestTakeoff,
  UserGameInput,
  ChangeName,

  /* User <--> Server */
  Ping,

  /* Server --> User */
  FullSync,
  ChangeSync,
  AssignPlayer
}

/**
 * Defines the networked properties of a game object.
 */
export interface GameObjectSchema {
  numbers: NumberProperty[];
  booleans: string[];
  strings: string[];
}

/**
 * Types of numbers that can be networked.
 */
export enum IntType {
  Int8,
  Uint8,
  Int16,
  Uint16
}

/**
 * Byte Sizes of each IntType
 */
export const IntByteSizes = {
  [IntType.Int8]: 1,
  [IntType.Uint8]: 1,
  [IntType.Int16]: 2,
  [IntType.Uint16]: 2
};

/**
 * Defines the shape of a number property to be networked.
 */
export interface NumberProperty {
  name: string;
  intType: IntType;
}
