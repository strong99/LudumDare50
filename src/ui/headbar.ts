import { Container, Sprite, Texture } from "pixi.js";
import { Player } from "../actors/player";

export class HeadBar {
    private _player: Player;

    private _head  = new Sprite();
    private _head_decay  = new Sprite();

    public constructor(player: Player, uiContainer: Container) {
        this._player = player;

        this._head.texture = Texture.from('ui/head.png');
        this._head.position.set(window.innerWidth / 2, window.innerHeight - 40);
        this._head.anchor.set(0.5, 1);
        uiContainer.addChild(this._head);

        
        this._head_decay.texture = Texture.from('ui/head_decay.png');
        this._head_decay.anchor.set(0.5, 1);
        this._head.addChild(this._head_decay);
    }

    private _max: number = 0;

    public update(timeDelta: number, timeDeltaMs: number): void {
        this._max = Math.max(this._max, this._player.lifeforce);
        const percentage = Math.min(1, Math.max(0, this._max - 65) / 200);
        this._head_decay.alpha = percentage;
    }

    public remove() {
        
    }
}