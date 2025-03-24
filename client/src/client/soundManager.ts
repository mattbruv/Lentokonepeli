import { Howl } from "howler";

class SoundManager {
    private activeEngines: number = 0;
    private engineAudio = new Howl({
        src: "audio/motor_paulstretch.wav",
        loop: true,
    });

    public setIsMuted(state: boolean) {
        Howler.mute(state);
    }

    public playSound(sound: Howl) {
        sound.play();
    }

    /**
     * Play motor sound if at least 1 plane with motor on
     */
    public handlePlayMotorSound(motorOn: boolean) {
        const engineSoundWasPlaying = this.activeEngines > 0;

        this.activeEngines = motorOn ? this.activeEngines + 1 : Math.max(this.activeEngines - 1, 0);

        const engineSoundIsPlaying = this.activeEngines > 0;

        if (!engineSoundWasPlaying && engineSoundIsPlaying) {
            this.playSound(this.engineAudio);
        } else if (engineSoundWasPlaying && !engineSoundIsPlaying) {
            this.engineAudio.stop();
        }
    }
}

export const soundManager = new SoundManager();
