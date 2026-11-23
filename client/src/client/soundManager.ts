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

export function pcmWavToAudioBuffer(ctx: BaseAudioContext, data: ArrayBuffer): AudioBuffer | null {
    const view = new DataView(data);
    const tag = (offset: number) =>
        String.fromCharCode(
            view.getUint8(offset),
            view.getUint8(offset + 1),
            view.getUint8(offset + 2),
            view.getUint8(offset + 3),
        );
    if (view.byteLength < 12 || tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;

    let format: { channels: number; sampleRate: number; bits: number } | null = null;
    let offset = 12;
    while (offset + 8 <= view.byteLength) {
        const id = tag(offset);
        const size = view.getUint32(offset + 4, true);
        const body = offset + 8;
        if (id === "fmt ") {
            if (view.getUint16(body, true) !== 1) return null;
            format = {
                channels: view.getUint16(body + 2, true),
                sampleRate: view.getUint32(body + 4, true),
                bits: view.getUint16(body + 14, true),
            };
        } else if (id === "data" && format) {
            const { channels, sampleRate, bits } = format;
            if (bits !== 8 && bits !== 16) return null;
            const bytesPerSample = bits / 8;
            const end = Math.min(body + size, view.byteLength);
            const frames = Math.floor((end - body) / (bytesPerSample * channels));
            if (frames === 0) return null;
            const buffer = ctx.createBuffer(channels, frames, sampleRate);
            for (let channel = 0; channel < channels; channel++) {
                const out = buffer.getChannelData(channel);
                for (let frame = 0; frame < frames; frame++) {
                    const at = body + (frame * channels + channel) * bytesPerSample;
                    out[frame] = bits === 16 ? view.getInt16(at, true) / 32768 : (view.getUint8(at) - 128) / 128;
                }
            }
            return buffer;
        }
        offset = body + size + (size % 2);
    }
    return null;
}

const LOOP_FADE_SECONDS = 0.03;

class SeamlessLoop {
    private buffer: AudioBuffer | null = null;
    private source: AudioBufferSourceNode | null = null;
    private gain: GainNode | null = null;
    private wanted = false;

    constructor(src: string) {
        void this.load(src);
    }

    private async load(src: string) {
        const ctx = Howler.ctx;
        if (!ctx) return;
        try {
            const data = await (await fetch(src)).arrayBuffer();
            this.buffer = pcmWavToAudioBuffer(ctx, data) ?? (await ctx.decodeAudioData(data));
            if (this.wanted) this.start();
        } catch (error) {
            console.warn("Failed to load looping sound", src, error);
        }
    }

    public start() {
        this.wanted = true;
        const ctx = Howler.ctx;
        if (!ctx || !this.buffer || this.source) return;
        if (ctx.state === "suspended") void ctx.resume().catch(() => {});

        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + LOOP_FADE_SECONDS);
        gain.connect(Howler.masterGain);

        const source = ctx.createBufferSource();
        source.buffer = this.buffer;
        source.loop = true;
        source.connect(gain);
        source.start(now);

        this.source = source;
        this.gain = gain;
    }

    public stop() {
        this.wanted = false;
        const ctx = Howler.ctx;
        const { source, gain } = this;
        if (!ctx || !source || !gain) return;
        this.source = null;
        this.gain = null;

        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + LOOP_FADE_SECONDS);
        source.onended = () => {
            source.disconnect();
            gain.disconnect();
        };
        source.stop(now + LOOP_FADE_SECONDS);
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

    private motor = new SeamlessLoop("audio/motor.wav");

    constructor() {
        Howler.autoSuspend = false;
    }

    public setIsMuted(state: boolean) {
        Howler.mute(state);
    }

    private suppressed = false;

    public setSuppressed(suppressed: boolean) {
        this.suppressed = suppressed;
    }

    public play(name: SoundName) {
        if (this.suppressed) return;
        this.clips[name].play();
    }

    public startMotorLoop() {
        this.motor.start();
    }

    public stopMotorLoop() {
        this.motor.stop();
    }
}

export const soundManager = new SoundManager();
