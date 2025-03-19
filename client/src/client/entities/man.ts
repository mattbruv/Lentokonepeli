import { Entity, EntityUpdateCallbacks, Followable, Point, RadarEnabled } from "./entity";
import * as PIXI from "pixi.js";
import { Textures } from "../textures";
import { DrawLayer, TeamColor } from "../constants";
import { ManProperties } from "dogfight-types/ManProperties";
import { Stats } from "../hud";
import { RadarObject, RadarObjectType } from "../radar";
import { Team } from "dogfight-types/Team";
import { animationRunner } from "../../gameLoop";

export class Man implements Entity<ManProperties>, Followable, RadarEnabled {
    public props: Required<ManProperties> = {
        client_x: 0,
        client_y: 0,
        state: "Standing",
        team: "Allies",
    };

    private container: PIXI.Container;
    private manContainer: PIXI.Container;

    private manSprite: PIXI.Sprite;

    private nameText: PIXI.Text;
    private frameCount = 0;

    private animate = () => {
        this.animateWalk();
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
        //this.nameText.anchor.set(0.5, 0)
        this.nameText.position.set(0, -15);

        this.manSprite.texture = texture;

        // set anchor point at bottom middle
        this.manSprite.anchor.set(0.5, 0);
        this.manSprite.position.x = texture.width / 2;

        this.container.addChild(this.manContainer);
        this.manContainer.addChild(this.manSprite);
        this.manContainer.addChild(this.nameText);

        this.container.zIndex = DrawLayer.Man;

        animationRunner.registerAnimation(this.animate, 10);
    }

    public callbackOrder: (keyof ManProperties)[] = ["client_x", "client_y"];

    public updateCallbacks: EntityUpdateCallbacks<ManProperties> = {
        client_x: () => this.updateX(),
        client_y: () => this.updateY(),
        team: () => this.updateTeam(),
        state: () => this.updateState(),
    };

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public getStats(): Stats {
        return {
            health: 255,
            ammo: 255,
            bombs: 1,
        };
    }

    public getCenter(): Point {
        return {
            x: this.props.client_x ?? 0,
            y: this.props.client_y ?? 0,
        };
    }

    public destroy() {
        animationRunner.unregisterAnimation(this.animate);
    }

    private updateX(): void {
        this.container.position.x = this.props.client_x;
    }

    private updateY(): void {
        this.container.position.y = this.props.client_y;
    }

    private updateState(): void {
        switch (this.props.state) {
            case "Falling": {
                this.manSprite.texture = Textures["parachuter0.gif"];
                break;
            }
            case "Parachuting": {
                this.manSprite.texture = Textures["parachuter1.gif"];
                break;
            }
            case "Standing": {
                this.manSprite.texture = Textures["parachuter0.gif"];
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
            x: this.props.client_x,
            y: this.props.client_y + this.manSprite.texture.height,
            team: this.props.team,
        };
    }

    private animateWalk(): void {
        if (!(this.props.state == "WalkingLeft" || this.props.state == "WalkingRight")) {
            return;
        }

        if (this.frameCount == 0) {
            this.manSprite.texture = Textures["parachuter3.gif"];
            this.frameCount = 1;
        } else if (this.frameCount == 1) {
            this.manSprite.texture = Textures["parachuter2.gif"];
            this.frameCount = 0;
        }
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
