import { FC, PropsWithChildren, useEffect, useState } from "react";
import { MessageFormatElement, IntlProvider as ReactIntlIntlProvider } from "react-intl";
import { useSettingsContext } from "../contexts/settingsContext";

const loadLocaleData = (locale: string): Promise<Record<string, MessageFormatElement[]>> =>
    import(`../compiled-lang/${locale}.json`).then((file) => file.default);

export const KNOWN_LOCALES = ["en", "fi", "es"] as const;
const DEFAULT_LOCALE = "en" satisfies KnownLocale;
export type KnownLocale = (typeof KNOWN_LOCALES)[number];

function isKnownLocale(locale: string): locale is KnownLocale {
    return KNOWN_LOCALES.includes(locale as KnownLocale);
}

/**
 * Gets the users locale from their browser if it has a translation available,
 * or sets English as the default.
 */
export function getDefaultLocale(): KnownLocale {
    const lang = navigator.languages.find(isKnownLocale);
    return lang ?? DEFAULT_LOCALE;
}

export const KNOWN_LOCALE_LABEL = {
    en: "English",
    fi: "Finnish (Suomi)",
    es: "Spanish (Español)",
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
