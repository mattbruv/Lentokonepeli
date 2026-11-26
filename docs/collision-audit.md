# Collision audit against the original server

This compares the Rust engine (`dogfight/src`) with the decompiled original Java server (`dogfight-source/com/aapeli/multiplayer/impl/dogfight/server`).

It covers two parts:
- **Geometry:** the box and pixel mask each entity collides with.
- **Behaviour:** what happens when two entities collide.

## How the original detects collisions

`SolidEntity.checkCollision()` is the core check:
1. It intersects the two entities' collision rectangles.
2. Within that intersection, it reports a hit if any pixel is opaque in both collision images (alpha ≠ 0).
3. If an entity has no image, every pixel inside its rectangle counts as opaque.

Each moving entity (plane, man, bullet, bomb, and an explosion once) calls `checkCollision()` during its own tick, right after it moves. It checks against every alive `SolidEntity`, with no early exit, and calls `hit()` on both sides. Hills and background items are not solid.

## Geometry

| Entity | Original | Rust | Status |
|---|---|---|---|
| Ground | rect `x, y+7, w, h-7`, no image | same | Faithful |
| Water | rect `x, y+5, w, 100`, no image | same | Faithful |
| Coast | beach image, mirrored for right-facing | mirrored desert image was wrong | **Fixed** |
| Runway | `runway.gif` / `runway2.gif` by direction, only while health > 0 | same | Faithful |
| Headquarters | team image, only while health > 0 | same | Faithful |
| Explosion | `explosion0004.gif` centred on the blast, only on its single check | same | Faithful |
| Bullet | 2×2 rect, no image | same | Faithful |
| Bomb | rotated in its diagonal square canvas | rotation sampled differently | **Fixed** |
| Plane | rotated and flipped by `direction` in its diagonal square canvas | rotation sampled differently; raw angle | **Fixed** |
| Man | always `parachuter0`, even while parachuting | used `parachuter1` while parachuting | **Fixed** |

### Rotation (plane and bomb)

The original stores plane and bomb images centred in a ⌈√(w²+h²)⌉ square (`createCenteredInMaxRotateArea`), which matches our `get_rotateable_image`. It then rotates them with Java2D `AffineTransformOp`:
- the pivot is `(w/2, h/2)` using integer division;
- the plane is rotated by its quantized `direction` (256 steps per turn);
- the image is flipped vertically first when the plane is flipped.

For `BufferedImage`s the transform runs through medialib. Medialib samples each destination pixel centre in **16.16 fixed point**, starting each row at its first in-bounds pixel and stepping per pixel.

Our previous `imageproc::rotate_about_center` used:
- a pivot half a pixel further down and to the right;
- rounding instead of floor;
- the raw physics angle.

Against the original it differed in **3,542 of 3,584** plane and bomb masks (6 planes plus the bomb × 256 directions × flipped/unflipped), by about 114 pixels per mask. It was off by up to 2 px at 90°.

`images::rotate_image` now copies the original algorithm. I generated reference masks by running the original Java code on this machine, and the Rust output matches all **3,584** exactly.

This was the real cause of the katala runway crash. The flipped tail sat about a pixel lower than in the original. The earlier fix, which clipped the plane mask to its unrotated 38×20 box, was wrong: the original does not clip. It has been removed.

### Coast

For a right-facing desert coast, the original mirrors the desert beach using the *normal* beach's width (110 instead of 114). The result is a 110-wide image whose shape sits 4 px further left than a straight mirror (`Coast.java:65-69`). Right-facing coasts now reproduce that; I checked the result against the original's output. Left-facing coasts and the normal beach were already correct.

### Man

`Man.getCollisionImage()` always returns `image[0]` (`parachuter0`). The parachute canopy never collides.

## Behaviour differences (not yet fixed)

The reference points to code in the original. Paths are relative to `server/entities/` and `dogfight/src/`.

### Planes

