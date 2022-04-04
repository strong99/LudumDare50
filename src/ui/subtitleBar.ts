import { Container } from "pixi.js";
import { Player } from "../actors/player";
import { PlayState } from "../states/playState";

export class SubtitleBar {
    private _widget: HTMLElement;
    private _nextBtn: HTMLButtonElement;
    private _textBox: HTMLParagraphElement;

    private _nextBtnCallback: (this: HTMLElement, args: MouseEvent)=>void;

    public constructor(player: Player, state: PlayState, uiContainer: Container) {
        this._widget = document.getElementById('subtitleBar')!;

        this._textBox = this._widget.querySelector('p')!;
        this._nextBtn = this._widget.querySelector('[data-action=next]')!;
        this._nextBtn.addEventListener('click', this._nextBtnCallback = (e) => {
            this.next();
        });
    }

    private next() {
        const oldTextIdx = this._textIdx || 0;
        if (!this._texts || this._texts?.length === 0 || this._texts.length - 1 <= oldTextIdx) {
            this._texts = undefined;
            this._widget.classList.remove('visible');
            if (this._finished) {
                this._finished();
                this._finished = undefined;
            }
            return;
        }

        this._widget.classList.add('visible');
        if (typeof this._textIdx === 'number') {
            this._textIdx++;
            if (this._textIdx > this._texts.length) 
            {
                this._texts = undefined;
                if (this._finished) {
                    this._finished();
                    this._finished = undefined;
                    this._widget.classList.remove('visible');
                }
            }
            else {
                this._text = "";
                this._textCharIdx = 0;
            }
        }
    }

    private _texts?: string[];
    private _textIdx?: number;
    private _textCharIdx?: number;
    private _text?: string;
    private _finished?: ()=>void;
    public play(texts: string[], finished: ()=>void) {
        this._texts = texts;

        this._textIdx = 0;
        this._textCharIdx = 0;
        this._text = "";
        this._updateSpeed = 0;
        this._widget.classList.add('visible');
        this._finished = finished;
        if (!texts || texts.length == 0) {
            this._finished();
            this._widget.classList.remove('visible');
        }
    }

    private _updateSpeed = 0;
    public update(timeDelta: number, timeDeltaMs: number): void {
        this._updateSpeed -= timeDelta;
        if (this._texts && this._texts.length > 0 && this._updateSpeed < 0) {
            this._updateSpeed = 5;
            if (this._textCharIdx! < this._texts[this._textIdx!]!.length) {
                this._text += this._texts[this._textIdx!][this._textCharIdx!];
                this._textBox.innerText = this._text as string;
                ++this._textCharIdx!;
            }
        }
    }

    public remove() {
        this._nextBtn.removeEventListener('click', this._nextBtnCallback );
    }
}