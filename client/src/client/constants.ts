import { Terrain } from "dogfight-types/Terrain";

export const VIEW_WIDTH = 740;
export const VIEW_HEIGHT = 660;
// 510 hardcoded bg, plus 150 UI height, 660 total height?

export const enum DrawLayer {
  LAYER_17,
  LAYER_16,
  LAYER_15,
  LAYER_14,
  LAYER_13,
  LAYER_12,
  LAYER_11,
  LAYER_10,
  LAYER_09,
  LAYER_08,
  LAYER_07,
  LAYER_11_LAYER_13,
  LAYER_10_LAYER_12,
}

export const enum WaterColor {
  NORMAL = 3051728,
  DESERT = 2344139,
}

export const TERRAIN_WATER_COLOR: Record<Terrain, WaterColor> = {
  Normal: WaterColor.NORMAL,
  Desert: WaterColor.DESERT,
};

export const SKY_COLOR = 14540287;
