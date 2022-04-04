import { Sound } from "@pixi/sound";
import { Sprite, Texture } from "pixi.js";
import { getVolumePercentage } from "../config/audio";
import { EntityData } from "../entities/entity";
import { ImageEntity, ImageEntityData } from "../entities/imageEntity";
import { LayerInfo, Tile } from "../tile";
import { Vector2 } from "../vector2";
import { World } from "../world";
import { Player } from "./player";

const walkSpeed  = 0.04;
const runSpeed  = 0.125;

export interface HumanEntityData extends ImageEntityData {

}

// check to avoid double audio effects
let someoneInPanic: boolean = false;

export class Human extends ImageEntity {
    private _world: World;
    private _path: Tile[]|null = null;

    public get panic() { return this._panic > 0; }
    public set panic(value: boolean) { 
        if (!this.panic) { 
            this._panic = value ? 100 : 0; 
            this._path = null; 
            if (this.panic && !someoneInPanic) {
                const panicAlt = Math.floor(Math.random() * 2) + 1;
                const panicAltStr = panicAlt.toFixed(0).padStart(2, '0');
                Sound.from({
                    url: `panic_${panicAltStr}.ogg`,
                    preload: true,
                    autoPlay: true,
                    volume: getVolumePercentage(),
                    complete: ()=>someoneInPanic = false
                });
            }
        } 
    }
    private _panic = 0;

    private _icon: Sprite = new Sprite();

    public get zombified() { return this._zombified; }
    public set zombified(value) { 
        this._zombified = value; 

        this._path = null;
        if (!value) {
            this._icon.visible = false;
        } else if (value) {
            this._icon.visible = true;
            this._icon.texture = Texture.from('ui/zombified.png');
            this._icon.anchor.set(0.5, 1);
        }
    }
    private _zombified = false;

    public captured(value: boolean) { this._captured = value; }
    private _captured = false;

    public died() { 
        this._alive = false; 
        if (this._visual) {
            this._visual.scale.y = 0.5; 
            this._visual.texture = Texture.from(`actors/human_${this._alternative.toFixed(0).padStart(2, '0')}_front.png`);
            this._visual.anchor.y = 0;
        }
    }

    public get dead() { return !this._alive; }
    private _alive = true;

    private _alternative = 0;

    public constructor(world: World, layerInfo: LayerInfo, data: EntityData | HumanEntityData) {
        super(layerInfo, data);

        layerInfo.topLayer.addChild(this._icon);
        
        this._alternative = Math.floor(Math.random() * 2 + 1);

        this._world = world;
    }

    public update(timeDelta: number) {
        if (!this._alive)
            return;

        let direction: Vector2|null = null;
        if (!this._captured) {
            if (this._visual) {
                this._icon.position.set(
                    this._visual.position.x,
                    this._visual.position.y - this._visual?.height
                );
            }

            if (this._zombified) {
                const player = this._world.findEntity(p=>p instanceof Player);
                if (player) {
                    if (!this._path || this._path.length == 0) {
                            this._path = this._world.findPath(this.position, player.position);
                    }
                    else if (player.position.distance(this.position) < 2) {
                        this._path = null;
                    }
                }
            }
            else if (this.panic) {
                this._panic -= timeDelta;
                if (!this._path) {
                    const player = this._world.findEntity(p=>p instanceof Player);
                    if (player) {
                        this._path = this._world.findPath(this.position, t => !t.solid && player.position.distance(t.globalPosition) > 9);
                    }
                }
            }

            if (this._path && this._path.length > 0) {
                const nextTile = this._path[0];
                const nextTileCenter = nextTile.getCenter();
                const nextTileDistance = nextTileCenter.distance(this.position);
                if (nextTileDistance < walkSpeed) {
                    this._path.shift();
                    this.position.set(nextTileCenter.x, nextTileCenter.y);
                }
                else {
                    direction = this.position.direction(nextTileCenter);

                    const speed = this.panic ? runSpeed : walkSpeed;

                    this.position.set(
                        this.position.x + direction.x * timeDelta * speed,
                        this.position.y + direction.y * timeDelta * speed
                    )
                }
            }
            else {
                //find a door
                const doorPath = this._world.findDoor(this.position, 10 + Math.random() * 50, 100);
                if (doorPath) {
                    this._path = doorPath;
                }
                else {
                    const tile = this._world.getTile(this.position.x + Math.floor(Math.random() * 32) - 16, this.position.y + Math.floor(Math.random() * 32) - 16);
                    if (tile && tile.solid !== true) {
                        this._path = this._world.findPath(this.position, tile.globalPosition);
                    }
                    else  {
                        console.warn("unable to locate tile");
                    }
                }
            }
        }

        if (direction) {
            this._direction = direction;
        }
        else {
            direction = this._direction;
        }

        if (this._visual) {
            let directionStr = this._directionStr;
            if (direction.y > 0.5) directionStr = 'front';
            else if (direction.y < -0.5) directionStr = 'back';
            else if (direction.x > 0.5) directionStr = 'right';
            else if (direction.x < -0.5) directionStr = 'left';

            if (this._directionStr !== directionStr) {
                this._frame = 0;
                this._directionStr = directionStr;
            }
            this._nextFrame -= timeDelta;
            if (this._captured) {
                this._frame = 0;
                this._nextFrame = 5;
            }
            else if (this._nextFrame < 0) {
                this._nextFrame = 5;
                this._frame = (this._frame + 1) % 4;
            }

            const frameStr = this._frame.toString().padStart(2, '0').substring(-2);
            let animated = `actors/human_${this._alternative.toFixed(0).padStart(2, '0')}_walk_${directionStr}_${frameStr}.png`;
            this._visual.texture = Texture.from(animated);
            this._visual.anchor.set(0.5, 0.97);
        }
    }

    public get direction() { return this._direction; }
    private _direction: Vector2 = new Vector2(0, 0);

    private _directionStr: string = "front";
    private _frame = 0;
    private _nextFrame = 0;

    public override remove(): void {
        super.remove();
    }

    public override export(): HumanEntityData {
        const base = super.export() as HumanEntityData;

        base.type = 'human';
        base.visual = this._data.visual;

        return base;
    }
}