import { DogfightWeb } from "dogfight-web";
import { createContext } from "react";
import { DogfightClient } from "./client/DogfightClient";

interface Dogfight {
  game: DogfightWeb;
  renderer: DogfightClient;
}

export const DogfightContext = createContext<Dogfight>({
  game: DogfightWeb.new(),
  renderer: new DogfightClient(),
});
