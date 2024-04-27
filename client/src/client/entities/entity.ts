import * as PIXI from "pixi.js";

export type EntityUpdateCallbacks<Source extends object> = {
  [Property in keyof Source]-?: () => void;
};

export type Entity<Props extends object> = {
  props: Props;
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

  for (const entry of Object.entries(entity.updateCallbacks)) {
    console.log(entry[0]);
    if (props.hasOwnProperty(entry[0])) {
      entry[1];
    }
  }
  console.log("NEXT");
}
