import { Container } from "pixi.js";
import { World } from "../../world";
import { Action } from "./action";

/**
 * Allows the removal of an entity from the map
 */
export class RemoveEntityAction implements Action {
    private _canvas: HTMLCanvasElement;
    
    private _remove: (this: HTMLCanvasElement, e: MouseEvent) => void;
    private _move: (this: HTMLCanvasElement, e: MouseEvent) => void;

    public constructor(world: World, viewport: Container) {
        this._canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;

        this._remove = (e)=> {
            const entity = world.findEntity(p=>p.isInVisual(e.pageX - viewport.x, e.pageY - viewport.y));
            if (entity) {
                const chunk = world.getTile(entity.position.x, entity.position.y)!.chunk;
                entity.remove();
                const idx = chunk.entities.indexOf(entity);
                chunk.entities.splice(idx, 1);
            }
        };

        this._move = (e)=> {
            this.draw(e.pageX - viewport.x, e.pageY - viewport.y);
        };

        this._canvas.addEventListener('click', this._remove);
        this._canvas.addEventListener('mousemove', this._move);
    }

    public draw(x: number, y: number) {
    }

    public remove() {
        this._canvas.removeEventListener('click', this._remove);
        this._canvas.removeEventListener('mousemove', this._move);
    }
}
