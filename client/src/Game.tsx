import { useContext, useEffect, useRef } from "react";
import { DogfightContext } from "./DogfightContext";

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const dogfight = useContext(DogfightContext);

  useEffect(() => {
    dogfight.client.appendView(gameContainer.current);
  }, []);

  return <div ref={gameContainer}></div>;
}
