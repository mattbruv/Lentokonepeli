import { IntType, GameObjectSchema } from "./types";
import { GameObjectType } from "../object";

const planeSchema: GameObjectSchema = {
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
  booleans: ["flipped", "engineOn"],
  strings: []
};

const flagSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "team", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: []
};

const hillSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "terrain", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: []
};

const groundSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "width", intType: IntType.Uint16 },
    { name: "terrain", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: []
};

const playerSchema: GameObjectSchema = {
  numbers: [
    { name: "team", intType: IntType.Uint8 },
    { name: "controlType", intType: IntType.Uint8 },
    { name: "controlID", intType: IntType.Uint16 },
    { name: "status", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: ["name"]
};

const runwaySchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "direction", intType: IntType.Uint8 },
    { name: "team", intType: IntType.Uint8 },
    { name: "health", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: []
};

const towerSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "direction", intType: IntType.Uint8 },
    { name: "terrain", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: []
};

const trooperSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "health", intType: IntType.Uint8 },
    { name: "state", intType: IntType.Uint8 },
    { name: "direction", intType: IntType.Uint8 },
    { name: "team", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: []
};

const waterSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "width", intType: IntType.Uint16 },
    { name: "direction", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: []
};

export const schemaTypes = {
  [GameObjectType.Plane]: planeSchema,
  [GameObjectType.Ground]: groundSchema,
  [GameObjectType.Hill]: hillSchema,
  [GameObjectType.Flag]: flagSchema,
  [GameObjectType.Runway]: runwaySchema,
  [GameObjectType.ControlTower]: towerSchema,
  [GameObjectType.Trooper]: trooperSchema,
  [GameObjectType.Player]: playerSchema,
  [GameObjectType.Water]: waterSchema
};
