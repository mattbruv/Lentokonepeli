# Lentokonepeli GUI

TypeScript Library which handles all
rendering of a game instance and user input.

## Development

### Initial Setup

1. Run `npm link` in this root folder.
This will add this package (named `lento-client` to your global NPM packages via symlink.
2. CD into `frontend` root folder and run `npm link lento-client`

This makes it so that any changes to this library during development are reflected in the dependency of `frontend`, which consumes this library.

### Automatic Rebuild

run with `npx tsc --watch` in this folder.
Any time changes to code are made,
the library will be rebuilt.
The client which consumes this library
should automatically rebuild upon detecting changes to this library.