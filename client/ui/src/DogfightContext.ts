import { DogfightWeb } from "dogfight-web";
import { createContext } from "react";

interface Dogfight {
  game: DogfightWeb;
}

export const DogfightContext = createContext<Dogfight>({
  game: DogfightWeb.new(),
});
