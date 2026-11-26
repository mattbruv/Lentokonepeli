# General fidelity audit

This compares the Rust engine (`dogfight/src`) with the decompiled original server (`dogfight-source/.../server`), excluding collisions, which are covered in [collision-audit.md](collision-audit.md).

It covers four areas:
- plane physics and controls;
- men, bullets, bombs and explosions;
- game flow and scoring;
- level loading and structures.

Java references are relative to `dogfight-source/com/aapeli/multiplayer/impl/dogfight/server/`. Rust references are relative to `dogfight/src/`.

## Status

**Fixed:** items 1–6 and 8–14.
- **Plane coordinates:** the plane now has exact top-left accessors, `java_x` and `java_y`. They reproduce Java's toward-zero integer division, including for negative coordinates. Every original formula that uses `x/100` or `y/100` goes through them:
  - collision bounds;
  - height multiplier;
  - park position;
  - landing window and landing-roll end;
  - fuel bounds and bail bounds;
  - bullet, bomb, bail-out man and death-explosion positions.
- **Timers:** all compare strictly, as the original does. Plane timers now start "long ago", matching Java's `0` timestamps, so a fresh plane can flip, fire, bomb and toggle its motor immediately.
- **Direction conversion:** `radians_to_direction` uses Java's `(int)` truncation, wrapped to a byte. Bullets keep the signed direction for movement.
- **Take-off queue:** a held Enter retries the take-off every tick once it has been pressed in the plane chooser.
- **Leaving players:** their plane or man is removed. A departed player's id isn't reused while any bullet, bomb or explosion still references it.

**Not changed:**
- **Item 7** is not a bug. The original also requires the player to control the plane (`getControlId() == id`), which is what the keyboard check expresses.
- **Item 15** is left as a deliberate guard for custom levels. None of the original levels has a team without runways.
- **The "probably intentional" list** stays as it is.

**Verification:**
- **Tests:** all 103 pass. The WASM build works.
- **Katala replay:** still survives.
- **Bot simulation** (8 bots × 30,000 ticks on all 15 levels): no crashes while taking off or landing. 154 landings began and 145 finished.

## Root cause behind several plane differences

In the original, a plane's `x, y` is the **top-left corner of its rotation canvas** (the padded square, 34–47 px). In the Rust port, it is the **centre** (`plane.rs` `bounds_for_image`).

Collision bounds were converted correctly. Every other formula that uses raw `x/100` or `y/100` was carried over without the half-canvas shift. That leaves it 17–23 px off depending on the plane type: Albatros 17, Bristol 20, Fokker/Salmson/Sopwith 21, Junkers 23. Items 1–4 below come from this.

## Differences (ranked by gameplay impact)

### Planes

1. **Altitude ceiling is 17–23 px higher.**
   - Original: `getHeightMultiplier()` uses top-left `y` (`Plane.java:787`).
   - Rust: uses centre `y` (`plane.rs` `get_height_multiplier`).
   - Effect: planes keep thrust, and so climb and accelerate better, near the top of the map.
2. **Runway start position is hand-tuned.**
   - Original: the top-left sits at `runway.x + 15` (right-facing) or `+ 230` (left-facing) (`Runway.java:100`). As a centre that would be about `+36` and `+251` for a Fokker.
   - Rust: uses `+20` and `+255`, with a comment saying they were adjusted by eye (`runway.rs` `get_start_x`).
   - Effect: the take-off start, the lift-off point and the end of the landing roll (`x <= start_x`) all shift.
3. **The landing window is checked against the centre.**
   - Original: `x/100 > landableX && x/100 + w < landableX + landableWidth`, using top-left `x` (`Plane.java:564`).
   - Rust: `can_land_on_runway` applies the same formula to the centre.
   - Effect: the accepted landing zone is about 20 px off.
4. **Bullet spawn offset uses the sprite size instead of the canvas.**
   - Original: `center + cos·(w/2+2)`, `center + sin·(h/2+2)`, where `w = h` = canvas size (`Plane.java:331`).
   - Rust: uses the raw sprite size, for example Fokker 21/12 instead of 23/23 (`plane.rs`). It also truncates each term separately.
   - Effect: bullets fired while climbing or diving start about 11 px closer to the plane.
5. **Timers fire one tick early.**
   - Original: `last + delay < now`. Rust: `>= delay`.
   - **Shoot and bomb:** fire rate is 6–8% higher for Fokker, Sopwith, Junkers and Salmson. Bombs drop every 500 ms instead of 510 ms.
   - **Flying motor toggle:** 200 ms instead of 210 ms.
   - **Man shooting:** 500 ms instead of 510 ms.
6. **Bail-out timing.**
   - Original: the man spawns after the plane moves, shoots and bombs that tick (`Plane.java:345`).
   - Rust: bails out first (`plane.rs` around 478).
   - Rust also sets the abandoned plane's health to 0, which the original doesn't, so the client shows 0%.
7. **The out-of-bounds bail only triggers when the plane has a keyboard.** The original checks it every tick.

### Men, bullets, bombs, explosions

