import { describe, expect, it } from "vitest";
import Levels from "../../assets/levels.json";
import { LevelNode } from "../ast";
import { marshal } from "../marshal";
import { parse } from "../parser";

describe("Level Parser", () => {
    for (const [levelName, originalLevelString] of Object.entries(Levels)) {
        it(`should correctly parse and marshal level: ${levelName}`, () => {
            const ast = parse(originalLevelString);
            expect(ast.kind).not.toBe("Error");

            const marshaled = marshal(ast as LevelNode);
            const originalLines = originalLevelString.split("\n").filter(Boolean);
            const marshaledLines = marshaled.split("\n").filter(Boolean);

            expect(marshaledLines).toEqual(originalLines);
        });
    }
});
