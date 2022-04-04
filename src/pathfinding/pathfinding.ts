import { Vector2 } from "../vector2";
import { IEndCallback, ITile } from "./classicPathfinder";

export interface Pathfinder<Tile extends ITile<Tile>> {
    findPath(start: Vector2, end: Vector2|IEndCallback<Tile>): Tile[]|null;
}