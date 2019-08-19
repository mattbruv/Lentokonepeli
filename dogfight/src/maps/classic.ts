import { MapDefinition } from "./map";
import { Facing } from "../constants";

export const CLASSIC_MAP: MapDefinition = {
  waters: [
    {
      position: { x: 0, y: -17 },
      width: 30000,
      waveDirection: Facing.Right
    }
  ],
  grounds: [
    {
      position: { x: -200, y: 0 },
      width: 500
    },
    {
      position: { x: 750, y: 0 },
      width: 500
    }
  ]
};
