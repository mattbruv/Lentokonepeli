import { GameRules } from "dogfight-types/GameRules";
import { PlaneRules } from "dogfight-types/PlaneRules";
import { PlaneRulesByType } from "dogfight-types/PlaneRulesByType";
import { PlaneType } from "dogfight-types/PlaneType";
import { DogfightWeb } from "dogfight-web";
import { useEffect, useState } from "react";
import { defineMessages, IntlShape, MessageDescriptor } from "react-intl";
import { GAME_INTL } from "./intl/messages";

let engine: DogfightWeb | null = null;
let defaults: GameRules | null = null;

function rulesEngine(): DogfightWeb {
    engine ??= DogfightWeb.new();
    return engine;
}

export function defaultRules(): GameRules {
    defaults ??= JSON.parse(rulesEngine().default_rules()) as GameRules;
    return structuredClone(defaults);
}

export function sanitizeRules(rules: unknown): GameRules {
    try {
        return JSON.parse(rulesEngine().sanitize_rules(JSON.stringify(rules ?? {}))) as GameRules;
    } catch {
        return defaultRules();
    }
}

export const PLANE_TYPES: { key: keyof PlaneRulesByType; type: PlaneType }[] = [
    { key: "albatros", type: "Albatros" },
    { key: "junkers", type: "Junkers" },
    { key: "fokker", type: "Fokker" },
    { key: "bristol", type: "Bristol" },
    { key: "salmson", type: "Salmson" },
    { key: "sopwith", type: "Sopwith" },
];

type BooleanKeys<T> = { [K in keyof T]: T[K] extends boolean ? K : never }[keyof T];
type NumberKeys<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

export type RuleUnit = "percent" | "seconds" | "ms" | "count";

export type NumberRule<K> = {
    key: K;
    label: MessageDescriptor;
    unit: RuleUnit;
    min: number;
    max: number;
    step: number;
};

export type BooleanRule = { key: BooleanKeys<GameRules>; label: MessageDescriptor };

const M = defineMessages({
    plane_guns: { defaultMessage: "Plane guns", description: "Game rule: planes can fire their machine guns" },
    bombs: { defaultMessage: "Bombing", description: "Game rule: planes can drop bombs" },
    pilot_guns: { defaultMessage: "Pilot pistols", description: "Game rule: pilots on foot can shoot" },
    bail_out: { defaultMessage: "Bailing out", description: "Game rule: pilots can jump out of their plane" },
    friendly_fire: {
        defaultMessage: "Friendly fire",
        description: "Game rule: players can damage their own team's players and buildings",
    },
    plane_collisions: {
        defaultMessage: "Plane collisions",
        description: "Game rule: planes can crash into each other",
    },
    unlimited_ammo: { defaultMessage: "Unlimited ammo", description: "Game rule: planes never run out of bullets" },
    unlimited_fuel: { defaultMessage: "Unlimited fuel", description: "Game rule: planes never run out of fuel" },
    unlimited_bombs: { defaultMessage: "Unlimited bombs", description: "Game rule: planes never run out of bombs" },
    indestructible_buildings: {
        defaultMessage: "Indestructible buildings",
        description: "Game rule: runways and headquarters cannot be damaged",
    },
    damage_percent: { defaultMessage: "Damage", description: "Game rule: multiplier for all damage dealt" },
    runway_health: { defaultMessage: "Runway health", description: "Game rule: how much damage a runway can take" },
    headquarters_health: {
        defaultMessage: "Headquarters health",
        description: "Game rule: how much damage a headquarters building can take",
    },
    repair_ticks: {
        defaultMessage: "Repair time per health point",
        description: "Game rule: seconds for a damaged building to regain one health point, 0 turns repairs off",
    },
    runway_delay_percent: {
        defaultMessage: "Runway takeoff/landing delay",
        description: "Game rule: multiplier for how long a runway is blocked after a takeoff or landing",
    },
    respawn_ticks: { defaultMessage: "Respawn time", description: "Game rule: seconds to wait before respawning" },
    suicide_respawn_ticks: {
        defaultMessage: "Respawn time after suicide",
        description: "Game rule: seconds to wait before respawning after killing yourself",
    },
    team_kill_respawn_ticks: {
        defaultMessage: "Respawn time after team kill",
        description: "Game rule: seconds to wait before respawning after killing a teammate",
    },
    pilot_invulnerability_ms: {
        defaultMessage: "Pilot spawn protection",
        description: "Game rule: milliseconds a pilot cannot be run over after bailing out",
    },
    pilot_shoot_delay_ms: {
        defaultMessage: "Pilot fire delay",
        description: "Game rule: milliseconds between pistol shots for pilots on foot",
    },
    allowed: { defaultMessage: "Allowed", description: "Plane rule: whether players may pick this plane" },
    health: { defaultMessage: "Health", description: "Plane rule: how much damage the plane can take" },
    ammo: { defaultMessage: "Ammo", description: "Plane rule: number of bullets the plane carries" },
    fuel: { defaultMessage: "Fuel", description: "Plane rule: amount of fuel the plane carries" },
    plane_bombs: { defaultMessage: "Bombs", description: "Plane rule: number of bombs the plane carries" },
    shoot_delay_ms: {
        defaultMessage: "Fire delay",
        description: "Plane rule: milliseconds between machine gun shots",
    },
    bomb_delay_ms: { defaultMessage: "Bomb delay", description: "Plane rule: milliseconds between dropped bombs" },
    acceleration_percent: { defaultMessage: "Acceleration", description: "Plane rule: engine acceleration multiplier" },
    turn_percent: { defaultMessage: "Turn rate", description: "Plane rule: turning speed multiplier" },
    speed_bonus: {
        defaultMessage: "Top speed bonus",
        description: "Plane rule: extra top speed before air resistance slows the plane",
    },
    original_value: {
        defaultMessage: "Original: {value}",
        description: "Hint under a changed game rule showing the original game's value",
    },
    on: { defaultMessage: "on", description: "Value shown for a game rule that is switched on" },
    off: { defaultMessage: "off", description: "Value shown for a game rule that is switched off" },
    not_allowed: { defaultMessage: "not allowed", description: "Value shown for a plane that players cannot pick" },
    change: {
        defaultMessage: "{label}: {value} (normally {original})",
        description: "One changed game rule, showing its new value and the original game's value",
    },
    toggle: {
        defaultMessage: "{label}: {value}",
        description: "One game rule that has been switched on or off",
    },
    plane_change: {
        defaultMessage: "{plane} {label}: {value} (normally {original})",
        description: "One changed plane rule, showing the plane name, new value and the original game's value",
    },
    plane_toggle: {
        defaultMessage: "{plane}: {value}",
        description: "A plane that players are not allowed to pick",
    },
});

