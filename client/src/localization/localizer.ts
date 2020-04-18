import Cookies from "js-cookie";
import { English } from "./english";
import { Finnish } from "./finnish";
import { Translation } from "./translation";
import { German } from "./german";

export enum Language {
  English = "en",
  Finnish = "fi",
  German = "de"
}

export const Languages = {
  [Language.English]: English,
  [Language.Finnish]: Finnish,
  [Language.German]: German
};

class Localize {
  private language: Language;

  public constructor() {
    const langs = Object.values(Language);
    const cookieLang = Cookies.get("language") as Language;
    const browserLang = window.navigator.language.slice(0, 2) as Language;
    if (langs.includes(cookieLang)) {
      this.setLanguage(cookieLang);
    } else {
      console.log(
        "Attempting to set language to browser language:",
        browserLang
      );
      this.setLanguage(browserLang);
    }
  }

  public get(phrase: keyof Translation, params?: any): string {
    return this.getString(this.language, phrase, params);
  }

  public getString(
    lang: Language,
    phrase: keyof Translation,
    params?: any
  ): string {
    let str = Languages[lang][phrase];
    if (params !== undefined) {
      for (const key in params) {
        str = str.replace(`{{${key}}}`, params[key]);
      }
    }
    return str;
  }

  public getLanguage(): Language {
    return this.language;
  }

  public setLanguage(language: Language): void {
    if (Languages[language] === undefined) {
      this.language = Language.English;
    } else {
      this.language = language;
    }
    Cookies.set("language", this.language, { expires: 9999 });
  }
}

export const Localizer = new Localize();
