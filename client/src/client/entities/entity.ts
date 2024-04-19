import * as PIXI from "pixi.js";

export interface Entity<Props> {
  getContainer: () => PIXI.Container;
  updateProperties: (props: Props) => void;
  destroy: () => void;
}
