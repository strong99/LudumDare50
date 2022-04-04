import { Container } from "pixi.js";
import { Entity } from "../../entities/entity";
import { ImageEntity, ImageEntityData } from "../../entities/imageEntity";
import { LayerInfo } from "../../tile";
import { World } from "../../world";
import { worldSettings } from "../../worldSettings";
import { Action } from "./action";

const tileSize = worldSettings.tileSize;

const templates: { [key: string]: { [key:string]: string|number } } = {
    'house_01': {
        type: 'image',
        visual: 'entities/house_01.png'
    },
    'house_02': {
        type: 'image',
        visual: 'entities/house_02.png'
    },
    'house_03': {
        type: 'image',
        visual: 'entities/house_03.png'
    },
    'lantern_01': {
        type: 'image',
        visual: 'entities/lantern_01.png'
    },
    'lantern_02': {
        type: 'image',
        visual: 'entities/lantern_02.png'
    },
    'tree_01': {
        type: 'image',
        visual: 'entities/tree_01.png'
    },
    'tree_02': {
        type: 'image',
        visual: 'entities/tree_02.png'
    },
    'tree_03': {
        type: 'image',
        visual: 'entities/tree_03.png'
    }
};

/**
 * Allows placement of an entity somewhere on the map.
 */
export class PlaceEntityAction implements Action {
    private _entity: Entity|null;
    private _canvas: HTMLCanvasElement;
    private _viewport: Container;
    
    private _place: (this: HTMLCanvasElement, e: MouseEvent) => void;
    private _move: (this: HTMLCanvasElement, e: MouseEvent) => void;

    public constructor(world: World, viewport: Container, layerInfo: LayerInfo, template: string) {
        this._canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
        this._viewport = viewport;

        const data: { [key:string]: string|number } = {
            x: 0, 
            y: 0
        };
        const templateData =  templates[template];
        for(const k in templateData) {
            data[k] = templateData[k];
        }

        this._entity = new ImageEntity(layerInfo, data as any as ImageEntityData);

        this._place = (e)=> {
            if (this._entity) {
                const tile = world.getTile(this._entity.position.x, this._entity.position.y);
                if (!tile)
                    throw new Error();

                tile.chunk.entities.push(this._entity);
                this._entity = null;
            }
        };

        this._move = (e)=> {
            if (this._entity) {
                const tx = (e.pageX - this._viewport.x) / tileSize;
                const ty = (e.pageY - this._viewport.y) / tileSize;
                this._entity.position.set(tx, ty);
            }
            this.draw(e.pageX, e.pageY);
        };

        this._canvas.addEventListener('click', this._place);
        this._canvas.addEventListener('mousemove', this._move);
    }

    public draw(x: number, y: number) {
        if (this._entity) {
            const tx = (x - this._viewport.x) / tileSize;
            const ty = (y - this._viewport.y) / tileSize;
            this._entity.position.set(tx, ty);
        }
    }

    public remove() {
        this._canvas.removeEventListener('click', this._place);
        this._canvas.removeEventListener('mousemove', this._move);
        this._entity?.remove();
    }
}
