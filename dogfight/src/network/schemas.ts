import { IntType, GameObjectSchema } from "./types";
import { EntityType } from "../entity";

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
  booleans: ["flipped", "motorOn"],
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
    { name: "ping", intType: IntType.Uint16 },
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
    { name: "ammo", intType: IntType.Uint8 },
    { name: "bombs", intType: IntType.Uint8 },
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

const explosionSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 }
  ],
  booleans: [],
  strings: []
};

const bulletSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "clientVX", intType: IntType.Int16 },
    { name: "clientVY", intType: IntType.Int16 },
    { name: "age", intType: IntType.Uint16 }
  ],
  booleans: [],
  strings: []
};

const bombSchema: GameObjectSchema = {
  numbers: [
    { name: "x", intType: IntType.Int16 },
    { name: "y", intType: IntType.Int16 },
    { name: "age", intType: IntType.Uint16 },
    { name: "direction", intType: IntType.Uint8 }
  ],
  booleans: [],
  strings: []
};

export const schemaTypes = {
  [EntityType.Plane]: planeSchema,
  [EntityType.Ground]: groundSchema,
  [EntityType.Hill]: hillSchema,
  [EntityType.Flag]: flagSchema,
  [EntityType.Runway]: runwaySchema,
  [EntityType.ControlTower]: towerSchema,
  [EntityType.Trooper]: trooperSchema,
  [EntityType.Player]: playerSchema,
  [EntityType.Water]: waterSchema,
  [EntityType.Explosion]: explosionSchema,
  [EntityType.Bullet]: bulletSchema,
  [EntityType.Bomb]: bombSchema
};
