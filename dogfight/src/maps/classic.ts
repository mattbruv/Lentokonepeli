import { GameMap } from "../map";
import { Terrain, WaveDirection, Team, RunwayDirection } from "../constants";

export const MAP_CLASSIC: GameMap = {
  grounds: [
    {
      center: { x: 0, y: 0 },
      width: 4500, // measured from original map
      terrain: Terrain.Normal
    }
  ],
  runways: [
    {
      center: { x: -180, y: 0 },
      direction: RunwayDirection.Right,
      team: Team.Centrals
    },
    {
      center: { x: 180, y: 0 },
      direction: RunwayDirection.Left,
      team: Team.Allies
    }
  ],
  waters: [
    {
      width: 60000,
      center: { x: -30000, y: -25 },
      direction: WaveDirection.Right
    },
    {
      width: 60000,
      center: { x: 30000, y: -25 },
      direction: WaveDirection.Left
    }
  ]
};
