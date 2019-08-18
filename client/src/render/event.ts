import * as PIXI from "pixi.js";

export interface UserEventData {
  data: PIXI.interaction.InteractionData;
  dragging: boolean;
}
