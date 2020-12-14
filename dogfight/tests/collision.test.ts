import {
  Rectangle,
  projectPointToAxis,
  projectionToScalar,
  RectangleBody
} from "../src/physics/rectangle";
import { Vec2d } from "../src/physics/vector";
import {
  isPointRectCollision,
  isRectangleCollision
} from "../src/physics/collision";
import { ROTATION_DIRECTIONS } from "../src/constants";

const point: Vec2d = {
  x: 2,
  y: 6
};

const axis: Vec2d = {
  x: 3,
  y: 4
};

const projection = projectPointToAxis(point, axis);

test("there are 256 rotation angles", (): void => {
  expect(ROTATION_DIRECTIONS).toBe(256);
});

test("can project point to axis", (): void => {
  expect(projection.x).toBeCloseTo(3.6);
  expect(projection.y).toBeCloseTo(4.8);
});

test("can make projection point scalar", (): void => {
  expect(projectionToScalar(projection, axis)).toBeCloseTo(30);
});

const bullet: Vec2d = { x: 397, y: 280 };
const rectA: RectangleBody = {
  width: 82,
  height: 22,
  center: { x: 410, y: 309 },
  direction: 0
};

test("bullet should miss rectangle", (): void => {
  expect(isPointRectCollision(bullet, rectA)).toBe(false); // miss
  rectA.direction = 32; // miss
  expect(isPointRectCollision(bullet, rectA)).toBe(false);
});

test("bullet should hit rotated rectangle", (): void => {
  rectA.direction = 33;
  expect(isPointRectCollision(bullet, rectA)).toBe(true);
});

const rectB: RectangleBody = {
  center: { x: 389, y: 362 },
  direction: 12,
  height: 69,
  width: 64
};

const rectC: RectangleBody = {
  center: { x: 455, y: 375 },
  direction: 228,
  height: 22,
  width: 82
};

test("rotated rectangles should miss each other", (): void => {
  expect(isRectangleCollision(rectB, rectC)).toBe(false); // miss
});

test("rotated rectangles should hit each other", (): void => {
  rectC.center = { x: 454, y: 382 };
  rectC.direction = 25;
  expect(isRectangleCollision(rectB, rectC)).toBe(true); // hit
});

test("rectangle collision", (): void => {
  const r1 = new Rectangle(0, 0, 10, 10);
  const r2 = new Rectangle(0, 0, 5, 5);
  const r3 = r1.intersection(r2);
  expect(r3.x).toBe(0);
  expect(r3.y).toBe(0);
  expect(r3.width).toBe(5);
  expect(r3.height).toBe(5);
});

test("rectangle collision", (): void => {
  const r1 = new Rectangle(2, 2, 6, 6);
  const r2 = new Rectangle(-2, -2, 6, 6);
  const r3 = r1.intersection(r2);
  expect(r3.x).toBe(0);
  expect(r3.y).toBe(0);
  expect(r3.width).toBe(2);
  expect(r3.height).toBe(2);
});

test("rectangle collision", (): void => {
  const r1 = new Rectangle(2, 0, 6, 6);
  const r2 = new Rectangle(-2, 0, 6, 6);
  const r3 = r1.intersection(r2);
  expect(r3.x).toBe(0);
  expect(r3.y).toBe(0);
  expect(r3.width).toBe(2);
  expect(r3.height).toBe(6);
});

test("rectangle collision", (): void => {
  const r1 = new Rectangle(4, 4, 4, 4);
  const r2 = new Rectangle(6, 4, 2, 2);
  const r3 = r1.intersection(r2);
  expect(r3.x).toBe(5.5);
  expect(r3.y).toBe(4);
  expect(r3.width).toBe(1);
  expect(r3.height).toBe(2);
});