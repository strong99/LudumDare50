import { World } from "../../world";
import { ActorAction } from "../action";
import { Hero } from "../hero";
import { Player } from "../player";
import { FollowAction } from "./followAction";

/**
 * Attempts to kill the player. To accomplish this 
 * the hero will move close to the player before 
 * decreasing the player's life.
 */
export class KillPlayerAction implements ActorAction {
    private _player: Player;
    private _world: World;
    private _hero: Hero;

    private _action?: ActorAction;

    public constructor(hero: Hero, world: World, player: Player) {
        this._hero = hero;
        this._player = player;
        this._world = world;
    }

    public update(deltaTime: number, deltaTimeMs: number): boolean {
        const distance = this._player.position.distance(this._hero.position);
        if (distance > 1) {
            if (this._action instanceof FollowAction === false) {
                this._action = new FollowAction(this._hero, this._world, this._player, 2);
            }
            else {
                const canGoAhead = this._action?.update(deltaTime, deltaTimeMs);
                if (!canGoAhead) {
                    this._action?.remove();
                    this._action = undefined;
                }
            }
        }
        else if (distance > 12) {
            this._hero.action = null;
        }
        else {
            this._player.lifeforce -= deltaTime;
        }
        return this._player.lifeforce > 0;
    }

    public remove(): void {

    }
}