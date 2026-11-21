import { Howl, Howler } from "howler";

class MultiClip {
    private howl: Howl;
    private ids: number[] = [];

    constructor(
        src: string,
        private size: number,
    ) {
        this.howl = new Howl({ src: [src], preload: true });
    }

    public play() {
        for (const id of this.ids) {
            if (!this.howl.playing(id)) {
                this.howl.play(id);
                return;
            }
        }

        if (this.ids.length < this.size) {
            this.ids.push(this.howl.play());
            return;
        }

        let furthest = this.ids[0];
        for (const id of this.ids) {
            if (this.howl.seek(id) > this.howl.seek(furthest)) {
                furthest = id;
            }
        }
        this.howl.stop(furthest);
        this.howl.play(furthest);
    }
}

export type SoundName = "m16" | "bombdrop" | "explosion" | "hit";

class SoundManager {
    private clips: Record<SoundName, MultiClip> = {
        m16: new MultiClip("audio/m16.wav", 3),
        bombdrop: new MultiClip("audio/bombdrop.wav", 3),
        explosion: new MultiClip("audio/explosion.wav", 3),
        hit: new MultiClip("audio/hit.wav", 1),
    };

    private motor = new Howl({ src: ["audio/motor.wav"], loop: true, preload: true });

    public setIsMuted(state: boolean) {
        Howler.mute(state);
    }

    public play(name: SoundName) {
        this.clips[name].play();
    }

    public startMotorLoop() {
        if (!this.motor.playing()) {
            this.motor.play();
        }
    }

    public stopMotorLoop() {
        this.motor.stop();
    }
}

export const soundManager = new SoundManager();
