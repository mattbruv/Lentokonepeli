import { EntityType } from "../network/game/EntityType";

export enum Direction {
    LEFT,
    RIGHT
}

export interface Entity {
    readonly type: EntityType;
    update: (data: any) => void;
    destroy: () => void;
}
