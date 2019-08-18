import { MapDefinition } from "./map";
import { Facing } from "../constants";

export const CLASSIC_MAP: MapDefinition = {
  waters: [
    {
      position: { x: 0, y: 0 },
      width: 10000,
      waveDirection: Facing.Right
    }
  ],
  grounds: [
    {
      position: { x: 0, y: 0 },
      width: 500
    },
    {
      position: { x: 1000, y: 0 },
      width: 500
    }
  ]
};
