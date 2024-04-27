import * as PIXI from "pixi.js";

type EntityUpdateCallbacks<Source> = {
  [Property in keyof Source]-?: (value: Source[Property]) => void;
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
    propUpdateCallback(newProps[key]);
  }
}
