import { Container } from "pixi.js";
import { Entity } from "../../entities/entity";
import { World } from "../../world";
import { worldSettings } from "../../worldSettings";
import { Action } from "./action";

const tileSize = worldSettings.tileSize;

/**
 * Moves a placed entity to somewhere else
 */
export class MoveEntityAction implements Action {
    private _entity: Entity|null = null;
    private _canvas: HTMLCanvasElement;
    
    private _preSelect: (this: HTMLCanvasElement, e: MouseEvent) => void;
    private _select: (this: HTMLCanvasElement, e: MouseEvent) => void;
    private _move: (this: HTMLCanvasElement, e: MouseEvent) => void;

    public constructor(world: World, viewport: Container) {
        this._canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;

        let preSelected: Entity|null = null;
        this._preSelect = (e)=> {
            preSelected = !this._entity ? world.findEntity(p=>p.isInVisual(e.pageX - viewport.x, e.pageY - viewport.y)) : null; 
        };

        this._select = (e)=> {
            const entity = world.findEntity(p=>p.isInVisual(e.pageX - viewport.x, e.pageY - viewport.y));
            if (!entity || entity == this._entity) {
                this._entity = null;
            }
            else if (entity && preSelected == entity) {
                this._entity = entity;
            }
            else if (this._entity){
                this._entity = null;
            }
        };

        this._move = (e)=> {
            this.draw(e.pageX - viewport.x, e.pageY - viewport.y);
        };

        this._canvas.addEventListener('mousedown', this._preSelect);
        this._canvas.addEventListener('click', this._select);
        this._canvas.addEventListener('mousemove', this._move);
    }

    public draw(x: number, y: number) {
        if (this._entity) {
            const tx = x / tileSize;
            const ty = y / tileSize;
            this._entity.position.set(tx, ty);
        }
    }

    public remove() {
        this._canvas.removeEventListener('click', this._select);
        this._canvas.removeEventListener('mousemove', this._move);
    }
}
