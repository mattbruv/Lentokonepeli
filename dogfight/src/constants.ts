export const ROTATION_DIRECTIONS = 256;

export enum BuildType {
  Client = "client",
  Server = "server"
}

export enum Team {
  Centrals,
  Allies,
  Spectator
}

export enum Terrain {
  Normal,
  Desert
}

export enum FacingDirection {
  Left,
  Right
}

/**
 * I basically have re-discovered why the bullet engine
 * uses a scale factor duing it's calculations.
 *
 * You need to scale movement calculations up by 100x because
 * all of the coordiates are eventually rounded.
 *
 * Suppose we run the simulation at both 10 ticks per second, and 20.
 * Also suppose we have an entity that moves +X at 25 pixels (units) per second.
 *
 * 10 TPS = 1000 / 10 = ~100ms delta time
 * 20 TPS = 1000 / 20 = ~50ms delta time
 *
 * multiplier = delta / 1000
 * 10TPS = 0.1
 * 20TPS = 0.05
 *
 * When 25 movespeed:
 * 10TPS offset = 0.1 * 25 = 2.5 = 3 (rounded)
 * 20TPS offset = 0.05 * 25 = 1.25 = 1 (rounded)
 *
 * As you can see, smaller floats are less precisely rounded.
 * multiplying by 100 (or some other large factor) fixes this problem during calculations
 *
 * As such, all calculations in game space must be done at 1:100 (or other large factor)
 * and each change must be converted to 1:1 pixel coordinates when sent to the client
 * since the renderer renders at 1:1.
 *
 * this appears to be what they did in the original game:
 * https://github.com/mattbruv/playray-dogfight-client/blob/master/com/aapeli/multiplayer/impl/dogfight/common/BulletEngine.java#L9
 */
export const SCALE_FACTOR = 100;
