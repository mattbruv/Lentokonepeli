import { useContext, useEffect, useRef, useState } from "react";
import { DogfightContext } from "./DogfightContext";
import { EntityChange } from "dogfight-types/EntityChange";
import Levels from "./assets/levels.json";

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const dogfight = useContext(DogfightContext);

  useEffect(() => {
    if (gameContainer.current) {
      dogfight.client.init(gameContainer.current).then(() => {
        dogfight.game.load_level(Levels["africa"]);
        dogfight.game.init();

        const json = dogfight.game.get_full_state();
        const state = JSON.parse(json) as EntityChange[];
        dogfight.client.updateEntities(state);

        setInterval(() => {
          dogfight.game.tick();
          const json = dogfight.game.get_changed_state();
          const state = JSON.parse(json) as EntityChange[];
          dogfight.client.updateEntities(state);
        }, 30);
      });
    }
  }, []);

  return <div ref={gameContainer}></div>;
}
