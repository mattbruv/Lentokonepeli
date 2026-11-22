import { Team } from "dogfight-types/Team";
import { WorldState } from "dogfight-types/WorldState";
import * as PIXI from "pixi.js";
import { IntlShape } from "react-intl";
import { GAME_INTL } from "../intl/messages";
import { Textures } from "./textures";

const FG_COLOR = 0xafaf5a;
const BG_COLOR = 0x32325a;
const CLOCK_WARNING_COLOR = 0xff8246;

export class RoundInfo {
    public container: PIXI.Container;
    public clockContainer: PIXI.Container;

    private banner: PIXI.Text;
    private splash: PIXI.Container;
    private splashImage: PIXI.Sprite;
    private splashMask: PIXI.Graphics;
    private readyText: PIXI.Text;
    private clockText: PIXI.Text;
    private intl?: IntlShape;

    constructor() {
        this.container = new PIXI.Container();
        this.clockContainer = new PIXI.Container();

        this.banner = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 48,
            fontWeight: "bold",
            fill: FG_COLOR,
            stroke: BG_COLOR,
            strokeThickness: 4,
        });
        this.banner.anchor.set(0.5);
        this.banner.visible = false;

        this.splash = new PIXI.Container();
        this.splashImage = new PIXI.Sprite();
        this.splashMask = new PIXI.Graphics();
        this.readyText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 20,
            fontWeight: "bold",
            fill: 0x000000,
        });
        this.readyText.anchor.set(0.5, 1);
        this.splash.addChild(this.splashImage);
        this.splash.addChild(this.splashMask);
        this.splash.addChild(this.readyText);
        this.splashImage.mask = this.splashMask;
        this.splash.visible = false;

        this.clockText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 17,
            fontWeight: "bold",
            fill: FG_COLOR,
        });
        this.clockText.anchor.set(0, 1);
        this.clockContainer.addChild(this.clockText);
        this.clockContainer.visible = false;

        this.container.addChild(this.splash);
        this.container.addChild(this.banner);
    }

    public init(intl: IntlShape, width: number, gameHeight: number) {
        this.intl = intl;
        this.splashImage.texture = Textures["mdl_page.jpg"];
        this.splashMask.clear();
        this.splashMask.beginFill(0xffffff);
        this.splashMask.drawRect(0, 0, width, gameHeight);
        this.splashMask.endFill();
        this.readyText.text = intl.formatMessage(GAME_INTL.press_enter_when_ready);
        this.readyText.position.set(width / 2, 360);
        this.banner.position.set(width / 2, gameHeight / 2 - 70);
        this.clockText.position.set(350, gameHeight - 3);
    }

    public update(state: WorldState | null, winner: Team | null, myPlayerReady: boolean) {
        this.splash.visible = state === "Intermission";
        this.readyText.visible = !myPlayerReady;

        if (state === "PostGame" && this.intl) {
            this.banner.text = this.getWinnerMessage(winner);
            this.banner.visible = true;
        } else {
            this.banner.visible = false;
        }
    }

    public getWinnerMessage(winner: Team | null): string {
        if (!this.intl) return "";
        if (winner === null) return this.intl.formatMessage(GAME_INTL.round_tie);
        return this.intl.formatMessage(GAME_INTL.round_won, { team: winner });
    }

    public setTimeLeft(seconds: number | null) {
        if (seconds === null) {
            this.clockContainer.visible = false;
            return;
        }

        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.clockText.text = `${minutes.toString().padStart(2, " ")}:${secs.toString().padStart(2, "0")}`;
        this.clockText.style.fill = minutes === 0 && secs < 5 ? CLOCK_WARNING_COLOR : FG_COLOR;
        this.clockContainer.visible = true;
    }
}
