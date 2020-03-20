export type SendableType = number | string | boolean;

/**
 * Defines the networked properties of a game object.
 */
export interface GameObjectSchema {
  strings: string[];
  booleans: string[];
  numbers: NumberProperty[];
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
