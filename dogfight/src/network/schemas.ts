import { IntType, GameObjectSchema } from "./types";

export const SchemaTrooper: GameObjectSchema = {
  strings: [],
  booleans: ["foo", "bar"],
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "health", intType: IntType.Uint8 },
    { name: "state", intType: IntType.Uint8 },
    { name: "direction", intType: IntType.Uint8 },
    { name: "team", intType: IntType.Uint8 }
  ]
};
