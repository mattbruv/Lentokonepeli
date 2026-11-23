import { useEffect, useState } from "react";
import Levels from "./assets/levels.json";

const CUSTOM_LEVELS_KEY = "dogfightCustomLevels_v1";
const CUSTOM_LEVELS_EVENT = "dogfight-custom-levels";

export type CustomLevels = Record<string, string>;

export function customLevelName(world: string): string {
    return world.split("\n")[0].trim();
}

export function getCustomLevels(): CustomLevels {
    try {
        const stored = localStorage.getItem(CUSTOM_LEVELS_KEY);
        if (!stored) return {};
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
        return Object.fromEntries(
            Object.entries(parsed).filter(
                (entry): entry is [string, string] => typeof entry[1] === "string" && entry[0].length > 0,
            ),
        );
    } catch {
        return {};
    }
}

function writeCustomLevels(levels: CustomLevels): boolean {
    try {
        localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(levels));
        window.dispatchEvent(new Event(CUSTOM_LEVELS_EVENT));
        return true;
    } catch {
        return false;
    }
}

export function saveCustomLevel(world: string): boolean {
    const name = customLevelName(world);
    if (!name) return false;
    return writeCustomLevels({ ...getCustomLevels(), [name]: world });
}

export function deleteCustomLevel(name: string): boolean {
    const levels = getCustomLevels();
    delete levels[name];
    return writeCustomLevels(levels);
}

export function useCustomLevels(): CustomLevels {
    const [levels, setLevels] = useState<CustomLevels>(getCustomLevels);

    useEffect(() => {
        const refresh = () => setLevels(getCustomLevels());
        const onStorage = (event: StorageEvent) => {
            if (event.key === CUSTOM_LEVELS_KEY) refresh();
        };
        window.addEventListener(CUSTOM_LEVELS_EVENT, refresh);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener(CUSTOM_LEVELS_EVENT, refresh);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    return levels;
}

export const CUSTOM_LEVEL_PREFIX = "custom:";

export type LevelName = keyof typeof Levels;

export type ResolvedLevel = { key: string; name: string; data: string };

export function resolveLevel(key: string, customLevels: CustomLevels): ResolvedLevel {
    if (key.startsWith(CUSTOM_LEVEL_PREFIX)) {
        const name = key.slice(CUSTOM_LEVEL_PREFIX.length);
        const data = customLevels[name];
        if (data) return { key, name, data };
    } else if (key in Levels) {
        return { key, name: key, data: Levels[key as LevelName] };
    }
    return { key: "classic", name: "classic", data: Levels.classic };
}
