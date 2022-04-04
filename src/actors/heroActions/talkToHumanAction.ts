import { World } from "../../world";
import { ActorAction } from "../action";
import { Hero } from "../hero";
import { Human } from "../human";
import { GoToAction } from "./goToAction";

const talkDuration = 60;

/**
 * An action simulating the hero talking to a human. To 
 * do this, the hero will move close to the human.
 */
export class TalkToHumanAction implements ActorAction {
    private _talkTo: Human;
    private _world: World;
    private _hero: Hero;
    private _speed: number;
    private _callback: (human: Human)=>void;

    private _talkedTo: number = 0;
    private _action?: ActorAction;
    private _talking = false;

    public constructor(hero: Hero, world: World, talkTo: Human, speed: number, callback: (human: Human)=>void) {
        this._hero = hero;
        this._talkTo = talkTo;
        this._world = world;
        this._speed = speed;
        this._callback = callback;
    }

    public update(deltaTime: number, deltaTimeMs: number): boolean {
        // Get the hero close to a human
        if (this._talkTo.position.distance(this._hero.position) > 1) {
            if (this._action instanceof GoToAction === false) {
                this._action = new GoToAction(this._hero, this._world, this._talkTo, this._speed);
            }
            else if (!this._action?.update(deltaTime, deltaTimeMs)) {
                this._action?.remove();
                this._action = undefined;
            }
        }
        // state: start talking when close enough
        else if (!this._talking) {
            this._talkTo.captured(true);
            this._talking = true;
            this._talkedTo = talkDuration;
            
            const lookAt = this._hero.position.direction(this._talkTo.position);
            this._hero.direction.set(lookAt.x, lookAt.y);
            this._talkTo.direction.set(-lookAt.x, -lookAt.y);
        }
        // state: finish talking
        else if (this._talking && this._talkedTo < 0) {
            this._talkTo.captured(false);
            if (this._callback) this._callback(this._talkTo);
            this._talking = false;
            return false;
        }
        else {
            this._talkedTo -= deltaTime;
        }
        return true;
    }

    public remove(): void {
        this._action?.remove();

        // make sure the human being talked to is no longer captured
        if (this._talking) {
            this._talkTo.captured(false)
        }
    }
}