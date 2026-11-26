import { ManProperties } from "dogfight-types/ManProperties";
import { Team } from "dogfight-types/Team";
import * as PIXI from "pixi.js";
import { scheduler, TaskFn } from "../../gameLoop";
import { DrawLayer, MAX_ZOOM, TeamColor } from "../constants";
import { Stats } from "../hud";
import { RadarObject, RadarObjectType } from "../radar";
import { Textures } from "../textures";
import { Entity, EntityUpdateCallbacks, Followable, Point, RadarEnabled } from "./entity";

const WALK_FRAME_TICKS = 10;

export class Man implements Entity<ManProperties>, Followable, RadarEnabled {
    public props: Required<ManProperties> = {
        client_x: 0,
        client_y: 0,
        state: "Standing",
        team: "Allies",
    };

    private container: PIXI.Container;
    private manContainer: PIXI.Container;
    private nameContainer: PIXI.Container;

    private manSprite: PIXI.Sprite;

    private nameText: PIXI.Text;
    private animate: TaskFn = (tick) => {
        if (tick % WALK_FRAME_TICKS === 0) this.animateWalk(tick);
    };

    constructor() {
        this.container = new PIXI.Container();
        this.manContainer = new PIXI.Container();
        this.manSprite = new PIXI.Sprite();

        const texture = Textures["parachuter0.gif"];
        this.nameText = new PIXI.Text("", {
            fontFamily: "arial",
            fontSize: 10,
        });
        this.nameText.resolution = MAX_ZOOM;
        this.nameContainer = new PIXI.Container();
        this.nameContainer.addChild(this.nameText);
        this.nameContainer.zIndex = DrawLayer.Name;

        this.manSprite.texture = texture;

        // set anchor point at bottom middle
        this.manSprite.anchor.set(0.5, 0);
        this.manSprite.position.x = texture.width / 2;

        this.container.addChild(this.manContainer);
        this.manContainer.addChild(this.manSprite);

        this.container.zIndex = DrawLayer.Man;

        scheduler.scheduleRecurring(this.animate, 1);
    }

    public callbackOrder: (keyof ManProperties)[] = ["client_x", "client_y"];

    public updateCallbacks: EntityUpdateCallbacks<ManProperties> = {
        client_x: () => this.updateX(),
        client_y: () => this.updateY(),
        team: () => this.updateTeam(),
        state: () => this.updateState(),
    };

    public getContainer(): PIXI.Container[] {
        return [this.container, this.nameContainer];
    }

    public getStats(): Stats {
        return {
            health: 255,
            fuel: 0,
            ammo: 255,
            bombs: 0,
        };
    }

    public getCenter(): Point {
        return {
            x: this.props.client_x ?? 0,
            y: this.props.client_y ?? 0,
        };
    }

    public destroy() {
        scheduler.unregister(this.animate);
    }

    private updateX(): void {
        this.container.position.x = this.props.client_x;
        this.positionName();
    }

    private updateY(): void {
        this.container.position.y = this.props.client_y;
        this.positionName();
    }

    private positionName(): void {
        const ascent = PIXI.TextMetrics.measureFont(this.nameText.style.toFontString()).ascent;
        this.nameText.position.set(this.props.client_x, this.props.client_y - ascent);
    }

    private updateState(): void {
        switch (this.props.state) {
            case "Falling": {
                this.manSprite.texture = Textures["parachuter0.gif"];
                this.manSprite.scale.x = 1;
                break;
            }
            case "Parachuting": {
                this.manSprite.texture = Textures["parachuter1.gif"];
                this.manSprite.scale.x = 1;
                break;
            }
            case "Standing": {
                this.manSprite.texture = Textures["parachuter0.gif"];
                this.manSprite.scale.x = 1;
                break;
            }
            case "WalkingLeft": {
                //this.manSprite.anchor.x = -0.5;
                this.manSprite.scale.x = 1;
                break;
            }
            case "WalkingRight": {
                //this.manSprite.anchor.x = 1;
                this.manSprite.scale.x = -1;
                break;
            }
        }
    }
    private updateTeam(): void {}

    public getRadarInfo(): RadarObject {
        return {
            type: RadarObjectType.Man,
            x: this.props.client_x + Math.trunc(this.manSprite.texture.width / 2),
            y: this.props.client_y + Math.trunc(this.manSprite.texture.height / 2),
            team: this.props.team,
        };
    }

    private animateWalk(tick: number): void {
        if (!(this.props.state == "WalkingLeft" || this.props.state == "WalkingRight")) {
            return;
        }

        const frame = Math.floor(tick / WALK_FRAME_TICKS) % 2;
        this.manSprite.texture = Textures[frame === 0 ? "parachuter3.gif" : "parachuter2.gif"];
    }

    setPlayerName(name: string | null, team: Team | null) {
        if (!name) {
            this.nameText.visible = false;
            return;
        }

        this.nameText.text = name.substring(0, 15);
        this.nameText.style.fill = this.getColor(team);
        this.nameText.visible = true;
    }

    private getColor(team: Team | null): TeamColor {
        if (team === null) return TeamColor.SpectatorForeground;
        if (this.props.team === null) return TeamColor.SpectatorForeground;

        if (team === this.props.team) {
            return TeamColor.OwnForeground;
        }

        return TeamColor.OpponentForeground;
    }
}
