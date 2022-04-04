export type Vector2ChangeCallback = (self: Vector2) => void;

/**
 * Manages a vector coordinates (x, y) and math methods
 * 
 */
export class Vector2 {
    public get x() { return this._x; }
    private _x: number;

    public get y() { return this._y; }
    private _y: number;

    private _listeners: Array<Vector2ChangeCallback> = [];

    public constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    public set(x: number, y: number) {
        this._x = x;
        this._y = y;
        this.trigger();
    }

    private trigger() {
        for(const callback of this._listeners)
            callback(this);
    }

    public add(callback: Vector2ChangeCallback) {
        this._listeners.push(callback);
    }

    public remove(callback: Vector2ChangeCallback) {
        const idx = this._listeners.indexOf(callback);
        if (idx >= 0) {
            this._listeners.splice(idx, 1);
        }
    }
    
    public distance(other: Vector2) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    public direction(other: Vector2) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        return new Vector2(dx / length, dy / length);
    }
}
