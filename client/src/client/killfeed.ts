import { KillEvent } from "dogfight-types/KillEvent";
import * as PIXI from "pixi.js";
import { Player } from "./entities/player";
import { Team } from "dogfight-types/Team";
import { TeamColor } from "./constants";
import { Textures } from "./textures";
import { formatName } from "./helpers";

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
        let i = 0;
        for (const entry of this.entries.children) {
            entry.position.y = i++ * 20;
        }
        //
    }

    private getColor(team: Team | null): TeamColor {
        if (this.pov_team === null) return TeamColor.SpectatorForeground;
        if (team === null) return TeamColor.SpectatorForeground;

        if (team === this.pov_team) {
            return TeamColor.OwnForeground;
        }

        return TeamColor.OpponentForeground;
    }

    public addKillEvent(event: KillEventUIData) {
        //console.log("Adding", event)

        const entry = new PIXI.Container();

        const yOffset = this.entries.children.length * 20;
        entry.position.y = yOffset;

        const { name, clan } = event.killer_data.props;

        const killerText = new PIXI.Text(formatName(name, clan), {
            fontFamily: "arial",
            fontSize: 15,
            fill: this.getColor(event.killer_data.props.team),
            fontWeight: "bold",
        });

        const iconTexture: keyof typeof Textures = event.method === "Plane" ? "plane_icon.gif" : "man_icon.gif";
        const icon = new PIXI.Sprite(Textures[iconTexture]);
        icon.position.x += killerText.width + 3;
        icon.position.y += 3;

        entry.addChild(killerText);
        entry.addChild(icon);

        if (event.victim !== null && event.victim_data !== null) {
            const { name, clan } = event.victim_data.props;

            const victimText = new PIXI.Text(formatName(name, clan), {
                fontFamily: "arial",
                fontSize: 15,
                fill: this.getColor(event.victim_data.props.team),
                fontWeight: "bold",
            });
            victimText.position.x = icon.position.x + icon.width + 3;
            entry.addChild(victimText);
        }

        this.entries.addChild(entry);
        // console.log(this.pov_team)

        setTimeout(() => {
            this.entries.removeChild(entry);
            this.reorderEntries();
        }, 8_000);
    }

    setTeam(team: Team) {
        this.pov_team = team;
    }
}
