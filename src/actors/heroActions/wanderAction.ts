import { World } from "../../world";
import { ActorAction } from "../action";
import { Hero } from "../hero";
import { GoToAction } from "./goToAction";

const tileSearchArea = 32;

/**
 * Let's the hero wander to a random location on the map
 */
export class WanderAction implements ActorAction {
    private _world: World;
    private _hero: Hero;
    private _speed: number;

    private _action: GoToAction;

    public constructor(hero: Hero, world: World, speed: number) {
        this._hero = hero;
        this._world = world;
        this._speed = speed;

        // find an avialable tile 
        const diameter = tileSearchArea;
        const radius = tileSearchArea / 2;

        let tile = this._world.getTile(this._hero.position.x + Math.floor(Math.random() * diameter) - radius, this._hero.position.y + Math.floor(Math.random() * diameter) - radius);
        while(!tile || tile.solid) {
            tile = this._world.getTile(this._hero.position.x + Math.floor(Math.random() * diameter) - radius, this._hero.position.y + Math.floor(Math.random() * diameter) - radius);
        }

        // walks to the destination
        this._action = new GoToAction(hero, this._world, tile.getCenter(), this._speed);
    }

    public update(deltaTime: number, deltaTimeMs: number): boolean {
        return this._action?.update(deltaTime, deltaTimeMs) || false;
    }

    public remove(): void {
        this._action?.remove();
    }
}