import { World } from "../../world";
import { ActorAction } from "../action";
import { Hero } from "../hero";
import { Human } from "../human";
import { GoToAction } from "./goToAction";

const talkDuration = 60;

/**
 * Let's the Hero inspect the a corpse for a 
 * given duration before finishing this action.
 */
export class InspectBodyAction implements ActorAction {
    public get corpse() { return this._corpse; }
    private _corpse: Human;

    private _world: World;
    private _hero: Hero;
    private _speed: number;

    private _talkedTo: number = 0;
    private _action?: ActorAction;
    private _inspecting = false;

    public constructor(hero: Hero, world: World, corpse: Human, speed: number) {
        this._hero = hero;
        this._corpse = corpse;
        this._world = world;
        this._speed = speed;
    }

    public update(deltaTime: number, deltaTimeMs :number): boolean {
        if (this._corpse.position.distance(this._hero.position) > 1) {
            if (this._action instanceof GoToAction === false) {
                this._action = new GoToAction(this._hero, this._world, this._corpse, this._speed);
            }
            else  {
                this._action?.update(deltaTime, deltaTimeMs);
            }
        }
        else if (!this._inspecting) {
            this._inspecting = true;
            this._talkedTo = talkDuration;
        }
        else if (this._inspecting && this._talkedTo < 0) {
            this._inspecting = false;
            return false;
        }
        else {
            this._talkedTo -= deltaTime;
        }
        return true;
    }

    public remove(): void {
        
    }
}