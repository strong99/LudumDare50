import { Container } from "@pixi/display";
import { IChunk, IEndCallback, IWorld } from "./pathfinding/classicPathfinder";
import { Entity, EntityData } from "./entities/entity";
import { ImageEntity } from "./entities/imageEntity";
import { TileData, LayerInfo, Tile } from "./tile";
import { Vector2 } from "./vector2";
import { worldSettings } from "./worldSettings";
import { Pathfinder } from "./pathfinding/pathfinding";
import { ModernPathfinder } from "./pathfinding/modernPathfinder";
import { getEditorEnabled } from "./config/editor";

export interface ChunkData {
    tiles: Array<Array<TileData>>;
    entities?: Array<EntityData>;
}

export interface WorldData {
    chunks: Array<Array<ChunkData>>;
}

export class Chunk implements IChunk<Tile> {
    private _tileLayer: Container;
    private _bottomLayer: Container;
    private _topLayer: Container;

    public get tiles(): ReadonlyArray<ReadonlyArray<Tile>> { return this._tiles; }
    private _tiles: Array<Array<Tile>> = [];

    public get entities(): Array<Entity> { return this._entities; }
    private _entities: Array<Entity> = [];

    public get world() { return this._world; }
    private _world: World;

    public readonly position: Vector2;

    public get neighbours(): ReadonlyArray<Chunk> { return this._neighbours!; }
    private _neighbours: Array<Chunk> | null = null;

    public ToGlobal(position: Vector2): Vector2 { return new Vector2(position.x + this.position.x * worldSettings.chunkSize, position.y + this.position.y * worldSettings.chunkSize); }

    public constructor(world: World, data: ChunkData, layerInfo: LayerInfo, position: Vector2) {
        this._world = world;
        this.position = position;
        this._bottomLayer = layerInfo.bottomLayer;
        this._tileLayer = layerInfo.tileLayer!;
        this._topLayer = layerInfo.topLayer;

        this.import(data);
    }

    public cache() {
        const xLength = this._tiles.length;
        for (let x = 0; x < xLength; x++) {
            const yLength = this._tiles[x].length;
            for (let y = 0; y < yLength; y++) {
                this._tiles[x][y].cache();
            }
        }

        this._neighbours = [
            this.position.x > 0 ? this.world.chunks[this.position.x - 1][this.position.y] : null,
            this.position.x + 1 < this.world.chunks.length ? this.world.chunks[this.position.x + 1][this.position.y] : null,
            this.world.chunks[this.position.x][this.position.y - 1],
            this.world.chunks[this.position.x][this.position.y + 1]
        ].filter(p => p) as Chunk[]; // filter any nulls
    }

    public remove() {
        const xLength = this._tiles.length;
        for (let x = 0; x < xLength; x++) {
            const yLength = this._tiles[x].length;
            for (let y = 0; x < yLength; y++) {
                this._tiles[x][y].remove();
            }
        }
    }

    /**
     * Exports the world and its tiles to a simple json format
     */
    public export(): ChunkData {
        const toExportTiles: Array<Array<TileData>> = [];
        for (let x = 0; x < this._tiles.length; x++) {
            const row = [];
            for (let y = 0; y < this._tiles[x].length; y++) {
                row.push(this._tiles[x][y].export());
            }
            toExportTiles.push(row);
        }

        const toExportEntities: Array<EntityData> = [];
        for (const entity of this._entities)
            toExportEntities.push(entity.export());

        return {
            tiles: toExportTiles,
            entities: toExportEntities
        };
    }

    /**
     * Exports the world and its tiles to a simple json format
     */
    public import(data: ChunkData): void {
        const { tiles, entities } = data;

        // remove all existing tiles, before importing the new ones
        for (let x = 0; x < this._tiles.length; x++) {
            for (let y = 0; y < this._tiles[x].length; y++) {
                this._tiles[x][y].remove();
            }
        }
        this._tiles.length = 0;

        // import new tiles
        for (let x = 0; x < tiles.length; x++) {
            const row = [];
            for (let y = 0; y < tiles[x].length; y++) {
                const tileData = tiles[x][y];
                const tile = new Tile(this, tileData, {
                    bottomLayer: this._tileLayer,
                    topLayer: this._topLayer
                }, new Vector2(x, y));
                row.push(tile);
            }
            this._tiles.push(row);
        }

        // remove all existing entities
        for (const entity of this._entities) {
            entity.remove();
        }
        this._entities.length = 0;

        if (entities) {
            for (const entityData of entities) {
                let entity: Entity | null = null;

                if (entityData.type === 'image') {
                    entity = new ImageEntity({
                        bottomLayer: this._bottomLayer,
                        topLayer: this._topLayer
                    }, entityData);
                }

                if (entity) {
                    this._entities.push(entity)
                }
            }
        }
    }
}

/**
 * Manages all tiles and decoration visuals
 */
export class World implements IWorld<Chunk, Tile> {
    private _tileLayer: Container;
    private _bottomLayer: Container;
    private _topLayer: Container;

    public get chunks(): ReadonlyArray<ReadonlyArray<Chunk>> { return this._chunks; }
    private _chunks: Array<Array<Chunk>> = [];

    private _pathfinder!: Pathfinder<Tile>;

    public constructor(data: WorldData, bottomLayer: Container, topLayer: Container) {
        this._bottomLayer = bottomLayer;
        this._topLayer = topLayer;

        this._tileLayer = new Container();
        this._bottomLayer.addChild(this._tileLayer);

        this.import(data);
    }

