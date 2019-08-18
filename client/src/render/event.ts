import * as PIXI from "pixi.js";
import { Vec2d } from "../../../dogfight/src/physics/vector";

export interface MouseClickEvent {
  clickPos: Vec2d;
  dragging: boolean;
}
