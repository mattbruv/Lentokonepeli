import * as PIXI from "pixi.js";
import { EntityType } from "../../../dogfight/src/entity";
import { Properties } from "../../../dogfight/src/state";

/**
 * The basic properties that
 * every single game sprite has.
 */
export interface GameSprite {
  entityId: number;
  entityType: EntityType;
  container: PIXI.Container;
  debugContainer: PIXI.Container;

  /**
   * Updates the sprite on the game screen.
   */
  update: (props: Properties) => void;
}
