import { Sound } from "@pixi/sound";
import { Application, Container } from "pixi.js";
import { Player } from "../actors/player";
import { getVolume } from "../config/audio";
import { addHighscore, getHighscore } from "../config/scores";
import { MenuState } from "../states/menuState";
import { PlayState } from "../states/playState";
import { scoreToTime } from "./timebar";

export class GameOver {
    private _restartBtn: HTMLElement;
    private _menuBtn: HTMLElement;
    private _gameOverPanel: HTMLElement;
    private _startGameCallback: (this: HTMLElement, ev: MouseEvent)=>boolean;
    private _menuGameCallback: (this: HTMLElement, ev: MouseEvent)=>boolean;

    public constructor(player: Player, state: PlayState, app: Application, uiContainer: Container) {
        this._gameOverPanel = document.getElementById('gameover')!;
        this._gameOverPanel.classList.add('visible');

        this._restartBtn = this._gameOverPanel.querySelector('[data-action=restart]')!;
        this._restartBtn.addEventListener('click', this._startGameCallback = (e) => {
            this.remove();
            state.remove();
            new PlayState(app);
            return false;
        });

        this._menuBtn = this._gameOverPanel.querySelector('[data-action=menu]')!;
        this._menuBtn.addEventListener('click', this._menuGameCallback = (e) => {
            this.remove();
            state.remove();
            new MenuState(app);
            return false;
        });

        const existingScore = getHighscore();
        const newScore = state.playTime;

        const yourHighscoreElement = (this._gameOverPanel.querySelector('.yourHighscore') as HTMLParagraphElement);
        const newHighScoreElement = (this._gameOverPanel.querySelector('.newHighscore') as HTMLParagraphElement);
        const prevHighScoreElement = (this._gameOverPanel.querySelector('.prevHighscore') as HTMLParagraphElement);

        yourHighscoreElement.innerHTML = scoreToTime(newScore);
        prevHighScoreElement.innerHTML = scoreToTime(existingScore);

        if (newScore > existingScore) {
            addHighscore(state.playTime);
            newHighScoreElement.classList.add('visible');
            newHighScoreElement.classList.remove('hidden');
        }
        else {
            newHighScoreElement.classList.add('hidden');
            newHighScoreElement.classList.remove('visible');
        }

        const choices = [
            'actors/hero_good_always_wins.ogg',
            'actors/hero_inevitable.ogg'
        ];
        Sound.from({
            url: choices[Math.floor(Math.random() * choices.length)],
            preload: true,
            autoPlay: true,
            volume: getVolume() / 70
        })
    }

    public update(timeDelta: number, timeDeltaMs: number): void {
        
    }

    public remove() {
        this._gameOverPanel.classList.remove('visible');
        this._restartBtn.removeEventListener('click', this._startGameCallback);
        this._menuBtn.removeEventListener('click', this._menuGameCallback);
    }
}