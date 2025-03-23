import React, { createContext, MutableRefObject, useContext, useEffect, useRef, useState } from "react";
import { ChatMode } from "../components/Chat";
import { randomGuid } from "../helpers";
import { GameAction, Keybind } from "../hooks/keybinds/models";
import { soundManager } from "../client/soundManager";

export type DogfightControls = Keybind<GameAction>[];

export type DogfightSettings = {
    username?: string;
    clan?: string;
    // Maps a series of keyboard keys to a game action
    controls: DogfightControls;
    audioSettings: {
        muted: boolean;
    };
};

export type GlobalState = {
    viewingScoreboard: boolean;
    chatState: ChatMode;
};

export function isValidName(name: string): boolean {
    return name.length >= 3 && name.length <= 20;
}

export function isValidClan(clan: string): boolean {
    return clan.length <= 5;
}

export type DogfightSettingsContext = {
    settings: DogfightSettings;
    globalState: GlobalState;
    setSettings: React.Dispatch<React.SetStateAction<DogfightSettings>>;
    setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>;
    sendChatMessage: MutableRefObject<(() => void) | null>;
    getUsername: () => string;
    getClan: () => string;
};

export const SETTINGS_KEY = "dogfightSettings_v3" as const;

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
    { key: "y", action: "chatAll" },
    { key: "u", action: "chatTeam" },
    { key: "tab", action: "viewScoreboard" },
    { key: "m", action: "toggleMute" },
];

export const DEFAULT_SETTINGS: DogfightSettings = {
    controls: DEFAULT_GAME_KEYBINDS,
    audioSettings: {
        muted: false,
    },
};

export const SETTING_DESCRIPTIONS = {
    left: "Move Left",
    right: "Move Right",
    down: "Toggle Motor",
    up: "Flip Plane",
    shift: "Bomb",
    space: "Eject, Open Parachute",
    enter: "Enter",
    ctrl: "Shoot",
    chatAll: "Chat All",
    chatTeam: "Chat Team",
    viewScoreboard: "View Scoreboard",
    toggleMute: "Toggle Game Sounds",
} as const satisfies Record<GameAction, string>;

/**
 * This fn can be used to migrate old setting versions to new.
 * So if old settings don't have some new setting, we can implement some merging strategy for it here.
 * If merging seems too complex, one can just update the SETTINGS_KEY,
 * so old user defined settings will be reset if they are from some old version
 */
const mergeSettings = (overrides: Partial<DogfightSettings>) => {
    return { ...DEFAULT_SETTINGS, ...overrides };
};

const getInitialSettings = (): DogfightSettings => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (!storedSettings) return DEFAULT_SETTINGS;
    try {
        const parsed = JSON.parse(storedSettings) as DogfightSettings;
        const merged = mergeSettings(parsed);
        return merged;
    } catch {
        return DEFAULT_SETTINGS;
    }
};

const getInitialGlobalState = (): GlobalState => ({
    viewingScoreboard: false,
    chatState: ChatMode.Passive,
});

// Provider component
export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState(getInitialSettings);
    const [globalState, setGlobalState] = useState(getInitialGlobalState);
    const sendChatMessage = useRef<(() => void) | null>(null);

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
        soundManager.setIsMuted(settings.audioSettings.muted);
    }, [settings]);

    return (
        <SettingsContext.Provider
            value={{ settings, setSettings, sendChatMessage, globalState, setGlobalState, getUsername, getClan }}
        >
            {children}
        </SettingsContext.Provider>
    );
}
