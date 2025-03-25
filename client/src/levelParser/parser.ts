import { apply, kright, opt, rep, rule, seq, tok } from "typescript-parsec";
import * as Ast from "./ast";
import * as Lexer from "./lexer";
import { LayerWithOrdinal, LayoutPieces, literal, TimeWinnerValue } from "./lib";

const Name = rule<Lexer.TokenKind, Ast.NameNode>();
const Designer = rule<Lexer.TokenKind, Ast.DesignerNode>();
const Layer = rule<Lexer.TokenKind, Ast.LayerNode>();
const TimeWinner = rule<Lexer.TokenKind, Ast.TimeWinnerNode>();
const Level = rule<Lexer.TokenKind, Ast.LevelNode>();

Name.setPattern(apply(tok(Lexer.TokenKind.String), (token) => ({ kind: "Name", value: token.text })));

Designer.setPattern(
    apply(kright(seq(literal("designer"), tok(Lexer.TokenKind.Eq)), tok(Lexer.TokenKind.String)), (token) => ({
        kind: "Designer",
        value: token.text,
    })),
);

TimeWinner.setPattern(
    apply(kright(seq(literal("time_winner"), tok(Lexer.TokenKind.Eq)), TimeWinnerValue), (token) => ({
        kind: "TimeWinner" as const,
        value: token,
    })),
);

Layer.setPattern(
    apply(seq(LayerWithOrdinal, tok(Lexer.TokenKind.Eq), LayoutPieces), ([ordinal, _, pieces]) => ({
        kind: "Layer",
        ordinal,
        pieces,
    })),
);

Level.setPattern(
    apply(seq(Name, rep(Layer), Designer, opt(TimeWinner)), ([name, layers, designer, timeWinner]) => ({
        kind: "Level",
        timeWinner: timeWinner ?? null,
        name,
        designer,
        layers,
    })),
);

/** Parse lever string to AST */
export const parse = (str: string) => {
    const result = Level.parse(Lexer.lexer.parse(str));
    return result.successful ? result.candidates[0].result : result.error;
};
