# Collision Detection Playground

This is a simple page that demonstrates collision detection.

For the purpose of this game, there are three different bodies that will require collision detection:

1. Rectangles (Potentially rotated)
2. Circles
3. Single point

Rectangles can represent any of the following:
* Planes
* Runways
* Ground
* Pilots
* Bombs

Circles represent explosions, 
and a Single point would represent bullets.

## Collision Page

This is a simple HTML page that will
give a visual representation of 
the implemented collision detection algorithms
on different types of collision objects.

Click and drag to move objects on the screen.

Two rectangles are included.
The main one (rectangle 1) is filled with color on the page load.
Everything can interact with rectangle 1.

* When two rectangles collide, they will both turn red.
* When rectangle 1 collides with a circle, it will become transparent.
* When rectangle 1 collides with a single point (bullet), the bullet will double in size.
* Holding Left/Right while clicking on a rectangle will change the rectangle's rotation.
Hitting Up will reset it's rotation to zero.

The code got kind of hacky and not pretty to maintain as time went on.
The purpose of this page is soley for quick visual feedback. 
I don't really care about making it look beautiful.