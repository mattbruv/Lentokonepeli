import { DogfightEngine } from "../../dogfight/src/engine";

export class GameClient {
  /**
   * A local instance of the Dogfight Engine.
   * This is helpful for processing entity
   * movement between state updates
   * (client side prediction)
   */
  private localEngine: DogfightEngine;

  /**
   * A local instance of the Dogfight Renderer.
   * This takes game changes and renders a world
   * based on those changes.
   */
  private localRenderer: void;

  public constructor() {
    console.log("Initializing Game Client..");
    this.localEngine = new DogfightEngine();
    this.localEngine.debug();
    // init renderer
    // get local engine state and pass it to renderer...
  }
}
