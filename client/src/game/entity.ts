import { EntityType } from "../network/game/EntityType";

export interface Entity {
    readonly type: EntityType;
    update: (data: any) => void;
    destroy: () => void;
}
