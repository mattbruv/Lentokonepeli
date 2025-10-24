import { WorldInfoProperties } from "dogfight-types/WorldInfoProperties";
import * as PIXI from "pixi.js";
import { Entity, EntityUpdateCallbacks } from "./entity";

export class WorldInfo implements Entity<WorldInfoProperties> {
    public props: Required<WorldInfoProperties> = {
        state: "Intermission",
        winner: "Allies",
        time_total_ms: 0,
        client_time_ms: 0,
    };

    constructor() {}

    public getContainer(): PIXI.Container {
        return new PIXI.Container();
    }

    public updateCallbacks: EntityUpdateCallbacks<WorldInfoProperties> = {
        state: () => {},
        winner: () => {},
        client_time_ms: () => {
            console.log("curr time!: ", this.props.client_time_ms);
        },
        time_total_ms: () => {
            console.log("total time!: ", this.props.time_total_ms);
        },
    };

    public destroy() {}
}
