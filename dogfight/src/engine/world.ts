import { Player } from "../entities/player";
import { Ground } from "../entities/ground";

export interface GameWorld {
  players: Player[];
  grounds: Ground[];
}

export function newGameWorld(): GameWorld {
  return {
    players: [],
    grounds: []
  };
}
