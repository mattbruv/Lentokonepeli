import React, { createContext, useContext, useEffect, useState } from "react";
import { randomGuid } from "../helpers";
import { GameAction, Keybind } from "../hooks/keybinds/models";

export type DogfightControls = Keybind<GameAction>[];

export type DogfightSettings = {
    username?: string;
    clan?: string;

    // Maps a series of keyboard keys to a game action
    controls: DogfightControls;
};

export function isValidName(name: string): boolean {
    return name.length >= 3 && name.length <= 20;
}

export function isValidClan(clan: string): boolean {
    return clan.length <= 5;
}

export type DogfightSettingsContext = {
    settings: DogfightSettings;
    setSettings: React.Dispatch<React.SetStateAction<DogfightSettings>>;
    getUsername: () => string;
    getClan: () => string;
};

export const SETTINGS_KEY = "dogfightSettings_v2";

export const SettingsContext = createContext<DogfightSettingsContext | null>(null);

export function useSettingsContext(): DogfightSettingsContext {
    const settingsContext = useContext(SettingsContext);

    if (settingsContext === null) {
        throw new Error("SettingsContext not provided in useSettingsContext");
    }

    return settingsContext;
}

// https://www.toptal.com/developers/keycode
export const DEFAULT_GAME_KEYBINDS: DogfightControls = [
    { key: "ArrowLeft", action: "left" },
    { key: "ArrowRight", action: "right" },
    { key: "ArrowUp", action: "up" },
    { key: "ArrowDown", action: "down" },
    { key: " ", action: "space" },
    { key: "Shift", action: "shift" },
    { key: ".", action: "shift" },
    { key: "Control", action: "ctrl" },
    { key: "-", action: "ctrl" },
    { key: "Enter", action: "enter" },
];

export const DEFAULT_SETTINGS: DogfightSettings = {
    controls: DEFAULT_GAME_KEYBINDS,
};

const getInitialSettings = (): DogfightSettings => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (!storedSettings) return DEFAULT_SETTINGS;
    try {
        const parsed = JSON.parse(storedSettings) as DogfightSettings;
        return parsed;
    } catch {
        return DEFAULT_SETTINGS;
    }
};

// Provider component
export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState(getInitialSettings);

    function getUsername(): string {
        if (settings.username?.trim() && isValidName(settings.username.trim())) {
            return settings.username.trim();
        }
        return "~Guest#" + randomGuid().substring(0, 4);
    }

    function getClan(): string {
        if (settings.clan?.trim() && isValidName(settings.clan.trim())) {
            return settings.clan.trim();
        }
        return "";
    }

    // Update localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, setSettings, getUsername, getClan }}>
            {children}
        </SettingsContext.Provider>
    );
}
