import { Human } from "../human";
import { Player } from "../player";
import { ActorAction } from "../action";

const zombifyingDuration = 60;
const zombyfingCost = 0.02;

export type DelayActionCallback = (action: ZombifyAction) => void;

export class ZombifyAction implements ActorAction {
    private _duration: number;
    private _self: Player;
    private _other: Human;

    private _callbackEnd: DelayActionCallback|null;

    public constructor(self: Player, other: Human, callbackEnd: DelayActionCallback|null) {
        this._duration = zombifyingDuration;
        this._self = self;
        this._other = other;

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
            this._self.lifeforce -= deltaTime * zombyfingCost;
        }
    }
    
    public remove():void {}
}