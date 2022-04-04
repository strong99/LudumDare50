import { Sprite } from "@pixi/sprite";
import { Container, Texture } from "pixi.js";
import { Vector2 } from "./vector2";
import { Chunk } from "./world";
import { worldSettings } from "./worldSettings";
import { ITile } from "./pathfinding/classicPathfinder";

const tileSize = worldSettings.tileSize;

const tiles: { [key:string]: Array<string> } = {
    "grass": [ "grass" ],
    "road": [ "road_01", "road_02", "road_03" ],
    "water": [ "water" ],
    "dirt": [ "dirt" ]
}

/**
 * Indicates the order of tile type
 * The left side name is the tile neighbour, the second 
 * name is the current tile checking for transitions
 */
const tileTransitions = [
    "grass:dirt",
    "grass:road",
    "grass:water",
    "dirt:water",
    "road:water"
];

export interface TileData {
    /** Indicates whether actors can move through or not */
    solid: boolean;
    door: boolean;
    type: string;
}

export interface LayerInfo {
    bottomLayer: Container;
    tileLayer?: Container;
    uiLayer?: Container;
    topLayer: Container;
}

export class Tile implements ITile<Tile> {
    public get type(): string { return this._type; }
    public set type(value) { this._type = value; this.refreshVisual(); }
    private _type: string = 'grass';

    /** Indicates whether actors can move through or not */
    public get solid() { return this._solid;}
    public set solid(value: boolean) { 
        this._door = false;
        this._solid = value; 
        this.refreshVisual(); 
    }
    private _solid = false;

    /** Position of the tile in the chunk, changing this does not affect tile position */
    public readonly position: Vector2;

    /** Position of the tile globally, changing this does not affect tile position */
    public readonly globalPosition: Vector2;

    /** Visual indicating the tiles state */
    private _visual: Sprite = new Sprite(Texture.from('editor/tileSolid.png'));
    private _visualFloor: Sprite = new Sprite();
    private _visualTransition: Array<Sprite>|null=null;
    private _layerInfo: LayerInfo;

    public get neighbours(): ReadonlyArray<Tile> { return this._neighbours!; }
    private _neighbours: Array<Tile>|null = null;

    public get chunk() { return this._chunk; }
    private _chunk: Chunk;

    public get door() { return this._door; }
    public set door(value) { this._door = value; this._solid = false; this.refreshVisual(); }
    private _door = false;

    private _alt = Math.floor(Math.random() * 1000);

    public constructor(chunk: Chunk, data: TileData, layerInfo: LayerInfo, position: Vector2) {
        this._chunk = chunk;
        this.position = position;
        this.globalPosition = this._chunk.ToGlobal(this.position);
        this._solid = data.solid;
        this._door = data.door;
        this._type = data.type;
        this._layerInfo = layerInfo;
        this._layerInfo.bottomLayer.addChild(this._visualFloor);
        this._layerInfo.topLayer.addChild(this._visual);
        this.refreshVisual();
    }

    /**
     * Caches the neighbours for quicker looking up (takes up memory)
     */
    public cache() {
        this._neighbours = [
            this._chunk.world.getTile(this.globalPosition.x - 1, this.globalPosition.y),
            this._chunk.world.getTile(this.globalPosition.x + 1, this.globalPosition.y),
            this._chunk.world.getTile(this.globalPosition.x, this.globalPosition.y - 1),
            this._chunk.world.getTile(this.globalPosition.x, this.globalPosition.y + 1)
        ].filter(p => p) as Tile[]; // filter any nulls

        this.refreshVisual();
    }

    /**
     * Checks the visual appearance and updates the textures, tints and other. Call 
     * this when visual related properties are changed
     */
    public refreshVisual() {
        this._visual.visible = localStorage[worldSettings.editorEnabledStorageKey] === 'true' && (this._solid || this._door);
        //this._visual.texture = Texture.from(this._solid ? 'editor/tileSolid.png' : 'editor/tileOpen.png');
        this._visual.position.set(this.globalPosition.x * tileSize, this.globalPosition.y * tileSize);
        this._visual.alpha = this._door ? 0.5 : 0.25;
        this._visual.tint = this._door ? 0xff0000 : 0x000000;

        const tileAlts = tiles[this.type];
        const tileStr = tileAlts[this._alt % tileAlts.length];

        this._visualFloor.texture = Texture.from(`tiles/${tileStr}.png`);
        this._visualFloor.position.set(this.globalPosition.x * tileSize, this.globalPosition.y * tileSize);
        

        if (this._visualTransition) {
            for(const transition of this._visualTransition)
                transition.parent.removeChild(transition);
            this._visualTransition.length = 0;
        }

        // find any tile with a different type
        if (this._neighbours) {
            const key = (t: Tile) => `${t.type}:${this.type}`;
            const otherTypedNeighbours = this._neighbours.filter(p=>p.type != this.type && tileTransitions.includes(key(p))).sort((a, b)=> tileTransitions.indexOf(key(b)) - tileTransitions.indexOf(key(a)));
            if (otherTypedNeighbours.length > 0) {
                if (!this._visualTransition) this._visualTransition = [];
                for(const neighbour of otherTypedNeighbours) {
                    const key = `${neighbour.type}_${this.type}`;
                    const direction = this.globalPosition.direction(neighbour.globalPosition);
                    let directionStr = null;
                    if (direction.x < -0.5) directionStr = "west";
                    else if (direction.x > 0.5) directionStr = "east";
                    else if (direction.y < -0.5) directionStr = "north";
                    else if (direction.y > 0.5) directionStr = "south";
                    if (directionStr) {
                        const visualTransition = new Sprite(Texture.from(`tiles/${key}_${directionStr}.png`));
                        this._visualFloor.addChild(visualTransition);
                        this._visualTransition.push(visualTransition);
                    }
                }
            }
        }
    }

    public getCenter() {
        return new Vector2(this.globalPosition.x + 0.5, this.globalPosition.y + 0.5);
    }

    /**
     * Removes all effects and loaded assets from use
     */
    public remove() {
        this._visual.parent.removeChild(this._visual);
    }

    public export(): TileData {
        return {
            solid: this.solid || false,
            door: this.door || false,
            type: this.type
        };
    }
}
