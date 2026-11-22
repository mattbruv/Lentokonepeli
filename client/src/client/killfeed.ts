import { KillEvent } from "dogfight-types/KillEvent";
import * as PIXI from "pixi.js";
import { Player } from "./entities/player";
import { Team } from "dogfight-types/Team";
import { TeamColor } from "./constants";
import { Textures } from "./textures";
import { formatName } from "./helpers";

const FEED_WIDTH = 220;
const FEED_MAX_HEIGHT = 220;
const ROW_HEIGHT = 17;

export interface KillEventUIData extends KillEvent {
    killer_data: Player;
    victim_data: Player | null;
}

export class KillFeed {
    public container: PIXI.Container;
    public entries: PIXI.Container;
    private pov_team: Team | null = null;

    constructor() {
        this.container = new PIXI.Container();
        this.entries = new PIXI.Container();

        this.container.addChild(this.entries);
    }

    public init() {
        //
    }

    private reorderEntries() {
        let y = 0;
        for (const entry of this.entries.children) {
            entry.position.y = y;
            y += ROW_HEIGHT;
        }
    }

    private getColor(team: Team | null): TeamColor {
        if (this.pov_team === null || team === null) return TeamColor.UnchosenForeground;
        return team === this.pov_team ? TeamColor.OwnForeground : TeamColor.OpponentForeground;
    }

    private opposite(color: TeamColor): TeamColor {
        if (color === TeamColor.OwnForeground) return TeamColor.OpponentForeground;
        if (color === TeamColor.OpponentForeground) return TeamColor.OwnForeground;
        return color;
    }

    private makeText(text: string, color: TeamColor): PIXI.Text {
        return new PIXI.Text(text, {
            fontFamily: "arial",
            fontSize: 13,
            fill: color,
            fontWeight: "bold",
        });
    }

    public addKillEvent(event: KillEventUIData) {
        const entry = new PIXI.Container();

        const killerTeam = event.killer_data.props.team;
        const killerColor = this.getColor(killerTeam);
        const { name, clan } = event.killer_data.props;

        const killerText = this.makeText(formatName(name, clan) + " ", killerColor);
        entry.addChild(killerText);

        const iconTexture: keyof typeof Textures = event.method === "Plane" ? "plane_icon.gif" : "man_icon.gif";
        const icon = new PIXI.Sprite(Textures[iconTexture]);
        icon.position.set(killerText.width, Math.max(0, Math.round((killerText.height - icon.height) / 2)));
        entry.addChild(icon);

        if (event.victim !== null && event.victim_data !== null) {
            const victim = event.victim_data.props;
            const teamKill = victim.team !== null && victim.team === killerTeam;
            const victimColor = teamKill ? killerColor : this.opposite(killerColor);
            const victimText = this.makeText(" " + formatName(victim.name, victim.clan) + " ", victimColor);
            victimText.position.x = icon.position.x + icon.width;
            entry.addChild(victimText);
        }

        entry.position.x = Math.max(0, FEED_WIDTH - entry.width);
        this.entries.addChild(entry);

        while (this.entries.children.length * ROW_HEIGHT > FEED_MAX_HEIGHT) {
            this.entries.removeChildAt(0);
        }
        this.reorderEntries();

        setTimeout(() => {
            this.entries.removeChild(entry);
            this.reorderEntries();
        }, 8_000);
    }

    setTeam(team: Team | null) {
        this.pov_team = team;
    }
}
