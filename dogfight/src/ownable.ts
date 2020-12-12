import { PlayerInfo } from "./entities/PlayerInfo";

export interface Ownable {
  getPlayerInfo(): PlayerInfo;
  getRootOwner(): Ownable;
  getType(): number;
}

export function isOwnable(obj) {
  return obj.getPlayerInfo === "function" && obj.getRootOwner === "function" && obj.getType === "function"
}