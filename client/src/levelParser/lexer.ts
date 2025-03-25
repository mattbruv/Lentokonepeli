import { buildLexer } from "typescript-parsec";

export enum TokenKind {
    EOL,
    WhiteSpace,
    String,
    Eq,
}

export const lexer = buildLexer([
    [false, /^\s*/g, TokenKind.WhiteSpace],
    [false, /^\n/g, TokenKind.EOL],
    [true, /^=/g, TokenKind.Eq],
    [true, /^[^=\n]+/g, TokenKind.String],
]);