export const RULE_MESSAGES = M;

export const WEAPON_RULES: BooleanRule[] = [
    { key: "plane_guns", label: M.plane_guns },
    { key: "bombs", label: M.bombs },
    { key: "pilot_guns", label: M.pilot_guns },
    { key: "bail_out", label: M.bail_out },
    { key: "friendly_fire", label: M.friendly_fire },
    { key: "plane_collisions", label: M.plane_collisions },
    { key: "unlimited_ammo", label: M.unlimited_ammo },
    { key: "unlimited_fuel", label: M.unlimited_fuel },
    { key: "unlimited_bombs", label: M.unlimited_bombs },
];

export const DAMAGE_RULES: NumberRule<NumberKeys<GameRules>>[] = [
    { key: "damage_percent", label: M.damage_percent, unit: "percent", min: 0, max: 1000, step: 10 },
];

export const BUILDING_TOGGLES: BooleanRule[] = [{ key: "indestructible_buildings", label: M.indestructible_buildings }];

export const BUILDING_RULES: NumberRule<NumberKeys<GameRules>>[] = [
    { key: "runway_health", label: M.runway_health, unit: "count", min: 1, max: 20000, step: 50 },
    { key: "headquarters_health", label: M.headquarters_health, unit: "count", min: 1, max: 20000, step: 25 },
    { key: "repair_ticks", label: M.repair_ticks, unit: "seconds", min: 0, max: 1000, step: 10 },
    { key: "runway_delay_percent", label: M.runway_delay_percent, unit: "percent", min: 0, max: 500, step: 10 },
];

export const RESPAWN_RULES: NumberRule<NumberKeys<GameRules>>[] = [
    { key: "respawn_ticks", label: M.respawn_ticks, unit: "seconds", min: 0, max: 6000, step: 50 },
    { key: "suicide_respawn_ticks", label: M.suicide_respawn_ticks, unit: "seconds", min: 0, max: 6000, step: 50 },
    { key: "team_kill_respawn_ticks", label: M.team_kill_respawn_ticks, unit: "seconds", min: 0, max: 6000, step: 50 },
    { key: "pilot_invulnerability_ms", label: M.pilot_invulnerability_ms, unit: "ms", min: 0, max: 2000, step: 50 },
    { key: "pilot_shoot_delay_ms", label: M.pilot_shoot_delay_ms, unit: "ms", min: 100, max: 5000, step: 50 },
];

export const PLANE_RULES: NumberRule<NumberKeys<PlaneRules>>[] = [
    { key: "health", label: M.health, unit: "count", min: 1, max: 10000, step: 5 },
    { key: "ammo", label: M.ammo, unit: "count", min: 1, max: 999, step: 5 },
    { key: "fuel", label: M.fuel, unit: "count", min: 1, max: 999, step: 5 },
    { key: "bombs", label: M.plane_bombs, unit: "count", min: 0, max: 50, step: 1 },
    { key: "shoot_delay_ms", label: M.shoot_delay_ms, unit: "ms", min: 10, max: 2000, step: 10 },
    { key: "bomb_delay_ms", label: M.bomb_delay_ms, unit: "ms", min: 50, max: 5000, step: 50 },
    { key: "acceleration_percent", label: M.acceleration_percent, unit: "percent", min: 25, max: 300, step: 5 },
    { key: "turn_percent", label: M.turn_percent, unit: "percent", min: 25, max: 300, step: 5 },
    { key: "speed_bonus", label: M.speed_bonus, unit: "count", min: 0, max: 200, step: 5 },
];

