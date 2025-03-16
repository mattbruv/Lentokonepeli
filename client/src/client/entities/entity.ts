import * as PIXI from "pixi.js";
import { Stats } from "../hud";
import { RadarObject } from "../radar";


export type EntityUpdateCallbacks<Source> = {
  [Property in keyof Source]-?: (oldProps: Source) => void;
};

export type Point = {
  x: number;
  y: number;
};

export interface Followable {
  getCenter: () => Point;
  getStats: () => Stats;
}

export interface RadarEnabled {
  getRadarInfo: () => RadarObject
}

export function isFollowable(object: {}): object is Followable {
  return "getCenter" in object;
}

export type Entity<Props> = {
  props: Required<Props>;
  updateCallbacks: EntityUpdateCallbacks<Props>;
  getContainer: () => PIXI.Container;
  destroy: () => void;
};

export function updateProps<Props extends object>(
  entity: Entity<Props>,
  newProps: Props
) {

  const oldProps = { ...entity.props }
  entity.props = {
    ...entity.props,
    ...newProps,
  };

  for (const [key, callback] of Object.entries(entity.updateCallbacks)) {
    if (newProps.hasOwnProperty(key)) {
      callback(oldProps);
    }
  }
}
