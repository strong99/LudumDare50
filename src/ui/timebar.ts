import { Text } from "@pixi/text";
import { Container, Sprite, Texture } from "pixi.js";
import { PlayState } from "../states/playState";

export function scoreToTime(playtime: number) {
    const totalMs = playtime % 1000;
    const totalSeconds = playtime / 1000;
    const minutes = totalSeconds / 60;
    const seconds = totalSeconds % 60;

    const minuteStr = minutes.toFixed(0).padStart(2, '0');
    const secondStr = seconds.toFixed(0).padStart(2, '0');
    const totalMsStr = totalMs.toFixed(0).padStart(3, '0');

    return `${minuteStr}:${secondStr}.${totalMsStr}`;
}

export class TimeBar {
    private _state: PlayState;
    private _bar = new Text("");

    private _background = new Sprite();

    public constructor(state: PlayState, uiContainer: Container) {
        this._state = state;

        this._background.texture = Texture.from('ui/timebar.png');
        this._background.position.set(window.innerWidth / 2, window.innerHeight);
        this._background.anchor.set(0.5, 1);
        uiContainer.addChild(this._background);

        this._background.addChild(this._bar);
        this._bar.position.set(0, -15);
        this._bar.style.fill = 'white';
        this._bar.anchor.set(0.5, 1);
    }

    public update(timeDelta: number, timeDeltaMs: number): void {
        this._bar.text = scoreToTime(this._state.playTime);
    }

    public remove() {
        this._background.parent.removeChild(this._background);
    }
}