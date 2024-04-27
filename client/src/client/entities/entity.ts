import * as PIXI from "pixi.js";

export interface Entity<Props> {
  getContainer: () => PIXI.Container;
  updateProps: (props: Props) => void;
  getProps: () => Readonly<Props>;
  destroy: () => void;
}
