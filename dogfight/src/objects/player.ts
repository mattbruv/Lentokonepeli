import { GameObject, GameObjectData, GameObjectType } from "../object";

export interface PlayerProperties {
  name: string;
  controlType: GameObjectType;
  controlID: number;
}

export class PlayerObject extends GameObject<PlayerProperties>
  implements PlayerProperties {
  public name: string;
  public controlType: GameObjectType;
  public controlID: number;

  public constructor(id: number) {
    super(id, GameObjectType.Player);
    this.name = "Player_" + this.id;
    this.controlType = GameObjectType.Player;
    this.controlID = -1;
  }

  public getState(): GameObjectData {
    return {
      name: this.name,
      controlType: this.controlType,
      controlID: this.controlID
    };
  }
}
