import { IntType, GameObjectSchema } from "./types";

export const SchemaPlane: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "planeType", intType: IntType.Uint8 },
    { name: "team", intType: IntType.Uint8 },
    { name: "direction", intType: IntType.Uint8 },
    { name: "health", intType: IntType.Uint8 },
    { name: "fuel", intType: IntType.Uint8 },
    { name: "ammo", intType: IntType.Uint8 },
    { name: "bombs", intType: IntType.Uint8 }
  ],
  booleans: ["flipped"],
  strings: []
};
