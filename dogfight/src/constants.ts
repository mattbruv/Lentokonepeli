export const U16_MAX = 0xffff;

export const ROTATION_DIRECTIONS = 256;

export enum ByteSize {
  ONE_BYTE = 0xff, // 255
  TWO_BYTES = 0xffff // 65,535
}

export type Property = number | string;

export enum PropertyType {
  Number,
  String
}

export enum Team {
  Spectator,
  Centrals,
  Allies
}

export enum Terrain {
  Normal,
  Desert
}
