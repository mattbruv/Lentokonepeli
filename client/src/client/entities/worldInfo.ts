import { Entity, EntityUpdateCallbacks } from "./entity";
import * as PIXI from "pixi.js";
import { WorldInfoProperties } from "dogfight-types/WorldInfoProperties";

export class WorldInfo implements Entity<WorldInfoProperties> {
    public props: Required<WorldInfoProperties> = {
        state: "Intermission",
        winner: "Allies",
        centrals_score: 0,
        allies_score: 0,
        time_left: null,
    };

    constructor() {}

    public getContainer(): PIXI.Container {
        return new PIXI.Container();
    }

    public updateCallbacks: EntityUpdateCallbacks<WorldInfoProperties> = {
        state: () => {},
        winner: () => {},
        centrals_score: () => {},
        allies_score: () => {},
        time_left: () => {},
    };

    public destroy() {}
}
