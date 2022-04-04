import { World } from "../../world";
import { Human } from "../human";
import { Player } from "../player";
import { ActorAction } from "./action";

export type DelayActionCallback = (action: ZombifyAction) => void;

export class ZombifyAction implements ActorAction {
    private _duration: number;
    private _self: Player;
    private _other: Human;
    private _world: World;

    private _callbackEnd: DelayActionCallback|null;

    public constructor(world: World, self: Player, other: Human, callbackEnd: DelayActionCallback|null) {
        this._duration = 60;
        this._self = self;
        this._other = other;
        this._world = world;

        this._other.captured(true);

        this._callbackEnd = callbackEnd;
    }

    public update(deltaTime: number): void {
        this._duration -= deltaTime;

        if (this._duration <= 0) {
            this._other.captured(false);
            this._other.zombified = true;

            if (this._callbackEnd) {
                this._callbackEnd(this);
            }
        }
        else {
            // animate
            this._self.lifeforce -= deltaTime / 50;
        }
    }
    
    public remove():void {}
}