import { PlaneType } from "./objects/plane";

export interface TakeoffEntry {
  playerID: number;
  request: TakeoffRequest;
}

export interface TakeoffRequest {
  plane: PlaneType;
  runway: number;
}
