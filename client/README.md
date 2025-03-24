# Lentokonepeli client

## Translations

Project uses react-intl for the copies, they can be extracted automatically and translated.

### Add new language to translate

Find your two-digit language code here: https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes

1. add new locale to `LOCALES_TO_TRANSLATE` in `./update_translations.py`
2. run `python3 ./update_translations.py`
3. add new locale to `KNOWN_LOCALES` in `./src/intl/IntlProvider.tsx`
4. ready to translate as per instructions below

### Translating copies for locale

1. make translation files up to date by running `python3 ./update_translations.py`
2. translate copies generated into `lang/<locale>.json`
3. run `python3 ./update_translations.py` again
