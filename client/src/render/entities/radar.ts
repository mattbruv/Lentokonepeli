import * as PIXI from "pixi.js";
import { EntityType } from "../../../../dogfight/src/entity";
import { Team } from "../../../../dogfight/src/constants";

const BackgroundColor = 0xc7d3df;

export const RADAR_WIDTH = 208;
export const RADAR_HEIGHT = 104;

const offsetX = 425;
const offsetY = 26;
const halfX = Math.round(RADAR_WIDTH / 2);
const halfY = Math.round(RADAR_HEIGHT / 2);
const centerX = halfX + offsetX;
const centerY = halfY + offsetY;

export const radarObjects = [
  EntityType.Ground,
  EntityType.Runway,
  EntityType.Plane,
  EntityType.Trooper
];

const ENEMY_COLOR = 0xff0000;
const TEAM_COLOR = 0x0000ff;
const NEUTRAL_COLOR = 0xffffff;

export class Radar {
  public container: PIXI.Container;

  private spritesheet: PIXI.Spritesheet;

  private background: PIXI.Graphics;
  private mask: PIXI.Graphics;
  private radarGraphics: PIXI.Graphics;

  private myTeam: Team;

  public constructor(spritesheet: PIXI.Spritesheet) {
    this.setTeam(Team.Spectator);
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();

    this.background = new PIXI.Graphics();
    this.radarGraphics = new PIXI.Graphics();
    this.mask = new PIXI.Graphics();

    this.background.beginFill(BackgroundColor);
    // this.background.beginFill(0xff00ff);
    this.background.drawRect(0, 0, RADAR_WIDTH, RADAR_HEIGHT);
    this.background.endFill();

    this.mask.beginFill(0xff00ff);
    this.mask.drawRect(0, 0, RADAR_WIDTH, RADAR_HEIGHT);
    this.mask.endFill();

    // offset the container so the radar is in the right spot
    // this.radar.setBounds(425, 26, 208, 104);
    this.container.position.set(centerX, centerY);
    this.background.position.set(-halfX, -halfY);
    this.mask.position.set(-halfX, -halfY);

    // this.container.addChild(this.background);
    this.container.addChild(this.background);
    this.container.addChild(this.radarGraphics);
    this.container.addChild(this.mask);
    this.radarGraphics.mask = this.mask;
  }

  public centerCamera(x: number, y: number): void {
    const radarX = Math.round((x * -1 * RADAR_HEIGHT) / 1000);
    const radarY = Math.round((y * RADAR_HEIGHT) / 1000);
    this.radarGraphics.position.set(radarX, radarY);
  }

  public setTeam(newTeam: Team): void {
    this.myTeam = newTeam;
  }

  public refreshRadar(gameObjects: any): void {
    this.radarGraphics.clear();
    const grounds = gameObjects[EntityType.Ground];
    for (const id in grounds) {
      this.renderGround(grounds[id]);
    }
    const troopers = gameObjects[EntityType.Trooper];
    for (const id in troopers) {
      this.renderObject(troopers[id]);
    }
    const planes = gameObjects[EntityType.Plane];
    for (const id in planes) {
      this.renderObject(planes[id]);
    }
    const runways = gameObjects[EntityType.Runway];
    for (const id in runways) {
      this.renderRunway(runways[id]);
    }
  }

  private renderObject(obj: any): void {
    let startX = Math.round((obj.x * RADAR_HEIGHT) / 1000) - 1;
    let startY = Math.round((obj.y * -1 * RADAR_HEIGHT) / 1000) - 1;
    let color;
    if (this.myTeam == Team.Spectator || obj.team == Team.Spectator) {
      color = NEUTRAL_COLOR;
    } else {
      if (obj.team == this.myTeam) {
        color = TEAM_COLOR;
      } else {
        color = ENEMY_COLOR;
      }
    }
    this.radarGraphics.beginFill(color);
    this.radarGraphics.drawRect(startX, startY - 1, 3, 3);
    this.radarGraphics.endFill();
  }

  private renderRunway(runway: any): void {
    if (runway.health <= 0) {
      return;
    }
    const startX = Math.round((runway.x * RADAR_HEIGHT) / 1000) - 1;
    const startY = Math.round((runway.y * -1 * RADAR_HEIGHT) / 1000) - 1;
    this.radarGraphics.beginFill(0xffffff);
    this.radarGraphics.drawRect(startX, startY + 1, 3, 3);
    this.radarGraphics.endFill();
  }

  private renderGround(ground: any): void {
    const startX = Math.round(
      ((-Math.round(ground.width / 2) + ground.x) * RADAR_HEIGHT) / 1000
    );
    const startY = Math.round((ground.y * -1 * RADAR_HEIGHT) / 1000);
    const rGroundWidth = Math.round((ground.width * RADAR_HEIGHT) / 1000);
    this.radarGraphics.beginFill(0x111111);
    this.radarGraphics.drawRect(startX, startY + 1, rGroundWidth, 2);
    this.radarGraphics.endFill();
  }
}

/*
int i = localFollowable.getCenterX();
int j = localFollowable.getCenterY();
k = ((Ground)localObject).getX();
m = ((Ground)localObject).getY();

fillRect(
  GROUND:
  (groundX - followX + 1000) * getWidth() / 2000,
  (groundY - followY + 500) * getHeight() / 1000,
  Ground.getWidth() * getHeight() / 1000,
  1
);

*/
