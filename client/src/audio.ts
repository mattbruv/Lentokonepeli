import { Howl } from "howler";

export class AudioManager {
  private engine: Howl;
  public constructor() {
    this.engine = new Howl({
      src: ["assets/audio/motor.mp3", "assets/audio/motor.wav"],
      volume: 0.5,
      loop: true
    });
  }

  public playEngine(play: boolean): void {
    if (play) {
      this.engine.play();
    } else {
      this.engine.stop();
    }
  }

  public playExplosion(): void {
    const explosion = new Howl({
      src: ["assets/audio/explosion.mp3", "assets/audio/explosion.wav"]
    });
    explosion.play();
  }
}
