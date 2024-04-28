import { useContext, useEffect, useRef } from "react";
import { DogfightContext } from "./DogfightContext";
import Levels from "./assets/levels.json";
import { GameOutput } from "dogfight-types/GameOutput";
import { GameClientCallbacks } from "./client/DogfightClient";
import { Team } from "dogfight-types/Team";
import { GameInput } from "dogfight-types/GameInput";
import { RunwaySelection } from "dogfight-types/RunwaySelection";
import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const dogfight = useContext(DogfightContext);

  useEffect(() => {
    if (gameContainer.current) {
      // set player name for testing
      const player_name = "player1";

      const callbacks: GameClientCallbacks = {
        chooseTeam: (team: Team): void => {
          tick_input.push({
            type: "PlayerChooseTeam",
            data: {
              player_name,
              team,
            },
          });
        },
        chooseRunway: (selection: RunwaySelection): void => {
          tick_input.push({
            type: "PlayerChooseRunway",
            data: {
              player_name: selection.player_name,
              plane_type: selection.plane_type,
              runway_id: selection.runway_id,
            },
          });
        },
        keyChange: (keyboard: PlayerKeyboard): void => {
          tick_input.push({
            type: "PlayerKeyboard",
            data: {
              name: player_name,
              keys: keyboard,
            },
          });
        },
      };

      let tick_input: GameInput[] = [];

      dogfight.client.init(callbacks, gameContainer.current).then(() => {
        document.onkeydown = (event) => {
          dogfight.client.keyboard.onKeyDown(event.key);
        };
        document.onkeyup = (event) => {
          dogfight.client.keyboard.onKeyUp(event.key);
        };

        dogfight.game.load_level(Levels["classic"]);
        dogfight.game.init();

        dogfight.client.setMyPlayerName(player_name);

        tick_input.push({
          type: "AddPlayer",
          data: {
            name: player_name,
          },
        });

        setInterval(() => {
          const input_json = JSON.stringify(tick_input);
          tick_input = [];
          const tick = dogfight.game.tick(input_json);
          const events_json = dogfight.game.game_events_from_binary(tick);
          const events = JSON.parse(events_json) as GameOutput[];

          dogfight.client.handleGameEvents(events);
        }, 30);
      });
    }
  }, []);

  return <div ref={gameContainer}></div>;
}
