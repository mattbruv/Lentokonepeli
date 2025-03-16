import * as PIXI from "pixi.js";
import { Team } from "dogfight-types/Team";

const BackgroundColor = 0xc7d3df;

export const RADAR_WIDTH = 208;
export const RADAR_HEIGHT = 104;

const offsetX = 425;
const offsetY = 26;
const halfX = Math.round(RADAR_WIDTH / 2);
const halfY = Math.round(RADAR_HEIGHT / 2);
const centerX = halfX + offsetX;
const centerY = halfY + offsetY;

export enum RadarObjectType {
    Ground,
    Runway,
    Plane,
    Man
};

export type RadarObject = {
    type: RadarObjectType
    x: number
    y: number
    width?: number
    health?: number
    team?: Team
}

const ENEMY_COLOR = 0xff0000;
const TEAM_COLOR = 0x0000ff;
const NEUTRAL_COLOR = 0xffffff;

export class Radar {
    public container: PIXI.Container;

    private background: PIXI.Graphics;
    private mask: PIXI.Graphics;
    private radarGraphics: PIXI.Graphics;

    private myTeam?: Team;
    private renderFunctions: Record<RadarObjectType, (obj: RadarObject) => void>;

    public constructor() {
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

        this.renderFunctions = {
            [RadarObjectType.Ground]: (e) => this.renderGround(e),
            [RadarObjectType.Man]: (e) => this.renderObject(e),
            [RadarObjectType.Plane]: (e) => this.renderObject(e),
            [RadarObjectType.Runway]: (e) => this.renderRunway(e),
        }
    }

    public centerCamera(x: number, y: number): void {
        const radarX = Math.round((x * RADAR_HEIGHT) / 1000);
        const radarY = Math.round((y * RADAR_HEIGHT) / 1000);
        this.radarGraphics.position.set(radarX, radarY);
    }

    public setTeam(newTeam?: Team): void {
        this.myTeam = newTeam;
    }

    public refreshRadar(radarObjects: RadarObject[]): void {
        this.radarGraphics.clear();

        for (const obj of radarObjects) {
            this.renderFunctions[obj.type](obj)
        }
    }

    private renderObject(obj: RadarObject): void {
        const startX = Math.round((obj.x * RADAR_HEIGHT) / 1000) - 1;
        const startY = Math.round((obj.y * RADAR_HEIGHT) / 1000) - 1;
        let color;

        // console.log(this.myTeam, obj.team)

        if (this.myTeam === undefined || obj.team == undefined) {
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

    private renderRunway(runway: RadarObject): void {
        if (!runway.health) {
            return;
        }
        const startX = Math.round((runway.x * RADAR_HEIGHT) / 1000) - 1;
        const startY = Math.round((runway.y * RADAR_HEIGHT) / 1000) - 1;
        this.radarGraphics.beginFill(0xffffff);
        this.radarGraphics.drawRect(startX, startY + 1, 3, 3);
        this.radarGraphics.endFill();
    }

    private renderGround(ground: RadarObject): void {
        if (!ground.width) return;
        const startX = Math.round(
            ((ground.x) * RADAR_HEIGHT) / 1000
        );
        const startY = Math.round((ground.y * RADAR_HEIGHT) / 1000);
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