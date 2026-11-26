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

## Behaviour differences

All of these are fixed, and the engine stays fully deterministic. Collision phases still run in a fixed order: men, bullets, bombs, planes, explosions.

### How the collision loop works now

Each mover (bullet, bomb, explosion, man) now checks **every** target it overlaps, the way `SolidEntity.checkCollision()` does, instead of stopping at the first. Within a phase, an entity removed by an earlier mover is skipped, matching the original's per-mover snapshot of entities. Where the original's outcome depended on its HashMap iteration order (for example, which target a bomb "hits first"), Rust uses a fixed target order instead.

### Planes

| # | Difference | Fix |
|---|---|---|
| 1 | A falling plane landed on or damaged a runway | It crashes like it would on ground: no landing, no `planeCrash` |
| 2 | Your own explosion destroyed your falling plane | Ignored when the explosion's owner is the plane's player |
| 3 | Bullets passed through falling planes | The bullet is absorbed with no damage |
| 4 | A bomb on a falling plane gave an extra plane kill | Only the man kill is recorded |
| 5 | Landing reserved both runway directions | Only left-facing runways reserve, as in the original's operator precedence |
| 6 | Same-player planes dodged each other | Only planes of different players dodge |
| 7 | Landing required a pilot | Pilot check removed |
| — | Own runway in landing/take-off skipped every other check | Only that runway is skipped |
| — | Landed planes ran their own collision checks | They don't, matching the original's mode 2. Other entities still collide with them |

### Men

| # | Difference | Fix |
|---|---|---|
| 8 | Touching ground skipped coast and water | All terrain is checked; a man on a ground/water seam dies |
| 9 | Own-player bullets were neither absorbed nor fatal | A bullet skips only the entity that fired it (new `BulletOrigin`). Bullets from the same player are absorbed without killing |
| 10 | A bomb on a man exploded at the man's corner | The explosion is at the bomb's position |
| 11 | Suicide and shoot both fired | Shoot takes priority, then suicide |
| 12 | Blocked walking reverted to a moving `previous_x` | `previous_x` is fixed at the start of the walk tick |
| — | Grace period was `> 200 ms` | Now `>= 200 ms` |
| — | A man could be killed by several things in one tick | Removed men are skipped for the rest of the phase |

### Bullets, bombs, explosions

| # | Difference | Fix |
|---|---|---|
| 13 | A mover hit only its first target | Every overlapping target takes its effect. A bomb's first hit decides its own explosion and structure stats; later overlaps still take damage |
| 14 | One target could be hit twice in a tick | Bombs, planes and men consumed earlier in the phase are skipped |
| — | A bullet at age 175 was removed before colliding | It collides on its last tick with damage factor 0, then is removed |
| — | Bombs skipped every same-player plane | A bomb skips only the plane that dropped it (new bomb `origin`). Same-player planes still ignore the bomb |

### Deliberately not replicated

- **Interleaved timing.** The original checks each mover right after it moves, in HashMap order, which isn't reproducible. Rust moves everything first, then checks in a fixed order.
- **Planes overlapping two terrain pieces at once** create two explosions in the original, because `explode()` doesn't check whether the plane was already removed.
- **Men left behind by a departed player** can't be killed in the original (`removeSelf` checks the controller). In Rust they stay frozen and can still be killed. This is about how players leave, not about collision.
- **Decompiler-ambiguous conditions:** landing ending when `!checkCollision()`, and a falling plane spawning a man on `!checkCollision()`. Both read as decompile artefacts.
- **Skipping collision checks when nothing moved.** The original only checks flying and dodging planes when their pixel position or direction changes. This has no effect, because nothing they could hit changes in between.

### Verification

- **Tests:** all 103 pass, including the determinism and replay round-trip tests.
- **Katala replay:** survives the take-off flip.
- **Bot simulation** (8 bots × 30,000 ticks on all 15 levels): no plane crashes while landing or taking off. Every crash is a falling plane or a plane in flight.

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
