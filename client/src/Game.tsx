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
        dogfight.game.load_level(Levels["classic"]);

        const json = dogfight.game.get_full_state();
        const state = JSON.parse(json) as EntityChange[];
        dogfight.client.updateEntities(state);
      });
    }
  }, []);

  return <div ref={gameContainer}></div>;
}