1. **A falling plane can land on, or damage, a runway.** The original handles mode 4 (falling) before any runway logic and just explodes (`Plane.java:542-559`). Rust runs the landing check and `planeCrash` for any mode (`tick_collision.rs` runway loop). A falling plane can snap onto its own runway and land, and it takes 17 health off any runway it hits.
2. **Your own explosion destroys your own falling plane.** In mode 4 the original ignores entities owned by the same player (`Plane.java:544`). Rust has no owner check (`tick_collision.rs` explosions vs planes), so it also logs an extra suicide.
3. **Bullets pass through falling planes.** In the original, the bullet hits the falling plane and is removed without doing damage (`Bullet.java:104-130`). Rust skips falling planes entirely, so the bullet carries on and hits whatever is behind.
4. **A bomb hitting a falling plane gives an extra plane kill.** The original only records a man kill (`Plane.java:553`). Rust always records a plane kill and a man kill (`tick_collision.rs` bombs vs planes).
5. **Landing reservation.** The original reads `(dir==1 && angle==π) || (dir==0 && angle==0 && reserveFor(2))`, so only left-facing runways are reserved (`Plane.java:573`). Rust reserves for both directions (`plane.rs` `is_facing_runway_correctly`), which can delay landings on right-facing runways.
6. **Same-player plane collisions.** The original only dodges planes owned by another player (`Plane.java:592`). Rust dodges any pair. This only matters when your new plane meets your own abandoned one.
7. **Landing requires a pilot in Rust.** An abandoned plane meeting the landing conditions snaps onto the runway in the original. In Rust it crashes. Low impact.

### Men

8. **Touching ground skips the coast and water checks.** `continue 'men` after a ground hit (`tick_collision.rs` men vs ground) means a man on a ground/water or ground/coast seam survives. The original kills him.
9. **Bullets from the man's own player.** The original removes the bullet and the man survives. Rust neither removes the bullet nor checks its other targets that tick:
   - the pilot's own bullets pass through his parachuting man;
   - a man's point-blank shot can't hit anything while it still overlaps him.
10. **A bomb hitting a man explodes at the man's top-left corner.** The original explodes at the bomb's position (`Bomb.java:149`).
11. **Suicide and shoot.** The original's `if (shoot) … else if (suicide)` means holding both just shoots (`Man.java:177-187`). Rust does both.
12. **Blocked walking reverts to the wrong x.** The original restores `lastX`, fixed at the start of the tick (`Man.java:156, 233, 246`). Rust's `previous_x` changes on every `set_x`, so two blockers in one tick cancel out and the man walks through.

### Structure (bullets, bombs, explosions)

13. **A mover only hits its first target.** The original has no early exit, so one bullet or bomb hits everything it overlaps that tick (`SolidEntity.java:86-98`). Rust `continue`s after the first match. For example, a bomb overlapping a plane and a runway only kills the plane, and the runway misses its 30 damage.
14. **One target can be hit twice in a tick.** Rust doesn't mark a target dead until the action queue runs:
    - two bullets hitting one bomb make two explosions;
    - several bombs or explosions hitting one plane or man give duplicate kills and explosions.

    In the original, the first hit removes the target.

### Minor or uncertain

- **Collision timing.** The original checks each mover right after it moves. Rust moves everything first, then checks. A few near-misses that the original registers are lost.
- **Bullet's last tick.** A bullet reaching age 175 still collides in the original on that tick, with zero damage, but can still kill a man or detonate a bomb. Rust removes it before collisions.
- **Man grace period.** The original requires ≥ 200 ms; Rust requires > 200 ms, about one tick longer.
- **Man without a controller.** The original can't kill such a man. Rust only protects him from bullets.

## Faithful (checked)

- **Plane damage:** bullets 30 × damage factor (team bullets hurt, own bullets don't). Explosions 50, own included, outside falling mode. Plane-on-plane: 25 damage, flip, dodge mode.
- **Landing:** bounds, motor off, speed, angle windows and snap.
- **Water and ground/coast:** water sinks a plane without an explosion; ground and coast crash it, with the same kill credit.
- **Structures:**
  - **Runway:** 1530 health. Damage 4 × damage factor from bullets, 30 from bombs, 17 from explosions, 17 from crashes.
  - **HQ:** 350 health. Damage 3 × damage factor from bullets, 30 from bombs, 17 from explosions.
  - **Shared:** both repair over time and stop colliding once destroyed.
- **Men:**
  - landing threshold and y snap;
  - respawn on own runway; blocked by enemy runway and HQ;
  - killed by planes, bombs and explosions of any team, with correct credit.
- **Explosions:** collide once, at phase 3.
