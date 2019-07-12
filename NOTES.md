# Notes
This is a place for my notes and to consolidate my thoughts as I attempt to reverse engineer/make guesses as to how the game works.

# Airplane properties

The properties for the airplanes are calculated based on a table found [here](https://web.archive.org/web/20181207182732/http://munkkiliiga.arkku.net/index.php?sivu=lentokonepeli).
I'm making a shared immutable library in the dogfight source folder
for updating state, so that the physics
can be calculated on both the server and client side.


# GUI

Resolution: 740x565 pixels

Width of the metal panel is 740px, and the height in pixels was
taken from an inline CSS height from an archived page from the wayback machine.
Visual tests in photoshop seem to confirm that these were likely the dimensions of the game.

Panel is either wooden or metal depending on which team you're on. Axis = Metal, Allies = Wood.

### Layers

All GUI components seems to be drawn on different layers.
From top to bottom:

07. * Clock
    * Ghost?

08. * Game End Text
    * Plane Selection Prompt
    * Respawn Text
    * Team Selection Prompt

09. * Building (Alive)

10. * Coast

11. * Bullet
    * Bomb
    * Explosion
    * Smoke
    * Water
    * Runway (Alive)
    * Intermission Screen

12. * Plane
    * Man

13. * Runway
    * Building (Destroyed)
    * Runway (Destroyed)

14. * Ground

15. * Flag
    * Background Image (Control Towers, Palm tree, etc.)

16. * Hill

17. * Sky

TODO: Note each layer for each component in this document.


## Objects

### Bullets

Bullets are 2x2 pixel black squares that are drawn dynamically (no images).

Bullets have 5 colors

