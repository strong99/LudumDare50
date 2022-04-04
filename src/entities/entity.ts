import { LayerInfo } from "../tile";
import { Vector2 } from "../vector2";

export interface EntityData {
    type: string;
    x: number;
    y: number;
}

/**
 * Base class for rendered entities
 */
export class Entity {
    protected _layerInfo: LayerInfo;

    public readonly position: Vector2;

    public constructor(renderInfo: LayerInfo, position: Vector2) {
        this._layerInfo = renderInfo;
        this.position = position;
    }

    public isInVisual(x: number, y: number): boolean {
        return false;
    }

    public export(): EntityData {
        return {
            type: 'unknown',
            x: this.position.x,
            y: this.position.y
        };
    }

    public remove(): void {

    }
}