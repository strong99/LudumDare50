import { Vector2 } from "../vector2";
import { worldSettings } from "../worldSettings";
import { Pathfinder } from "./pathfinding";

export type IEndCallback<Tile extends ITile<Tile>> = (t: Tile) => boolean;

export interface ITile<Tile extends ITile<Tile>> {
    solid?: boolean;
    type: string;
    position: Vector2;
    globalPosition: Vector2;
    neighbours: ReadonlyArray<Tile>;
}
export interface IChunk<Tile extends ITile<Tile>> {
    position: Vector2;
    tiles: ReadonlyArray<ReadonlyArray<Tile>>
}
export interface IWorld<Chunk extends IChunk<Tile>, Tile extends ITile<Tile>> {
    chunks: ReadonlyArray<ReadonlyArray<Chunk>>;
}

export class ClassicPathfinder<Tile extends ITile<Tile>> implements Pathfinder<Tile> {
    private _world: IWorld<IChunk<Tile>, Tile>;

    public constructor(world: IWorld<IChunk<Tile>, Tile>) {
        this._world = world;
    }

    private createPath(ITile: Tile, cameFrom: Array<{ from: Tile, to: Tile }>) {
        const total_path = [ITile];
        while (cameFrom.some(p => p.to == ITile)) {
            ITile = cameFrom.find(p => p.to == ITile)!.from;
            total_path.unshift(ITile);
        }
        return total_path;
    }

    public findPath(start: Vector2, end: Vector2|IEndCallback<Tile>): Tile[]|null {
        let endTile: Tile | null = null;
        if (end instanceof Vector2) {
            endTile = this.getTile(end.x, end.y);
            if (endTile && !endTile.neighbours.some(p => p?.solid != true)) {
                return null;
            }
        }
        else if (typeof end !== 'function') {
            return null;
        }

        const startTile = this.getTile(start.x, start.y);

        if (!startTile)
            return null;

        const d = (a: Tile, b: Tile): number => {
            if (b.solid) return 100;
            else if (b.type?.includes('road')) return 1;
            return 10;
        }

        const h = (a: Tile): number => {
            return endTile ? (end as Vector2).distance(a.position) : 0;
        }

        const open: Array<Tile> = [startTile];
        const gScore: Array<{ ITile: Tile, score: number }> = [{ ITile: startTile, score: 0 }];
        const fScore: Array<{ ITile: Tile, score: number }> = [{ ITile: startTile, score: h(startTile) }];

        const cameFrom: Array<{ from: Tile, to: Tile }> = [];

        while (open.length > 0) {
            const current = fScore.sort((a, b) => a.score - b.score + (Math.random() - 0.5) / 10).find(p => open.includes(p.ITile))?.ITile!;
            if ((endTile && current == endTile) || (!endTile && (end as IEndCallback<Tile>)(current))) {
                return this.createPath(current, cameFrom);
            }

            open.splice(open.indexOf(current), 1);

            if (current?.solid && current !== startTile) {
                const previousFromSolid = cameFrom.find(p => p.to == current)?.from?.solid;
                if (!previousFromSolid) {
                    continue;
                }
            }

            const neighbours = current.neighbours.filter(p => !p.solid || current.solid);
            for (const neighbour of neighbours) {
                const tentative_score = gScore.find(p => p.ITile == current)!.score + d(current, neighbour);
                if (tentative_score < (gScore.find(p => p.ITile == neighbour)?.score ?? Number.POSITIVE_INFINITY)) {
                    const cameFromItem = cameFrom.find(p => p.to == neighbour);
                    if (cameFromItem) cameFromItem.from = current;
                    else cameFrom.push({ from: current, to: neighbour });

                    const gScoreItem = gScore.find(p => p.ITile == neighbour);
                    if (gScoreItem) gScoreItem.score = tentative_score;
                    else gScore.push({ ITile: neighbour, score: tentative_score });

                    const fScoreItem = fScore.find(p => p.ITile == neighbour);
                    if (fScoreItem) fScoreItem.score = tentative_score + h(neighbour);
                    else fScore.push({ ITile: neighbour, score: tentative_score + h(neighbour) });

                    if (!open.includes(neighbour))
                        open.push(neighbour);
                }
            }
        }

        return null;
    }

    public getTile(x: number, y: number): Tile|null {
        const cx = Math.floor(x / worldSettings.chunkSize);
        const cy = Math.floor(y / worldSettings.chunkSize);
        if (cx < 0 || cx >= this._world.chunks.length || 
            cy < 0 || cy >= this._world.chunks[cx].length) {
            return null;
        }

        const chunk = this._world.chunks[cx][cy];
        const tx = Math.floor(x) % worldSettings.chunkSize;
        const ty = Math.floor(y) % worldSettings.chunkSize;
        if (chunk && tx >= 0 && tx < chunk.tiles.length) {
            return chunk.tiles[tx][ty] || null;
        }
        return null;
    }
}