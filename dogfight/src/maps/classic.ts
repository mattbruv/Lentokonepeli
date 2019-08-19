import { MapDefinition } from "./map";
import { Facing } from "../constants";

export const CLASSIC_MAP: MapDefinition = {
  waters: [
    {
      position: { x: -10000, y: -17 },
      width: 20020,
      waveDirection: Facing.Right
    },
    {
      position: { x: 10000, y: -17 },
      width: 20020,
      waveDirection: Facing.Left
    }
  ],
  grounds: [
    {
      position: { x: 0, y: 0 },
      width: 4000
    }
  ],
  hills: [
    { position: { x: -1800, y: 0 } },
    { position: { x: -1300, y: 0 } },
    { position: { x: -800, y: 0 } },
    { position: { x: -300, y: 0 } },

    { position: { x: 1800, y: 0 } },
    { position: { x: 1300, y: 0 } },
    { position: { x: 800, y: 0 } },
    { position: { x: 300, y: 0 } }
  ]
};
