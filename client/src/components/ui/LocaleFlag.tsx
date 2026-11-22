import { useId } from "react";
import { KnownLocale } from "../../intl/IntlProvider";
import classes from "./LocaleFlag.module.css";

function UnitedKingdom() {
    const id = useId();
    return (
        <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
            <clipPath id={`${id}-s`}>
                <path d="M0,0 v30 h60 v-30 z" />
            </clipPath>
            <clipPath id={`${id}-t`}>
                <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
            </clipPath>
            <g clipPath={`url(#${id}-s)`}>
                <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}-t)`} stroke="#C8102E" strokeWidth="4" />
                <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
            </g>
        </svg>
    );
}

function Finland() {
    return (
        <svg viewBox="0 0 18 11" preserveAspectRatio="xMidYMid slice">
            <rect width="18" height="11" fill="#fff" />
            <rect x="5" width="3" height="11" fill="#002F6C" />
            <rect y="4" width="18" height="3" fill="#002F6C" />
        </svg>
    );
}

function Spain() {
    return (
        <svg viewBox="0 0 750 500" preserveAspectRatio="xMidYMid slice">
            <rect width="750" height="500" fill="#AA151B" />
            <rect y="125" width="750" height="250" fill="#F1BF00" />
        </svg>
    );
}

const FLAGS: Record<KnownLocale, () => JSX.Element> = {
    en: UnitedKingdom,
    fi: Finland,
    es: Spain,
};

export function LocaleFlag({ locale }: { locale?: string | null }) {
    const Flag = locale && locale in FLAGS ? FLAGS[locale as KnownLocale] : null;
    if (!Flag) return null;
    return (
        <span className={classes.flag} aria-hidden>
            <Flag />
        </span>
    );
}
