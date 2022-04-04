import { Container } from "pixi.js";
import { Tile } from "../../tile";
import { World } from "../../world";
import { worldSettings } from "../../worldSettings";
import { Action } from "./action";

const tileSize = worldSettings.tileSize;

/**
 * Allows to manipulate tiles be clicking and dragging
 */
export class TileDrawAction implements Action {
    private _callback: (t: Tile)=>void;
    private _canvas: HTMLCanvasElement;
    private _world: World;

    private _viewport: Container;
    
    private _start: (this: HTMLCanvasElement, e: MouseEvent) => void;
    private _move: (this: HTMLCanvasElement, e: MouseEvent) => void;
    private _end: (this: HTMLCanvasElement, e: MouseEvent) => void;

    public constructor(world: World, viewport: Container, callback: (t: Tile)=>void) {
        this._callback = callback;
        this._world = world;
        this._viewport = viewport;
        this._canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;

        this._canvas.addEventListener('mousedown', this._start = (e)=> {
            this._canvas.addEventListener('mousemove', this._move);
            this._canvas.addEventListener('mouseup', this._end);
            this.draw(e.pageX, e.pageY);
        });

        this._move = (e)=> {
            this.draw(e.pageX, e.pageY);
        };

        this._end = (e)=> {
            this._canvas.removeEventListener('mousemove', this._move);
            this._canvas.removeEventListener('mouseup', this._end);
        };
    }

    private draw(x: number, y: number) {
        const tx = Math.floor((x- this._viewport.x) / tileSize );
        const ty = Math.floor((y- this._viewport.y) / tileSize );
        const tile = this._world.getTile(tx, ty);
        if (tile) {
            this._callback(tile);
        }
    }

    public remove() {
        this._canvas.removeEventListener('mousedown', this._start);
    }
}
