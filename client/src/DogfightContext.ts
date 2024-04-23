import { DogfightWeb } from "dogfight-web";
import { createContext, useContext } from "react";
import { DogfightClient } from "./client/DogfightClient";

interface Dogfight {
  game: DogfightWeb;
  client: DogfightClient;
}

export const DogfightContext = createContext<Dogfight>({
  game: DogfightWeb.new(),
  client: new DogfightClient(),
});
