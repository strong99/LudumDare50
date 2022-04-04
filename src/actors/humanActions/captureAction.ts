import { Sound } from "@pixi/sound";
import { getVolumePercentage } from "../../config/audio";
import { World } from "../../world";
import { Human } from "../human";
import { Player } from "../player";
import { ActorAction } from "../action";

const captureDuration = 60;
const capturingCost = 0.1;

export type DelayActionCallback = (action: CaptureAction) => void;

export class CaptureAction implements ActorAction {
    private _duration: number;
    private _self: Player;
    private _other: Human;
    private _world: World;

    private _callbackEnd: DelayActionCallback|null;

    public constructor(world: World, self: Player, other: Human, callbackEnd: DelayActionCallback|null) {
        this._duration = captureDuration;
        this._self = self;
        this._other = other;
        this._world = world;

        this._other.captured(true);

        Sound.from({
            url: 'suck.ogg',
            preload: true,
            autoPlay: true,
            volume: getVolumePercentage()
        });

        this._callbackEnd = callbackEnd;
    }

    public update(deltaTime: number): void {
        this._duration -= deltaTime;

        if (this._duration <= 0) {
            this._other.captured(false);
            this._other.died();

            if (this._callbackEnd) {
                this._callbackEnd(this);
            }
        }
        else {
            // animate
            this._self.lifeforce += deltaTime * capturingCost;

            // find entities in the area while capturing, and set them to panic
            const humans = this._world.filterEntities(p=>p instanceof Human) as Human[];
            for(const human of humans)
                human.panic = true;
        }
    }

    public remove():void {}
}