import Cookies from "js-cookie";
import { English } from "./english";
import { Finnish } from "./finnish";
import { Translation } from "./translation";

interface Dictionary {
  [key: string]: Translation;
}

class Localize {
  public dictionary: Dictionary;
  private language: string;

  public constructor() {
    this.dictionary = {
      en: English,
      fi: Finnish
    };
    const cookie = Cookies.get("language");
    if (cookie !== undefined) {
      this.setLanguage(cookie);
    } else {
      this.setLanguage("en");
    }
  }

  public get(phrase: keyof Translation, params?: any): string {
    let str = this.dictionary[this.language][phrase];
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

  public setLanguage(language: string): void {
    if (this.dictionary[language] === undefined) {
      this.language = "en";
    } else {
      this.language = language;
    }
    Cookies.set("language", language);
  }
}

export const Localizer = new Localize();
