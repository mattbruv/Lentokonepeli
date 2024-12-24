import * as PIXI from "pixi.js";

type NoUndefined<T> = T extends undefined ? never : T;

export type EntityUpdateCallbacks<Source> = {
  [Property in keyof Source]-?: () => void;
};

export type Point = {
  x: number;
  y: number;
};

export interface Followable {
  getCenter: () => Point;
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

export function updateProps<Props extends Object>(
  entity: Entity<Props>,
  newProps: Props
) {
  entity.props = {
    ...entity.props,
    ...newProps,
  };

  for (const [key, callback] of Object.entries(entity.updateCallbacks)) {
    if (newProps.hasOwnProperty(key)) {
      callback();
    }
  }
}
