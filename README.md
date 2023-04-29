# Lentokonepeli
> Fly your planes to victory as you re-create the aerial battles of the First World War!

This is a modern remake of the competitive 2D multiplayer airplane game [Lentokonepeli](https://www.youtube.com/watch?v=qCCCUXUwlT8)
(*Literal translation from Finnish: "airplane game", also known in English as Dogfight*).

Since Lentokonepeli is not fully open-source<sup>[?](#why-closed-source)</sup>, this repository serves as a place for bug reports, feature requests, and general discussion.

## NOTE
**CURRENTLY IN DEVELOPMENT**

I am remaking this codebase for the third time, starting April of 2023. The fans have been waiting for 4 years, and it's about time I actually got around to remaking this and implementing it correctly, and also fully fleshing it out.
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
Currently in progress.
This section will be re-written when there is something to show.

## Why closed source?
There are a few reasons that the Lentokonepeli remake is not open source.
The original game was created long ago as a Java game for the website Playforia (aapeli).
This company was eventually sold to Namida Diamond Factory.
Through this acquisition, they inherited all of the source code.
While they own the outdated (and effectively useless) Java code,
the original game is sitting
on a hard drive somewhere, never to see the light of day again.

Through a series of connections and luck, we were able to aquire a copy of the original server JAR file under the condition that we do not distribute it.
I intend to respect this decision, as it is their desire, and they were kind enough to provide us with a copy.

This project uses the reverse engineered JAR file as a guide when re-implementing the game.
The game logic and appearence is made to be as close as possible to the original (where it makes sense).

Neither the original JAR file/source or remake source will be shared.

### Why not share the remake source?

*I will explain why in more detail in the future.*



## Acknowledgments

* Aapeli (Playforia) for creating decades of entertainment and friendships through their internet gaming platform.
* [Pyry Lehdonvirta](https://pyry.lehdonvirta.com/), the original programmer of Lentokonepeli.
* [Pallosalama](https://www.youtube.com/user/tappajaav) for his many high quality recordings and documentation of [maps](./docs/images/map-screenshots) and other important game information.
* Members of [Munkkiliiga](http://munq.arkku.net/) (and everyone else in the discord server) for being such dedicated fans to the game, and having the patience to work with me. 
Their passion and enthusiasm for the game inspired me greatly.