import { EntityType } from "./entity";

export enum StateAction {
  Create,
  Update,
  Delete
}

export interface Properties {
  [key: string]: number; // or | some other basic serializable types
}

export interface State {
  id: number;
  action: StateAction;
  type: EntityType; // or | some other types?
  properties: Properties;
}
