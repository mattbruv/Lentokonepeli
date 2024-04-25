import { useContext, useEffect, useRef } from "react";
import { DogfightContext } from "./DogfightContext";
import Levels from "./assets/levels.json";
import { GameOutput } from "dogfight-types/GameOutput";

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
          const events_json = dogfight.game.game_events_from_binary(tick);
          const events = JSON.parse(events_json) as GameOutput[];

          dogfight.client.handleGameEvents(events);
        }, 30);
      });
    }
  }, []);

  return <div ref={gameContainer}></div>;
}
