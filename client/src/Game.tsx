import { useContext, useEffect, useRef } from "react";
import { DogfightContext } from "./DogfightContext";

export function Game() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const dogfight = useContext(DogfightContext);

  useEffect(() => {
    const init = async () => {
      await dogfight.client.init(gameContainer.current);
    };
    init();
  }, []);

  return <div ref={gameContainer}></div>;
}
