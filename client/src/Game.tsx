import { useContext, useEffect, useRef } from "react";
import { DogfightContext } from "./DogfightContext";
import Levels from "./assets/levels.json";
import { GameOutput } from "dogfight-types/GameOutput";
import { ClientCallbacks } from "./client/DogfightClient";
import { Team } from "dogfight-types/Team";

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const dogfight = useContext(DogfightContext);

  useEffect(() => {
    if (gameContainer.current) {
      const callbacks: ClientCallbacks = {
        chooseTeam: (team: Team) => void {},
      };

      dogfight.client.init(callbacks, gameContainer.current).then(() => {
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
