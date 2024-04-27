import * as PIXI from "pixi.js";

export type EntityUpdateCallbacks<Source extends object> = {
  [Property in keyof Source]-?: [order: number, callback: () => void];
};

export type Entity<Props extends object> = {
  props: Props;
  callbackOrder: (keyof Props)[];
  updateCallbacks: EntityUpdateCallbacks<Props>;
  getContainer: () => PIXI.Container;
  destroy: () => void;
};

export function updateProps<Props extends Object>(
  entity: Entity<Props>,
  props: Props
) {
  entity.props = {
    ...entity.props,
    ...props,
  };

  const callbacks = Object.entries(entity.updateCallbacks)
    .map((entry) => ({
      key: entry[0],
      order: entry[1][0],
      callback: entry[1][1],
    }))
    .sort((a, b) => a.order - b.order);

  for (const entry of callbacks) {
    if (props.hasOwnProperty(entry.key)) {
      entry.callback();
    }
  }
}
