import * as PIXI from "pixi.js";

export type NoUndefined<T> = T extends undefined ? never : T;

export type EntityUpdateCallbacks<Source> = {
  [Property in keyof Source]-?: (value: NoUndefined<Source[Property]>) => void;
};

export type Entity<Props> = {
  props: Props;
  updateCallbacks: () => EntityUpdateCallbacks<Props>;
  getContainer: () => PIXI.Container;
  destroy: () => void;
};

export function updateProps<Props>(entity: Entity<Props>, props: Props) {
  console.log("BEFORE :", JSON.stringify(entity.props));

  entity.props = {
    ...entity.props,
    ...props,
  };

  const callbacks = entity.updateCallbacks();

  console.log(props);
  for (const key in props) {
    if (props.hasOwnProperty(key)) console.log(key);
    const propUpdateCallback = callbacks[key];
    const value = props[key];
    propUpdateCallback(value as NoUndefined<typeof value>);
  }
  console.log("AFTER :", JSON.stringify(entity.props));
}