export function toDisplay(unit: RuleUnit, value: number): number {
    return unit === "seconds" ? value / 100 : value;
}

export function fromDisplay(unit: RuleUnit, value: number): number {
    return unit === "seconds" ? Math.round(value * 100) : Math.round(value);
}

export function formatRuleValue(intl: IntlShape, unit: RuleUnit, value: number): string {
    const shown = toDisplay(unit, value);
    if (unit === "percent") return intl.formatNumber(shown / 100, { style: "percent" });
    if (unit === "seconds") return intl.formatNumber(shown, { style: "unit", unit: "second", unitDisplay: "short" });
    if (unit === "ms") return intl.formatNumber(shown, { style: "unit", unit: "millisecond", unitDisplay: "short" });
    return intl.formatNumber(shown);
}

export function planeName(intl: IntlShape, type: PlaneType): string {
    return intl.formatMessage(GAME_INTL[`plane_name_${type}`]);
}

export function describeRuleChanges(intl: IntlShape, rules: GameRules): string[] {
    const original = defaultRules();
    const changes: string[] = [];

    for (const rule of [...WEAPON_RULES, ...BUILDING_TOGGLES]) {
        if (rules[rule.key] === original[rule.key]) continue;
        changes.push(
            intl.formatMessage(M.toggle, {
                label: intl.formatMessage(rule.label),
                value: intl.formatMessage(rules[rule.key] ? M.on : M.off),
            }),
        );
    }

    for (const rule of [...DAMAGE_RULES, ...BUILDING_RULES, ...RESPAWN_RULES]) {
        if (rules[rule.key] === original[rule.key]) continue;
        changes.push(
            intl.formatMessage(M.change, {
                label: intl.formatMessage(rule.label),
                value: formatRuleValue(intl, rule.unit, rules[rule.key]),
                original: formatRuleValue(intl, rule.unit, original[rule.key]),
            }),
        );
    }

    for (const { key, type } of PLANE_TYPES) {
        const plane = rules.planes[key];
        const base = original.planes[key];
        const name = planeName(intl, type);
        if (!plane.allowed) {
            changes.push(intl.formatMessage(M.plane_toggle, { plane: name, value: intl.formatMessage(M.not_allowed) }));
            continue;
        }
        for (const rule of PLANE_RULES) {
            if (plane[rule.key] === base[rule.key]) continue;
            changes.push(
                intl.formatMessage(M.plane_change, {
                    plane: name,
                    label: intl.formatMessage(rule.label),
                    value: formatRuleValue(intl, rule.unit, plane[rule.key]),
                    original: formatRuleValue(intl, rule.unit, base[rule.key]),
                }),
            );
        }
    }

    return changes;
}

export function isDefaultRules(rules: GameRules): boolean {
    return JSON.stringify(sanitizeRules(rules)) === JSON.stringify(defaultRules());
}

const PRESETS_KEY = "dogfightRulePresets_v1";
const PRESETS_EVENT = "dogfight-rule-presets";

export type RulePresets = Record<string, GameRules>;

export function getRulePresets(): RulePresets {
    try {
        const stored = localStorage.getItem(PRESETS_KEY);
        if (!stored) return {};
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
        return Object.fromEntries(
            Object.entries(parsed)
                .filter(([name, value]) => name.length > 0 && typeof value === "object" && value !== null)
                .map(([name, value]) => [name, sanitizeRules(value)]),
        );
    } catch {
        return {};
    }
}

function writeRulePresets(presets: RulePresets): boolean {
    try {
        localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
        window.dispatchEvent(new Event(PRESETS_EVENT));
        return true;
    } catch {
        return false;
    }
}

export const PRESET_NAME_MAX_LENGTH = 32;

export function saveRulePreset(name: string, rules: GameRules): boolean {
    const trimmed = name.trim().slice(0, PRESET_NAME_MAX_LENGTH);
    if (!trimmed) return false;
    return writeRulePresets({ ...getRulePresets(), [trimmed]: sanitizeRules(rules) });
}

export function deleteRulePreset(name: string): boolean {
    const presets = getRulePresets();
    delete presets[name];
    return writeRulePresets(presets);
}

export function useRulePresets(): RulePresets {
    const [presets, setPresets] = useState<RulePresets>(getRulePresets);

    useEffect(() => {
        const refresh = () => setPresets(getRulePresets());
        const onStorage = (event: StorageEvent) => {
            if (event.key === PRESETS_KEY) refresh();
        };
        window.addEventListener(PRESETS_EVENT, refresh);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener(PRESETS_EVENT, refresh);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    return presets;
}
