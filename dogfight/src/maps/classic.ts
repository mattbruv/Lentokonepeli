import { GameMap } from "../world/map";
import { Terrain, Team, FacingDirection } from "../constants";

export const MAP_CLASSIC: GameMap = {
  grounds: [
    {
      x: 0,
      y: 0,
      width: 4500, // measured from original map
      terrain: Terrain.Normal
    }
  ],
  flags: [
    {
      x: -2100,
      y: 0,
      team: Team.Centrals
    },
    {
      x: 2100,
      y: 0,
      team: Team.Allies
    }
  ],
  runways: [
    {
      x: -2096,
      y: 0,
      direction: FacingDirection.Right,
      team: Team.Centrals
    },
    {
      x: -1596,
      y: 0,
      direction: FacingDirection.Right,
      team: Team.Centrals
    },
    {
      x: 1596,
      y: 0,
      direction: FacingDirection.Left,
      team: Team.Allies
    },
    {
      x: 2096,
      y: 0,
      direction: FacingDirection.Left,
      team: Team.Allies
    }
  ],
  waters: [
    {
      width: 60000,
      x: -30000,
      y: -25,
      direction: FacingDirection.Right
    },
    {
      width: 60000,
      x: 30000,
      y: -25,
      direction: FacingDirection.Left
    }
  ],
  towers: [
    {
      x: -1600,
      y: 0,
      direction: FacingDirection.Right,
      terrain: Terrain.Normal
    },
    {
      x: 1600,
      y: 0,
      direction: FacingDirection.Left,
      terrain: Terrain.Normal
    }
  ],
  hills: [
    {
      x: -2100,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: -1600,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: -1100,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: -600,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: -100,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 400,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 900,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 1400,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 1900,
      y: 0,
      terrain: Terrain.Normal
    }
  ]
};
