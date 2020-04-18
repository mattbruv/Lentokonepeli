import Cookies from "js-cookie";
import { English } from "./english";
import { Finnish } from "./finnish";
import { Translation } from "./translation";

export enum Language {
  English = "en",
  Finnish = "fi"
}

export const Languages = {
  [Language.English]: English,
  [Language.Finnish]: Finnish
};

class Localize {
  private language: Language;

  public constructor() {
    const cookie = Cookies.get("language");
    this.setLanguage(cookie as Language);
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

  public getLanguage(): string {
    return this.language;
  }

  public setLanguage(language: Language): void {
    if (Languages[language] === undefined) {
      this.language = Language.English;
    } else {
      this.language = language;
    }
    Cookies.set("language", language);
  }
}

export const Localizer = new Localize();
