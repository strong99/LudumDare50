import { Graphics } from "@pixi/graphics";
import { Container, Sprite, Texture } from "pixi.js";
import { Player } from "../actors/player";

export class Lifebar {
    private _player: Player;
    private _bar = new Graphics();
    private _heart = new Sprite();
    private _panel = new Container();

    private _timer: number = 0;
    private _max: number = 0;

    public constructor(player: Player, uiContainer: Container) {
        this._player = player;

        this._panel.position.set(20, window.innerHeight - 20);
        this._bar.position.set(5, 0);
        this._heart.position.set(15, 0);
        this._heart.texture = Texture.from('ui/heart.png');
        this._heart.anchor.set(0.5, 0.5);

        uiContainer.addChild(this._panel);
        this._panel.addChild(this._bar);
        this._panel.addChild(this._heart);
    }

    public update(timeDelta: number, timeDeltaMs: number): void {
        this._bar.clear();
        this._bar.beginFill(0xff0000);
        const h = Math.max(0, this._player.lifeforce * 2);
        this._bar.drawRect(0, -h, 20, h);

        this._max = Math.max(this._max, this._player.lifeforce);

        const scalar =  Math.sqrt(this._player.lifeforce / this._max);
        if (!isNaN(scalar)) {
            this._timer += timeDelta;
            const s = 1 + Math.sin(this._timer / 20 / scalar) / 8;
            this._heart.scale.set(s, s);
        }
    }

    public remove() {
        
    }
}