import { useEffect, useRef } from "react";
import { isValidClan, isValidName, useSettingsContext } from "../contexts/settingsContext";

export function useRenameOnSettingsChange(rename: (name: string, clan: string | null) => void) {
    const { settings } = useSettingsContext();
    const sent = useRef({ username: settings.username, clan: settings.clan });

    useEffect(() => {
        const { username, clan } = settings;
        if (username === sent.current.username && clan === sent.current.clan) return;
        sent.current = { username, clan };

        const name = username?.trim() ?? "";
        if (!isValidName(name)) return;
        const clanTag = clan?.trim() ?? "";
        rename(name, clanTag && isValidClan(clanTag) ? clanTag : null);
    }, [settings.username, settings.clan]);
}
