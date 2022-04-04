import { Sound } from "@pixi/sound";
import { Sprite, Texture } from "pixi.js";
import { Tile } from "../../tile";
import { World } from "../../world";
import { Player } from "../player";
import { ActorAction } from "../action";

const teleportDuration = 30;

const minRange = 8;
const rangeThickness = 10;

export type DelayActionCallback = (action: TeleportAction) => void;

export class TeleportAction implements ActorAction {
    private _duration: number;
    private _self: Player;
    private _destination!: Tile;
    private _visualFloor = new Sprite(Texture.from('effects/teleportGround.png'));
    private _visualBeam = new Sprite(Texture.from('effects/teleport.png'));
    private _visual: Sprite;
    private _zwapAway = true;

    private _callbackEnd: DelayActionCallback|null;

    public constructor(self: Player, world: World, callbackEnd: DelayActionCallback|null) {
        this._duration = teleportDuration;
        this._self = self;

        this._visual = self['_visual']!;
        const layer = this._visual.parent;
        layer.addChild(this._visualFloor);
        layer.addChild(this._visualBeam);

        this._visualFloor.anchor.set(0.5, 0.5);
        this._visualBeam.anchor.set(0.5, 1);

        const minDistance = Math.ceil(Math.random() * rangeThickness) + minRange;
        const path = world.findPath(self.position, (t)=> !t.solid && t.globalPosition.distance(self.position) > minDistance);
        if (path) {
            this._destination = path[path.length - 1];
        }

        Sound.from({
            url: 'teleport.ogg',
            preload: true,
            autoPlay: true
        });

        this._callbackEnd = callbackEnd;
    }

    public update(deltaTime: number): void {
        this._visualFloor.position.set(this._visual.position.x, this._visual.position.y);
        this._visualBeam.position.set(this._visual.position.x, this._visual.position.y);

        this._duration -= deltaTime;
        if (this._duration <= 0 && this._zwapAway) {
            this._zwapAway = false;
            this._duration = teleportDuration;
            
            const destination = this._destination.getCenter();
            this._self.position.set(destination.x, destination.y);
        }
        else if (this._duration <= 0 && !this._zwapAway) {
            
            this._visualFloor.parent.removeChild(this._visualFloor);
            this._visualBeam.parent.removeChild(this._visualBeam);

            this._visual.visible = true;

            if (this._callbackEnd) {
                this._callbackEnd(this);
            }
        }
        else {
            this._visual.visible = (this._zwapAway && this._duration < teleportDuration / 2) && 
                                   (!this._zwapAway && this._duration > teleportDuration / 2);

            // animate
            const scale = this._zwapAway ? this._duration / teleportDuration : 1 - this._duration / teleportDuration;
            this._visualFloor.scale.set(scale, scale);
            this._visualBeam.scale.set(scale, 1);
        }
    }
    
    public remove():void {}
}