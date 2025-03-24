import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useSettingsContext } from "../contexts/settingsContext";
import { MessageFormatElement, IntlProvider as ReactIntlIntlProvider } from "react-intl";

async function loadLocaleData(locale: string): Promise<Record<string, MessageFormatElement[]>> {
    switch (locale) {
        case "fi":
            return import("../compiled-lang/fi.json").then((file) => file.default);
        default:
            return import("../compiled-lang/en.json").then((file) => file.default);
    }
}

export const KNOWN_LOCALES = ["fi", "en"] as const;
export const DEFAULT_LOCALE = "en" satisfies KnownLocale;

export type KnownLocale = (typeof KNOWN_LOCALES)[number];

export const KNOWN_LOCALE_LABEL = {
    en: "English",
    fi: "Finnish (Suomi)",
} satisfies Record<KnownLocale, string>;

export const KNOWN_LOCALE_DROPDOWN_VALUES = Object.entries(KNOWN_LOCALE_LABEL).map(([locale, label]) => ({
    value: locale,
    label,
}));

export const IntlProvider: FC<PropsWithChildren> = ({ children }) => {
    const settings = useSettingsContext();
    const [messages, setMessages] = useState<Record<string, MessageFormatElement[]> | null>(null);
    const locale = settings.settings.locale ?? DEFAULT_LOCALE;

    useEffect(() => {
        loadLocaleData(locale).then(setMessages);
    }, [settings.settings.locale]);

    if (!messages) {
        return <div>Loading...</div>;
    }

    return (
        <ReactIntlIntlProvider onError={() => {}} defaultLocale={DEFAULT_LOCALE} locale={locale} messages={messages}>
            {children}
        </ReactIntlIntlProvider>
    );
};
