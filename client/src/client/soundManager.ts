class SoundManager {
    private isMuted: boolean = false;

    public setIsMuted(state: boolean) {
        console.log("Muted:", state);
        this.isMuted = state;
    }

    public soundEnabled(): boolean {
        return !this.isMuted;
    }

    public playSound(sound: Howl) {
        if (!this.isMuted) {
            sound.play();
        }
    }
}

export const soundManager = new SoundManager();
