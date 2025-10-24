import { WorldInfoProperties } from "dogfight-types/WorldInfoProperties";
import * as PIXI from "pixi.js";
import { Entity, EntityUpdateCallbacks } from "./entity";

type WorldCallbacks = {
    setTotalTimeMs: (time: number) => void;
    setCurrentTimeMs: (time: number) => void;
};

export class WorldInfo implements Entity<WorldInfoProperties> {
    public props: Required<WorldInfoProperties> = {
        state: "Intermission",
        winner: "Allies",
        time_total_ms: 0,
        client_time_ms: 0,
    };

    private callbacks: WorldCallbacks;

    constructor(callbacks: WorldCallbacks) {
        this.callbacks = callbacks;
    }

    public getContainer(): PIXI.Container {
        return new PIXI.Container();
    }

    public updateCallbacks: EntityUpdateCallbacks<WorldInfoProperties> = {
        state: () => {},
        winner: () => {},
        client_time_ms: () => {
            this.callbacks.setCurrentTimeMs(this.props.client_time_ms);
        },
        time_total_ms: () => {
            this.callbacks.setTotalTimeMs(this.props.time_total_ms);
        },
    };

    public destroy() {}
}
