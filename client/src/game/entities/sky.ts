import * as PIXI from "pixi.js";
import { getTexture } from "../resources";

export class Sky {

    sprite = new PIXI.Sprite(getTexture("sky3b.jpg"));

}