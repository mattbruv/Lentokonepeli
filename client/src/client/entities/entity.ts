import * as PIXI from "pixi.js";

export type EntityUpdateCallbacks<Source extends object> = {
  [Property in keyof Source]-?: (
    value: Exclude<Source[Property], undefined>
  ) => void;
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
  console.log("BEFORE :", JSON.stringify(entity.props));

  entity.props = {
    ...entity.props,
    ...props,
  };

  const callbacks = entity.updateCallbacks;

  console.log(props);
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      const propUpdateCallback = callbacks[key];
      const value = props[key];
      if (value !== undefined) {
        propUpdateCallback(
          value as Exclude<Props[Extract<keyof Props, string>], undefined>
        );
      }
    }
  }
  console.log("AFTER :", JSON.stringify(entity.props));
}
