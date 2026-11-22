import { ControllingEntity } from "dogfight-types/ControllingEntity";
import { PlayerProperties } from "dogfight-types/PlayerProperties";
import * as PIXI from "pixi.js";
import { Entity, EntityUpdateCallbacks } from "./entity";

type OnChangeControl = (
    previous: ControllingEntity | null,
    next: ControllingEntity | null,
    props: PlayerProperties,
) => void;

export class Player implements Entity<PlayerProperties> {
    public props: Required<PlayerProperties> = {
        guid: "",
        clan: null,
        controlling: null,
        name: "Undefined",
        state: "WaitingRespawn",
        team: null,
        kills: 0,
        deaths: 0,
        score: 0,
        respawn_seconds: 0,
        respawn_type: "Default",
        ready: false,
        accuracy: 0,
        ping: 0,
        last_runway: null,
        team_option: 1,
        selected_runway: null,
        selected_plane: 0,
    };

    private onChange: OnChangeControl;

    constructor(onControlChange: OnChangeControl) {
        this.onChange = onControlChange;
    }

    public getContainer(): PIXI.Container {
        return new PIXI.Container();
    }

    public updateCallbacks: EntityUpdateCallbacks<PlayerProperties> = {
        team: () => {},
        name: () => {},
        clan: () => {},
        state: () => {},
        guid: () => {},
        kills: () => {},
        deaths: () => {},
        score: () => {},
        respawn_seconds: () => {},
        respawn_type: () => {},
        ready: () => {},
        accuracy: () => {},
        ping: () => {},
        last_runway: () => {},
        team_option: () => {},
        selected_runway: () => {},
        selected_plane: () => {},
        controlling: (oldProps) => {
            if (oldProps.controlling !== undefined)
                this.onChange(oldProps.controlling, this.props.controlling, this.props);
        },
    };

    public destroy() {}
}
