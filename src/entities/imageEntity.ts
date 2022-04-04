import { Sprite, Texture } from "pixi.js";
import { LayerInfo } from "../tile";
import { Vector2, Vector2ChangeCallback } from "../vector2";
import { worldSettings } from "../worldSettings";
import { Entity, EntityData } from "./entity";

const tileSize = worldSettings.tileSize;

export interface ImageEntityData extends EntityData {
    visual?: string;
}

/**
 * Simple entity that renders a single visual
 */
export class ImageEntity extends Entity {
    protected _eventChanged: Vector2ChangeCallback;
    protected _visual?: Sprite;
    protected _data: ImageEntityData;

    public constructor(layerInfo: LayerInfo, data: EntityData | ImageEntityData) {
        super(layerInfo, new Vector2(data.x, data.y));

        this._data = data;

        if ('visual' in data && data.visual) {
            this._visual = new Sprite(Texture.from(data.visual));
            this._visual.position.set(this.position.x * tileSize, this.position.y * tileSize);
            this._visual.anchor.set(0.5, 1);
            layerInfo.bottomLayer.addChild(this._visual);
        }

        this.position.add(this._eventChanged = ()=>{
            // update position
            if (this._visual) this._visual.position.set(this.position.x * tileSize, this.position.y * tileSize);
        });
    }

    public override isInVisual(x: number, y: number): boolean {
        if (this._visual) {
            const v = this._visual;
            if (x > v.x - v.anchor.x * v.width && 
                x < v.x + (1-v.anchor.x) * v.width && 
                y > v.y - v.anchor.y * v.height && 
                y < v.y + (1-v.anchor.y) * v.height) {
                    return true;
                }
        }

        return false;
    }

    public override remove(): void {
        this.position.remove(this._eventChanged);
        if (this._visual) this._visual.parent.removeChild(this._visual);
        super.remove();
    }

    public override export(): ImageEntityData {
        const base = super.export() as ImageEntityData;

        base.type = 'image';
        base.visual = this._data.visual;

        return base;
    }
}