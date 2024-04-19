import * as PIXI from "pixi.js";

interface Entity<Props> {
  getContainer: () => PIXI.Container;
  updateProperties: (props: Props) => void;
  destroy: () => void;
}
