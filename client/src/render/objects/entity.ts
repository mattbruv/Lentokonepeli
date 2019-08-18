import * as PIXI from "pixi.js";
import { EntityType } from "../../../../dogfight/src/constants";
import { Entity } from "../../../../dogfight/src/entities/entity";

export interface EntitySprite {
  /** The ID of the object that references an entity ID in the game. */
  id: number;

  /** The type of game entity that this object represents */
  type: EntityType;

  update(data: Entity): void;

  /**
   * Called upon object deletion
   * used to properly stop animation callbacks, etc.
   */
  onDestroy(): void;

  /**
   * A list of renderable PIXI display objects that belong to this object.
   *
   * Note: The reason we use an array of display objects
   * instead of something simple like a single container
   * is because sometimes a game object is made up of many sprites.
   *
   * For example, a hangar has a front and a back graphic.
   * Planes are supposed to be hidden "behind" the hangar
   * when they pull into the hangar garage.
   *
   * If the entire hangar sprite is a flattened container in the world,
   * the plane will either render totally in front of/behind it.
   *
   * If the front/back of the hangar are individual sprites, they
   * can be rendered on their own layers surrounding the plane layer.
   */
  renderables: PIXI.DisplayObject[];
}
