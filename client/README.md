# Lentokonepeli client

## Translations

Project uses react-intl for the copies, they can be extracted automatically and translated.

### Process

TODO: fill further once process is clearer

1. Extract messages from react code

- `npm run extract`

2. Copy created `default.json` file to `<some_locale>.json`
3. Translate stuff
4. Compile translations into app

- `npm run compile -- <some_locale>/fi.json --ast --out-file src/compiled-lang/<some_locale>.json`
