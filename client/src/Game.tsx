import { useContext, useEffect, useRef } from "react";
import { DogfightContext } from "./DogfightContext";
import { Team } from "dogfight-types/Team";

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const dogfight = useContext(DogfightContext);
  const x = dogfight.game.get_full_state();
  console.log("full state: ", x);

  useEffect(() => {
    dogfight.client.appendView(gameContainer.current);
  }, []);

  return <div ref={gameContainer}></div>;
}
