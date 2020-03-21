import { English } from "./english";
import { Finnish } from "./finnish";

export interface Translation {
  teamChooserTitle: string;
  teamChooserDescription: string;
}

interface Dictionary {
  [key: string]: Translation;
}

class Localize {
  private dictionary: Dictionary;
  private language: string;

  public constructor() {
    this.dictionary = {
      en: English,
      fi: Finnish
    };
    this.language = "en";
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

  public setLanguage(language: string): void {
    this.language = language;
  }
}

export const Localizer = new Localize();
