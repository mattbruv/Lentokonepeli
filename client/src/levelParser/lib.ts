import { combine, fail, Parser, succ, tok, Token } from "typescript-parsec";
import { TokenKind } from "./lexer";
import { KNOWN_LAYOUT_PIECES, KNOWN_TIME_WINNERS, LayoutPiece, TimeWinner } from "./spec";

/** Parse exact string tokens */
export const literal = (toMatch: string): Parser<TokenKind, Token<TokenKind.String>> =>
    combine(tok(TokenKind.String), (token) =>
        token.text === toMatch ? succ(token) : fail(`Expected literal "${toMatch}", got "${token.text}"`),
    );

/** Parse known level layout pieces */
export const LayoutPieces: Parser<TokenKind, LayoutPiece[]> = combine(tok(TokenKind.String), (token) => {
    const pieces = stringToLayoutPieces(token.text);
    if (!pieces.length) {
        return fail("Layer has no known pieces");
    }
    return succ(pieces);
});

/** Parse layer name  */
export const LayerWithOrdinal: Parser<TokenKind, number> = combine(tok(TokenKind.String), (token) => {
    const ordinal = layerNameToOrdinal(token.text);
    if (ordinal === null) {
        return fail(`Expected layer<int>, got "${token.text}"`);
    }
    return succ(ordinal);
});

/** Parse value for time_winner */
export const TimeWinnerValue: Parser<TokenKind, TimeWinner> = combine(tok(TokenKind.String), (token) => {
    const value = token.text as TimeWinner;
    return KNOWN_TIME_WINNERS.includes(value) ? succ(value) : fail(`Received unknown time_winner value "${value}"`);
});

const stringToLayoutPieces = (str: string): LayoutPiece[] => {
    const pieces: LayoutPiece[] = [];
    let text = str;
    nextToken: while (text) {
        for (const piece of KNOWN_LAYOUT_PIECES) {
            if (text.startsWith(piece)) {
                pieces.push(piece);
                text = text.slice(piece.length);
                continue nextToken;
            }
        }
        text = text.slice(1);
    }
    return pieces;
};

const layerNameToOrdinal = (str: string): number | null => {
    if (!str.startsWith("layer")) return null;
    const n = str.slice("layer".length);
    const int = parseInt(n);
    if (isNaN(int)) return null;
    return int;
};
