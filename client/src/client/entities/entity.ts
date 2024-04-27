import * as PIXI from "pixi.js";
import { BackgroundItem } from "./backgroundItem";
import { BackgroundItemProperties } from "dogfight-types/BackgroundItemProperties";
import { Bunker } from "./bunker";
import { BunkerProperties } from "dogfight-types/BunkerProperties";
import { Team } from "dogfight-types/Team";

type EntityPropFunctions<Source> = {
  [Property in keyof Source as `update_${string & Property}`]-?: (
    value: Source[Property]
  ) => void;
};

type EntityBase<Props> = {
  getContainer: () => PIXI.Container;
  updateProps: (props: Props) => void;
  getProps: () => Readonly<Props>;
  destroy: () => void;
};

export type Entity<Props> = EntityBase<Props> & EntityPropFunctions<Props>;

abstract class Foo<T> extends EntityBase<T> {
  getContainer: () => PIXI.Container<PIXI.DisplayObject>;
  updateProps: (props: T) => void;
  getProps: () => Readonly<T>;
  destroy: () => void;
  //
}
