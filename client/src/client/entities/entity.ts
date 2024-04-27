import * as PIXI from "pixi.js";

export type NoUndefined<T> = T extends undefined ? never : T | null;

export type EntityUpdateCallbacks<Source> = {
  [Property in keyof Source]-?: (value: NoUndefined<Source[Property]>) => void;
};

export type Entity<Props> = {
  props: Props;
  updateCallbacks: () => EntityUpdateCallbacks<Props>;
  getContainer: () => PIXI.Container;
  destroy: () => void;
};

export function updateProps<Props>(entity: Entity<Props>, newProps: Props) {
  entity.props = {
    ...entity.props,
    ...newProps,
  };

  const callbacks = entity.updateCallbacks();

  for (const key in newProps) {
    const propUpdateCallback = callbacks[key];
    const value = newProps[key];
    propUpdateCallback(value as NoUndefined<typeof value>);
  }
}
