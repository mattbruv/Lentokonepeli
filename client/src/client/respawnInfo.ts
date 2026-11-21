import { RespawnType } from "dogfight-types/RespawnType";
import * as PIXI from "pixi.js";
import { IntlShape } from "react-intl";
import { GAME_INTL } from "../intl/messages";

const FG_COLOR = 0xafaf5a;
const BG_COLOR = 0x32325a;

export class RespawnInfo {
    public container: PIXI.Container;

    private countdownText: PIXI.Text;
    private penaltyText: PIXI.Text;
    private respawningIn = "";
    private suicidePenalty = "";
    private teamKillPenalty = "";

    constructor() {
        this.container = new PIXI.Container();

        this.countdownText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 48,
            fontWeight: "bold",
            fill: FG_COLOR,
            stroke: BG_COLOR,
            strokeThickness: 4,
        });
        this.countdownText.anchor.set(0.5);

        this.penaltyText = new PIXI.Text("", {
            fontFamily: "Arial",
            fontSize: 20,
            fill: FG_COLOR,
            stroke: BG_COLOR,
            strokeThickness: 3,
        });
        this.penaltyText.anchor.set(0.5, 0);
        this.penaltyText.position.set(0, 46);

        this.container.addChild(this.countdownText);
        this.container.addChild(this.penaltyText);
        this.container.visible = false;
    }

    public init(intl: IntlShape) {
        this.respawningIn = intl.formatMessage(GAME_INTL.respawning_in);
        this.suicidePenalty = intl.formatMessage(GAME_INTL.suicide_penalty);
        this.teamKillPenalty = intl.formatMessage(GAME_INTL.teamkill_penalty);
    }

    public show(seconds: number, respawnType: RespawnType) {
        if (seconds <= 0) {
            this.hide();
            return;
        }

        this.countdownText.text = `${this.respawningIn}  ${seconds}`;

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

    public hide() {
        this.container.visible = false;
    }
}
