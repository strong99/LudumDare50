import { Entity } from "../../entities/entity";
import { World } from "../../world";
import { ActorAction } from "../action";
import { Hero } from "../hero";
import { GoToAction } from "./goToAction";

const newRouteSearchFrameInterval = 30;

export class FollowAction implements ActorAction {
    public get follow() { return this._follow; }
    private _follow: Entity;

    private _world: World;
    private _speed: number;
    private _hero: Hero;

    private _reroute = 0;
    private _action?: ActorAction;

    public constructor(hero: Hero, world: World, follow: Entity, speed: number) {
        this._hero = hero;
        this._follow = follow;
        this._world = world;
        this._speed = speed;
    }

    public update(deltaTime: number, deltaTimeMs: number): boolean {
        this._reroute -= deltaTime;
        if (this._reroute < 0) {
            this._reroute = newRouteSearchFrameInterval;
            this._action = new GoToAction(this._hero, this._world, this._follow, this._speed);
        }
        if (!this._action?.update(deltaTime, deltaTimeMs)) {
            this._action = undefined;
        }
        return true;
    }

    public remove(): void {
        
    }
}