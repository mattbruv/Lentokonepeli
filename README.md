# Lentokonepeli
> Fly your planes to victory as you re-create the aerial battles of the First World War!

This is a modern remake of the competitive 2D multiplayer airplane game [Lentokonepeli](https://www.youtube.com/watch?v=qCCCUXUwlT8)
(*Literal translation: "airplane game", also known as Dogfight*).


## History
The game was originally created in 2005 by the Finnish game studio [Aapeli/Playforia](https://en.wikipedia.org/wiki/Playforia).
Their gaming website was built in 2002 entirely on Java.
As web browsers would begin to treat Java as a security risk,
the website became less and less accessible
until it was permanently shut down in 2019.

With the death of Playforia, Dogfight should have died too. 
Fortunately, I was able to download a copy of the [client-side jar](https://github.com/mattbruv/playray-dogfight-client) file before the site went offline.
This jar file contained game assets such as images and audio.
It is now possible to recreate the game using these assets, along with reverse engineering the physics through captured video and other documentation.

The purpose of this project is to bring this nostalgic game back to life and keep it alive forever.

## Install
Dependencies (possibly incomplete):
- nodejs and npm (https://nodejs.org/en/download/package-manager/)

```
git clone https://github.com/mattbruv/Lentokonepeli.git
cd Lentokonepeli
npm i
npm run build
mkdir dist/images
cp client/public/images/* dist/images/
npm run server
```
Visit the server at http://localhost:3259/ with the specified port.

## Discord
[Join us on Discord](https://discord.gg/QjtXPmx) if you are interested in staying up to date on the remake of this game
and interact with the community.

## Acknowledgments

* Aapeli.com/playray.com/playforia.com for creating this wonderfully fun game
* [Munkkiliiga](http://munkkiliiga.arkku.net) forums for being proactive fans, along with measuring and documenting some of the physics.
Without them, the game would not feel like it used to.
