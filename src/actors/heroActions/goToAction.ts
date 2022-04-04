import { Entity } from "../../entities/entity";
import { Tile } from "../../tile";
import { Vector2 } from "../../vector2";
import { World } from "../../world";
import { ActorAction } from "../action";
import { Hero } from "../hero";

const newRouteSearchFrameInterval = 20;

/**
 * Simple action that moves the entity towards the given 
 * destination: an other entity, or position. Update returns 
 * false when the action has finished.
 */
export class GoToAction implements ActorAction {
    private _follow: Entity|Vector2;
    private _world: World;
    private _speed: number;
    private _hero: Hero;

    private _path: Tile[]|null;
    private _updatePath = newRouteSearchFrameInterval;

    public constructor(hero: Hero, world: World, follow: Entity|Vector2, speed: number) {
        this._hero = hero;
        this._follow = follow;
        this._world = world;
        this._speed = speed;

        this._path = this._world.findPath(hero.position, follow instanceof Vector2 ? follow : follow.position);
    }

    public update(deltaTime: number, deltaTimeMs: number): boolean {
        // Refresh path when the entity can be moving
        if (this._follow instanceof Entity) {
            this._updatePath -= deltaTime;
            if (this._updatePath < 0) {
                this._path = this._world.findPath(this._hero.position, this._follow.position);
                // skip the tile the entity is standing on, should be the first returned
                if (this._path) this._path.shift();
                this._updatePath = newRouteSearchFrameInterval;
            }
        }

        // If not path is found, or already finished, end this goto task
        if (!this._path || this._path.length == 0)
            return false;

        const nextTile = this._path[0];
        const nextTileCenter = nextTile.getCenter();
        const nextTileDistance = nextTileCenter.distance(this._hero.position);

        // Follow the path/update position
        const distanceToPass = this._speed * deltaTime;
        if (nextTileDistance < distanceToPass) {
            this._path.shift();
            this._hero.position.set(nextTileCenter.x, nextTileCenter.y);
        }
        else {
            const direction = this._hero.position.direction(nextTileCenter);

            this._hero.position.set(
                this._hero.position.x + direction.x * distanceToPass,
                this._hero.position.y + direction.y * distanceToPass
            )
        }

        return true;
    }

    public remove(): void {
        
    }
}