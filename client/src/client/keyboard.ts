import { PlayerKeyboard } from "dogfight-types/PlayerKeyboard";

type keyboardChangeCallback = (keyboard: PlayerKeyboard) => void;
export class GameKeyboard {
    private keyboard: PlayerKeyboard = {
        left: false,
        right: false,
        down: false,
        up: false,
        shift: false,
        space: false,
        enter: false,
        ctrl: false,
    };

    private callback?: keyboardChangeCallback;

    public init(callback: keyboardChangeCallback) {
        this.callback = callback;
    }

    public onKeyChange(action: keyof PlayerKeyboard, type: "up" | "down") {
        const currentlyPressed = this.keyboard[action];
        const nextPressed = type === "down";
        const keyChanged = currentlyPressed !== nextPressed;
        if (!keyChanged) return;

        this.keyboard[action] = nextPressed;

        this.callback?.(structuredClone(this.keyboard));
    }
}
