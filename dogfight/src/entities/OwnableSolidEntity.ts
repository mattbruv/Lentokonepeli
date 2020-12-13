import { Ownable } from "../ownable";
import { SolidEntity } from "./SolidEntity";
import { PlayerInfo } from "./PlayerInfo";

export abstract class OwnableSolidEntity extends SolidEntity implements Ownable {
  abstract getPlayerInfo(): PlayerInfo;
  abstract getRootOwner(): OwnableSolidEntity;
}