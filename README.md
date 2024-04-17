# Lentokonepeli

> Fly your planes to victory as you re-create the aerial battles of the First World War!

This is a modern remake of the competitive 2D multiplayer airplane game [Lentokonepeli](https://www.youtube.com/watch?v=qCCCUXUwlT8)
(_Literal translation from Finnish: "airplane game", also known in English as Dogfight_).

## NOTE

⚠️ **CURRENTLY IN DEVELOPMENT** ⚠️

I am remaking this codebase for the fourth(!) time, starting March of 2024.

Lots of planned features are in mind, including a website with accounts, leaderboards, and statistics tracking.

## Discord

[Join us on Discord](https://discord.gg/QjtXPmx) if you are interested in staying up to date on the remake of this game
and interact with the community.

## History

The game was originally created in 2005 by the Finnish game studio [Playforia (Aapeli)](https://en.wikipedia.org/wiki/Playforia).
Their gaming website was built in 2002 entirely on Java.
As web browsers would begin to treat Java as a security risk,
their website became less and less accessible
until it was permanently shut down in 2019.

With the death of Playforia, Dogfight should have died too.
Fortunately, I was able to download a copy of the [client-side jar](https://github.com/mattbruv/playray-dogfight-client) file before the site went offline.
This jar file contained game assets such as images and audio.
It is now possible to recreate the game using these assets, along with reverse engineering the physics through captured video and other documentation.

The purpose of this project is to bring this nostalgic game back to life and keep it alive forever.

## Development

### Repo Structure:

#### Game/Server

- [./dogfight](./dogfight/): The Rust source code for the game's logic
  - Build by running `cargo build --release`
  - Generate Types for the TypeScript library by running `cargo test`
- [./dogfight/dogfight-macros/](./dogfight/dogfight-macros/):
  The procedural macros used by the game.
  - Build by running `cargo build --release`
- [./dogfight/dogfight-web/](./dogfight/dogfight-web/):
  A WASM <---> JS interface for the dogfight game, which exports a package enabling dogfight to run in the browser.
  - Build by running `wasm-pack build`

#### Web Client

- [./client/renderer/](./client/renderer/):
  A pure TypeScript library with logic for rendering logic to render a game world.
  - `npm install`
  - run `npm run copy` to copy the types generated from `./dogfight/` into the appropriate folder so they can be used in this project.
  - Build with `tsc` or in watch mode with `tsc --watch`
- [./client/ui/](./client/ui/):
  A React web user interface
  - `npm install`
  - Run with `npm run dev`

## Acknowledgments

- Aapeli (Playforia) for creating decades of entertainment and friendships through their internet gaming platform.
- [Pyry Lehdonvirta](https://pyry.lehdonvirta.com/), the original programmer of Lentokonepeli.
- [Pallosalama](https://www.youtube.com/user/tappajaav) for his many high quality recordings and documentation of [maps](./docs/images/map-screenshots) and other important game information.
- Members of [Munkkiliiga](http://munq.arkku.net/) (and everyone else in the discord server) for being such dedicated fans to the game, and having the patience to work with me.
  Their passion and enthusiasm for the game inspired me greatly.
