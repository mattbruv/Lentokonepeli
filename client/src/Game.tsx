import { useContext, useEffect, useRef, useState } from "react";
import { DogfightContext } from "./DogfightContext";
import { EntityChange } from "dogfight-types/EntityChange";
import Levels from "./assets/levels.json";
import { GameEvent } from "dogfight-types/GameEvent";

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const dogfight = useContext(DogfightContext);

  useEffect(() => {
    if (gameContainer.current) {
      dogfight.client.init(gameContainer.current).then(() => {
        dogfight.game.load_level(Levels["africa"]);
        dogfight.game.init();

        setInterval(() => {
          const tick = dogfight.game.tick();
          const events = JSON.parse(tick) as GameEvent[];
          console.log(events);
          dogfight.client.handleGameEvents(events);
        }, 3000);
      });
    }
  }, []);

  return <div ref={gameContainer}></div>;
}
