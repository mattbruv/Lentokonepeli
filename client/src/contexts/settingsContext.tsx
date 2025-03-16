import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";
import React, { createContext, useContext, useEffect, useState } from "react";
import { randomGuid } from "../helpers";

export type GameKey = keyof PlayerKeyboard;

export type DogfightControls = Record<GameKey, string[]>;

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

export const SETTINGS_KEY = "dogfightSettings";

export const SettingsContext = createContext<DogfightSettingsContext | null>(null);

export function useSettingsContext(): DogfightSettingsContext {
    const settingsContext = useContext(SettingsContext);

    if (settingsContext === null) {
        throw new Error("SettingsContext not provided in useSettingsContext");
    }

    return settingsContext;
}

// https://www.toptal.com/developers/keycode
export function getDefaultControls(): DogfightControls {
    return {
        left: ["ArrowLeft"],
        right: ["ArrowRight"],
        up: ["ArrowUp"],
        down: ["ArrowDown"],
        space: [" "],
        shift: ["Shift", "."],
        ctrl: ["Control", "-"],
        enter: ["Enter"],
    };
}

// Provider component
export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<DogfightSettings>(() => {
        // Read from localStorage on first render
        const storedSettings = localStorage.getItem("dogfightSettings");

        const settings: DogfightSettings = storedSettings
            ? (JSON.parse(storedSettings) as DogfightSettings)
            : {
                  controls: getDefaultControls(),
              };

        return settings;
    });

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
        localStorage.setItem("dogfightSettings", JSON.stringify(settings));
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, setSettings, getUsername, getClan }}>
            {children}
        </SettingsContext.Provider>
    );
}
