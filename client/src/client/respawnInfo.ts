import { RespawnType } from "dogfight-types/RespawnType";
import * as PIXI from "pixi.js";
import { IntlShape } from "react-intl";
import { GAME_INTL } from "../intl/messages";
import { BigText } from "./bigText";

const FG_COLOR = 0xafaf5a;
const BG_COLOR = 0x32325a;
const SPECTATE_TEXT_Y = 175;
const COUNTDOWN_FALLBACK_STYLE: Partial<PIXI.ITextStyle> = {
    fontFamily: "Arial",
    fontSize: 48,
    fontWeight: "bold",
    fill: FG_COLOR,
    stroke: BG_COLOR,
    strokeThickness: 4,
};

export class RespawnInfo {
    public container: PIXI.Container;

    private countdown: PIXI.Container;
    private countdownPrefix: BigText;
    private countdownNumber: BigText;
    private countdownNumberReference: BigText;
    private penaltyText: PIXI.Text;
    private spectateText: PIXI.Text;
    private suicidePenalty = "";
    private teamKillPenalty = "";

    constructor() {
        this.container = new PIXI.Container();

        this.countdown = new PIXI.Container();
        this.countdownPrefix = new BigText(FG_COLOR, COUNTDOWN_FALLBACK_STYLE);
        this.countdownNumber = new BigText(FG_COLOR, COUNTDOWN_FALLBACK_STYLE);
        this.countdownNumberReference = new BigText(FG_COLOR, COUNTDOWN_FALLBACK_STYLE);
        this.countdownNumberReference.setText("1");
        this.countdown.addChild(this.countdownPrefix.container);
        this.countdown.addChild(this.countdownNumber.container);

        this.penaltyText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 20,
            fill: FG_COLOR,
            stroke: BG_COLOR,
            strokeThickness: 3,
        });
        this.penaltyText.anchor.set(0.5, 0);
        this.penaltyText.position.set(0, 46);

        this.spectateText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 20,
            fontWeight: "bold",
            fill: 0xffffff,
        });
        this.spectateText.anchor.set(0.5, 1);
        this.spectateText.position.set(0, SPECTATE_TEXT_Y);

        this.container.addChild(this.countdown);
        this.container.addChild(this.penaltyText);
        this.container.addChild(this.spectateText);
        this.container.visible = false;
    }

    public init(intl: IntlShape) {
        this.countdownPrefix.setText(`${intl.formatMessage(GAME_INTL.respawning_in)}  `);
        const prefixX = -Math.trunc((this.countdownPrefix.width + this.countdownNumberReference.width) / 2);
        const y = -Math.trunc(this.countdownPrefix.height / 2);
        this.countdownPrefix.container.position.set(prefixX, y);
        this.countdownNumber.container.position.set(prefixX + this.countdownPrefix.width, y);
        this.suicidePenalty = intl.formatMessage(GAME_INTL.suicide_penalty);
        this.teamKillPenalty = intl.formatMessage(GAME_INTL.teamkill_penalty);
        this.spectateText.text = intl.formatMessage(GAME_INTL.wait_for_round);
    }

    public show(seconds: number, respawnType: RespawnType) {
        if (seconds <= 0) {
            this.hide();
            return;
        }

        this.countdownNumber.setText(`${seconds}`);
        this.countdown.visible = true;
        this.penaltyText.visible = true;
        this.spectateText.visible = false;

        switch (respawnType) {
            case "Suicide":
                this.penaltyText.text = this.suicidePenalty;
                break;
            case "TeamKill":
                this.penaltyText.text = this.teamKillPenalty;
                break;
            default:
                this.penaltyText.text = "";
        }

        this.container.visible = true;
    }

    public showSpectating() {
        this.countdown.visible = false;
        this.penaltyText.visible = false;
        this.spectateText.visible = true;
        this.container.visible = true;
    }

    public hide() {
        this.container.visible = false;
    }
}