    /**
     * Exports the world and its tiles to a simple json format
     */
    public export(): WorldData {
        const toExportChunks: Array<Array<ChunkData>> = [];
        for (let x = 0; x < this._chunks.length; x++) {
            const row = [];
            for (let y = 0; y < this._chunks[x].length; y++) {
                row.push(this._chunks[x][y].export());
            }
            toExportChunks.push(row);
        }

        return {
            chunks: toExportChunks
        };
    }
    
    private _doors?: Tile[];
    getDoors() {
        if (!this._doors || getEditorEnabled()) {
            const doors = [];
            for(const chunkrow of this.chunks) {
                for(const chunk of chunkrow) {
                    for(const tileRow of chunk.tiles) {
                        for(const tile of tileRow) {
                            if (tile.door) {
                                doors.push(tile);
                            }
                        }
                    }
                }
            }
            this._doors = doors;
        }
        return this._doors;
    }
    
    public findDoor(position: Vector2, minDistance: number, maxDistance: number): Tile[]|null {
        const tile = (()=>{
            const ctx = Math.floor(position.x / worldSettings.chunkSize);
            const cty = Math.floor(position.y / worldSettings.chunkSize);
            //const tmin = Math.floor(minDistance / worldSettings.chunkSize);
            const tmax = Math.floor(maxDistance / worldSettings.chunkSize);

            // calculate chunk boundaries, no need to check all chunks
            const amount = worldSettings.levelSize / worldSettings.chunkSize;
            const txMin = Math.max(0, ctx - tmax);
            const txMax = Math.min(amount, ctx + tmax);
            const tyMin = Math.max(0, cty - tmax);
            const tyMax = Math.min(amount, cty + tmax);

            for(let tx = txMin; tx < txMax; tx++) {
                for(let ty = tyMin; ty < tyMax; ty++) {
                    const chunk = this._chunks[tx][ty];
                    for(const tileRow of chunk.tiles) {
                        for(const tile of tileRow) {
                            if (tile.door) {
                                const d = tile.globalPosition.distance(position);
                                if (d > minDistance && d < maxDistance) {
                                    return tile;
                                }
                            }
                        }
                    }
                }
            }
            return null;
        })();

        if (tile) {
            return this.findPath(position, tile.globalPosition);
        }
        return null;
    }

    /**
     * Exports the world and its tiles to a simple json format
     */
    public import(data: WorldData): void {
        const { chunks } = data;

        // remove all existing tiles, before importing the new ones
        const xLength = this._chunks.length;
        for (let x = 0; x < xLength; x++) {
            const yLength = this._chunks[x].length;
            for (let y = 0; y < yLength; y++) {
                this._chunks[x][y].remove();
            }
        }
        this._chunks.length = 0;

        // import new tiles
        const newXlength= data.chunks.length;
        for (let x = 0; x < newXlength; x++) {
            const newYLength = data.chunks[x].length;
            const row = [];
            for (let y = 0; y < newYLength; y++) {
                const chunkData = chunks[x][y];
                const chunk = new Chunk(this, chunkData, {
                    bottomLayer: this._bottomLayer,
                    tileLayer: this._tileLayer,
                    topLayer: this._topLayer
                }, new Vector2(x, y));
                row.push(chunk);
            }
            this._chunks.push(row);
        }

        for(const row of this._chunks) {
            for(const chunk of row) {
                chunk.cache();
            }
        }

        this._pathfinder = new ModernPathfinder(this);
    }

    public getTile(x: number, y: number): Tile | null {
        const cx = Math.floor(x / worldSettings.chunkSize);
        const cy = Math.floor(y / worldSettings.chunkSize);
        if (cx < 0 || cx >= this._chunks.length || 
            cy < 0 || cy >= this._chunks[cx].length)
            return null;

        const chunk = this._chunks[cx][cy];
        const tx = Math.floor(x) % worldSettings.chunkSize;
        const ty = Math.floor(y) % worldSettings.chunkSize;
        if (chunk && tx >= 0 && tx < chunk.tiles.length) {
            return chunk.tiles[tx][ty] || null;
        }
        return null;
    }

    public findPath(start: Vector2, end: Vector2 | IEndCallback<Tile>): Array<Tile> | null {
        return this._pathfinder.findPath(start, end);
    }

    public findEntity(predicate: (this: void, value: Entity, index: number, obj: Entity[]) => boolean) {
        const xLength = this._chunks.length;
        for (let cx = 0; cx < xLength; cx++) {
            const yLength = this._chunks[cx].length;
            for (let cy = 0; cy < yLength; cy++) {
                const entity = this._chunks[cx][cy].entities.find(predicate);
                if (entity) {
                    return entity;
                }
            }
        }
        return null;
    }

    public someEntity(predicate: (this: void, value: Entity, index: number, obj: Entity[]) => boolean) {
        const xLength = this._chunks.length;
        for (let cx = 0; cx < xLength; cx++) {
            const yLength = this._chunks[cx].length;
            for (let cy = 0; cy < yLength; cy++) {
                const entity = this._chunks[cx][cy].entities.some(predicate);
                if (entity) {
                    return true;
                }
            }
        }
        return false;
    }

    public filterEntities(predicate: (this: void, value: Entity, index: number, obj: Entity[]) => boolean) {
        const all = [];
        const xLength = this._chunks.length;
        for (let cx = 0; cx < xLength; cx++) {
            const yLength = this._chunks[cx].length;
            for (let cy = 0; cy < yLength; cy++) {
                const entities = this._chunks[cx][cy].entities.filter(predicate);
                if (entities && entities.length > 0) {
                    for (const entity of entities)
                        all.push(entity);
                }
            }
        }
        return all;
    }

    public remove() {
        for(const chunkRow of this._chunks)
        for(const chunk of chunkRow)
        for(const entity of chunk.entities)
            entity.remove();
    }
}