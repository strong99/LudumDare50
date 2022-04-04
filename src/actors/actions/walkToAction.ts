import { Sound } from "@pixi/sound";
import { Callbacks } from "jquery";
import { getVolume } from "../../config/audio";
import { Tile } from "../../tile";
import { Vector2 } from "../../vector2";
import { World } from "../../world";
import { worldSettings } from "../../worldSettings";
import { Human } from "../human";
import { Player } from "../player";
import { ActorAction } from "./action";

export type WalkToActionCallback = (action: WalkToAction) => void;

export class WalkToAction implements ActorAction {
    private _duration: number;
    private _self: Player;
    private _world: World;
    private _path?: Tile[];

    private _callbackEnd: WalkToActionCallback | null;

    public constructor(world: World, self: Player, toPosition: Vector2, callbackEnd: WalkToActionCallback | null) {
        this._duration = 60;
        this._self = self;
        this._world = world;

        const path = this._world.findPath(self.position, toPosition);
        if (path) {
            this
            this._path = path;
        }
        else this._path = undefined;

        if (!this._path && callbackEnd)
            callbackEnd(this);

        this._callbackEnd = callbackEnd;
    }

    public update(timeDelta: number): void {
        this._duration -= timeDelta;

        const walkSpeed = 0.125;
        const speed = 0.125;
        let direction: Vector2 | null = null;
        if (this._path && this._path.length > 0) {
            const nextTile = this._path[0];
            const nextTileCenter = nextTile.getCenter();
            const nextTileDistance = nextTileCenter.distance(this._self.position);
            if (nextTileDistance < walkSpeed) {
                this._path.shift();
                this._self.position.set(nextTileCenter.x, nextTileCenter.y);
            }
            else {
                direction = this._self.position.direction(nextTileCenter);

                this._self.position.set(
                    this._self.position.x + direction.x * timeDelta * speed,
                    this._self.position.y + direction.y * timeDelta * speed
                )
            }
        }
        else if (this._callbackEnd) {
            this._callbackEnd(this);
            this._callbackEnd = null;
        }
    }
    
    public remove():void {}
}