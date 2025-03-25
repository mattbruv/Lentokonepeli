import * as ast from "./ast";

const LINE_BREAK = "\n";

const name = (name: ast.NameNode) => `${name.value}`;
const layer = (layer: ast.LayerNode, i: number) => `layer${i + 1}=${layer.pieces.join("")}`;
const layers = (layers: ast.LayerNode[]) => layers.map(layer).join(LINE_BREAK);
const designer = (designer: ast.DesignerNode) => `designer=${designer.value}`;
const time_winner = (timeWinner: ast.TimeWinnerNode | null) => (timeWinner ? `time_winner=${timeWinner.value}` : "");

/** Convert level back to string form */
export const marshal = (level: ast.LevelNode): string =>
    [name(level.name), layers(level.layers), designer(level.designer), time_winner(level.timeWinner)].join(LINE_BREAK);
