import { GameMap } from "../world/map";
import { Terrain, Team, FacingDirection } from "../constants";

export const MAP_CLASSIC_2: GameMap = {
  grounds: [
    {
      x: 0,
      y: 0,
      width: 5700, // measured from original map
      terrain: Terrain.Normal
    }
  ],
  flags: [
    {
      x: -2200,
      y: 0,
      team: Team.Centrals
    },
    {
      x: 2200,
      y: 0,
      team: Team.Allies
    }
  ],
  runways: [
    {
      x: -2696,
      y: 0,
      direction: FacingDirection.Right,
      team: Team.Centrals
    },
    {
      x: -2196,
      y: 0,
      direction: FacingDirection.Right,
      team: Team.Centrals
    },
    {
      x: -1696,
      y: 0,
      direction: FacingDirection.Right,
      team: Team.Centrals
    },
    {
      x: 1696,
      y: 0,
      direction: FacingDirection.Left,
      team: Team.Allies
    },
    {
      x: 2196,
      y: 0,
      direction: FacingDirection.Left,
      team: Team.Allies
    },
    {
      x: 2696,
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
      x: -1700,
      y: 0,
      direction: FacingDirection.Right,
      terrain: Terrain.Normal
    },
    {
      x: 1700,
      y: 0,
      direction: FacingDirection.Left,
      terrain: Terrain.Normal
    }
  ],
  hills: [
    {
      x: -2700,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: -2160,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: -1620,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: -1080,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: -540,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 0,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 540,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 1080,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 1620,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 2160,
      y: 0,
      terrain: Terrain.Normal
    },
    {
      x: 2700,
      y: 0,
      terrain: Terrain.Normal
    }
  ]
};
