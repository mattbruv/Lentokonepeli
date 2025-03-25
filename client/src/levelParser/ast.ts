import { MapPiece, TimeWinner } from "./spec";

export type LevelNode = {
    kind: "Level";
    name: NameNode;
    designer: DesignerNode;
    layers: LayerNode[];
    timeWinner: TimeWinnerNode | null;
};

export type NameNode = {
    kind: "Name";
    value: string;
};

export type LayerNode = {
    kind: "Layer";
    ordinal: number;
    pieces: MapPiece[];
};

export type DesignerNode = {
    kind: "Designer";
    value: string;
};

export type TimeWinnerNode = {
    kind: "TimeWinner";
    value: TimeWinner;
};

export type Node = LevelNode | NameNode | LayerNode | DesignerNode | TimeWinnerNode;
