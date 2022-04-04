import { IChunk, IEndCallback, ITile, IWorld } from "./classicPathfinder";
import { Pathfinder } from "./pathfinding";
import { Vector2 } from "../vector2";
import { worldSettings } from "../worldSettings";

export class ModernPathfinder<Tile extends ITile<Tile>> implements Pathfinder<Tile> {
    private _world: IWorld<IChunk<Tile>, Tile>;

    public constructor(world: IWorld<IChunk<Tile>, Tile>) {
        this._world = world;
    }

    private createPath(tile: Tile, all: Array<Tile>, cameFrom: Array<number>) {
        const total_path = [tile];
        let idx = all.indexOf(tile);
        while (cameFrom[(idx = all.indexOf(tile))] !== undefined) {
            tile = all[cameFrom[idx]];
            total_path.unshift(tile);
        }
        return total_path;
    }

    public findPath(start: Vector2, end: Vector2|IEndCallback<Tile>) {
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

        function d(a: Tile, b: Tile): number {
            if (b.solid) return 100;
            else if (b.type?.includes('road')) return 1;
            return 10;
        }

        function h(a: Tile): number {
            return endTile ? (end as Vector2).distance(a.position) : 0;
        }

        const all: Array<Tile> = [startTile];
        const open: Array<Tile> = [startTile];
        const gScore: Array<number> = [ 0 ];
        const fScore: Array<number> = [ h(startTile) ];

        const cameFrom: Array<number> = [];

        function getCheapest(): Tile {
            let cheapestTile = open[0];
            let cheapestScore = Number.POSITIVE_INFINITY;
            for(const item of open) {
                const itemIdx = all.indexOf(item);
                const score = fScore[itemIdx]
                if (score < cheapestScore) {
                    cheapestScore = score;
                    cheapestTile = item;
                }
            }
            return cheapestTile;
        }

        while (open.length > 0) {
            const current = getCheapest();
            //const current = fScore.sort((a, b) => a.score - b.score + (Math.random() - 0.5) / 10).find(p => open.includes(p.ITile))?.ITile!;
            if ((endTile && current == endTile) || (!endTile && (end as IEndCallback<Tile>)(current))) {
                return this.createPath(current, all, cameFrom);
            }

            open.splice(open.indexOf(current), 1);

            let currentIdx = all.indexOf(current);
            if (current?.solid && current !== startTile) {
                const previousFromSolid = all[cameFrom[currentIdx]]?.solid;
                if (!previousFromSolid) {
                    continue;
                }
            }

            const neighbours = current.neighbours.filter(p => !p.solid || current.solid);
            for (const neighbour of neighbours) {
                let neighbourIdx = all.indexOf(neighbour);
                if (neighbourIdx < 0) {
                    neighbourIdx = all.length;
                    all.push(neighbour);
                }

                const tentative_score = gScore[currentIdx] + d(current, neighbour);
                const existingScore = gScore[neighbourIdx] ?? Number.POSITIVE_INFINITY;
                if (tentative_score < existingScore) {
                    cameFrom[neighbourIdx] = currentIdx;
                    gScore[neighbourIdx] = tentative_score;
                    fScore[neighbourIdx] = tentative_score + h(neighbour);

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