8. **Upward man shots are one direction step off (about 1.4°).**
   - Original: casts a negative angle to `int`, which truncates toward zero, so −3.9 gives −3, which wraps to 253 (`Bullet.java:101`).
   - Rust: adds a full turn first, so it gets 252 (`tick_actions.rs` man auto-aim).
   - Bombs have the same issue (`bomb.rs`), but there it only affects the direction sent to the client.
9. **Explosions live one tick too long.** Rust removes them at `> 560 ms` and sends phase 8 for one tick. The original removes them at `>= 560 ms`.

### Levels and structures

10. **Runway x uses the other image's width.**
    - The original centres `L`/`l` runways using `runway.gif`'s width (290), but they collide and are drawn with `runway2.gif` (282). It does the reverse for `R`/`r` (`Level.java:185-197`).
    - Rust centres each runway with the image it actually uses.
    - Effect: left-facing runways sit 4 px further right, and right-facing ones 4 px further left, than in the original.
11. **Default and cycling runway order.**
    - Original: the chooser goes through runways in level order (layer by layer, then left to right), and the default is the first one (`Level.java:104`, `PlaneChooser.java:41`).
    - Rust: sorts them by x and defaults to the leftmost (`choosers.rs` `team_runways`).
    - Effect: a new player starts on a different runway on 10 of the 15 levels.

### Game flow

12. **A leaving player's plane or man stays in the world.**
    - Original: `removeAvatar()` removes it (`DogfightGame.java:310`, `PlayerInfo.java:680`).
    - Rust: only removes the player (`input.rs` `RemovePlayer`).
    - Effects:
      - An abandoned plane flies on until it crashes, and a man freezes in place.
      - Player ids are reused, so the next player to join can be credited with the leftover plane's or bullets' hits.
13. **Holding Enter doesn't queue a take-off.**
    - Original: the plane chooser retries every tick while Enter is held, so it waits out the 1–2 s runway lock (`PlaneChooser.java:209`).
    - Rust: only acts on the moment Enter is pressed, so a press during the lock is dropped.
14. **A team-kill penalty can carry over.** The original clears the next respawn type when the wait ends (`Respawner.java:53`). Rust only clears it when the wait starts, so a team kill registered while waiting (for example a bomb still falling) penalises the next death.
15. **A team with no runways counts as alive in Rust.** The original treats it as dead (`TeamInfo.java:161`). This only matters for unusual custom levels.

### Probably intentional (not recommended to change)

- **Idle players aren't kicked** at the end of the intermission (`DogfightGame.java:535`).
- **No automatic 5-minute ban** after 7 team kills in 90 s (`PlayerInfo.java:645`).
- **Smoke is drawn by the client** instead of being simulated on the server.
- **External stats aren't ported:** the landing count, per-plane shot and bomb counts, and round results.
- **Accuracy is sent as the raw ×1000 value** instead of the original's encoding. The client already expects this.
- **The dodge angle** replaces `Math.random()` with a deterministic hash. Keep it, since determinism is required.
- **Landing on a destroyed runway** strands the player in the original (no respawner). Rust respawns them; this fixes an original bug.
- **`time_winner`** carries over between levels when the key is missing in the original. Rust resets it each load.

## Checked and faithful

- **Level data:** the 15 levels in `client/src/assets/levels.json` match `dogfight-source/levels.txt` exactly.
- **Level parsing:** every tile type, plus the hill, coast, water, ground, flag and background-item offsets.
- **Runways and HQ:**
  - Runway: 1530 health. HQ: 350 health.
  - Repair: +1 health every 50 ticks while damaged.
  - Landable area: x +65, y +23, width = image width − 65.
  - Reservation delays: 1000 ms, or 2000 ms for a take-off after a landing. A destroyed runway accepts no reservations.
- **Plane physics:**
  - gravity, gravity pull, air resistance and its floor;
  - stall pull, steering and turn step, angle wrapping;
  - the gravity-then-resistance order and integer x/y truncation.
- **Plane stats:** health, fuel, ammo, bombs, acceleration, max y, turn step, shoot delay and speed modifier, for all six planes.
- **Plane systems:**
  - fuel drain and running out;
  - flip delay;
  - take-off counter (60/65/70), steering and lifts;
  - landing roll;
  - dodge counter;
  - falling and bail key;
  - landing speed and angle windows;
  - bomb spawn;
  - bullet speed and cap.
- **Man:**
  - falling, parachute and walking physics;
  - ±20000 world border;
  - suicide explosion position;
  - auto-aim targets, radius and default angle;
  - bullet spawn.
- **Projectiles:**
  - bullet movement, lifetime and damage factor;
  - bomb physics and out-of-bounds removal;
  - explosion phases and the single collision at phase 3.
- **Scoring:**
  - kill +10/+1 frag; team kill −8/−1 frag; suicide −5;
  - structure bombed +2 (enemy) or −1 (own);
  - runway destroyed +100, HQ destroyed +250 to the opposing team;
  - scores freeze after the round ends.
- **Respawn delays:** 4, 8 and 10 s.
- **Choosers:**
  - team: auto-join and balance;
  - plane: three per team.
- **Rounds:**
  - landing flow;
  - round end: Centrals checked first, then `time_winner`, then score, then tie;
  - post-game 5 s; intermission 3–600 s;
  - ready flow and per-round resets.
