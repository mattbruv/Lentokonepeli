import { Team } from "../constants";

export interface Player {
  playerID: number;
  name: string;
  team: Team;
  kills: number;
  deaths: number;
  controlID: number;
}
