# Lentokonepeli client

## Translations

Project uses react-intl for the copies, they can be extracted automatically and translated.


### Add new language to translate

1. add new locale to `LOCALES_TO_TRANSLATE` in `./update_translation_files.sh`
2. run `./update_translation_files.sh`
3. add new locale to `KNOWN_LOCALES` in `./src/intl/IntlProvider.tsx`
4. ready to translate as per instructions below

### Translating copies for locale

1. make translation files up to date by running `./update_translation_files.sh`
2. translate copies generated into `lang/<locale>.json`
3. run `./update_translation_files.sh` again

