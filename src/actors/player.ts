import { Sound } from "@pixi/sound";
import { Container, Sprite, Texture } from "pixi.js";
import { EntityData } from "../entities/entity";
import { ImageEntity, ImageEntityData } from "../entities/imageEntity";
import { LayerInfo } from "../tile";
import { Vector2 } from "../vector2";
import { World } from "../world";
import { worldSettings } from "../worldSettings";
import { ActorAction } from "./action";
import { CaptureAction } from "./humanActions/captureAction";
import { TeleportAction } from "./humanActions/teleportAction";
import { WalkToAction } from "./humanActions/walkToAction";
import { ZombifyAction } from "./humanActions/zombifyAction";
import { Human } from "./human";

const tileSize = worldSettings.tileSize;

const afterSuckChoices = [
    "actors/player_disgusting.ogg",
    "actors/player_even_more_blood.ogg",
    "actors/player_more_blood.ogg"
];

const almostDeadChoices = [
    "actors/player_so_hungry.ogg",
    "actors/player_so_hungry.ogg",
    "actors/player_even_more_blood.ogg",
    "actors/player_more_blood.ogg"
];

export function moveOnce(who: Player, map: World, direction: Vector2): void  {
    const speed = 0.125;
    const newPosition = new Vector2(
        who.position.x + direction.x * speed, 
        who.position.y + direction.y * speed
    );

    const sizeH = 0.25;
    const sizeW = 0.75;

    const correctX = direction.x > 0 ? sizeW / 2 : -sizeW / 2;
    const correctY = direction.y > 0 ? sizeH / 2 : -sizeH / 2;
    
    const nextTileX1 = map.getTile(newPosition.x + correctX, who.position.y - sizeH / 2);
    const nextTileX2 = map.getTile(newPosition.x + correctX, who.position.y + sizeH / 2);

    const nextTileY1 = map.getTile(who.position.x - sizeW / 2, newPosition.y + correctY);
    const nextTileY2 = map.getTile(who.position.x + sizeW / 2, newPosition.y + correctY);

    const canX = nextTileX1 && !(nextTileX1?.solid || nextTileX1?.door) && nextTileX2 && !(nextTileX2?.solid || nextTileX2?.door);
    const canY = nextTileY1 && !(nextTileY1?.solid || nextTileY1?.door) && nextTileY2 && !(nextTileY2?.solid || nextTileY2?.door);
    
    who.position.set(
        canX ? newPosition.x : who.position.x,
        canY ? newPosition.y : who.position.y,
    );
}

export interface PlayerEntityData extends ImageEntityData {

}


export interface Particle {
    update(timeDelta:number, timeDeltaMs: number): void;
    readonly finished: boolean;
    remove(): void;
}

export class BloodParticle implements Particle {
    public get finished() { return this._finished; }
    private _finished:boolean = false;

    private _start: Vector2;
    private _startDirection = new Vector2(-0.5 + (Math.random() - 0.5) / 2, -0.5 + (Math.random() - 0.5) / 2);
    private _visual: Sprite = new Sprite(Texture.from('bloodParticle.png'));

    public constructor(position: Vector2, container: Container) {
        this._start = new Vector2(window.innerWidth / 2, window.innerHeight / 2 - 100)
        container.addChild(this._visual);
        this._visual.position.set(this._start.x, this._start.y);
        this._visual.anchor.set(0.5, 0.5);
    }

    public update(timeDelta: number, timeDeltaMs: number): void {
        const destination = new Vector2(30, window.innerHeight - 30);
        const distance = this._start.distance(destination);
        if (distance < 10) {
            this._finished = true;
        }
        else {
            const speed = 9;
            const direction = this._start.direction(destination);
            this._startDirection.set(
                (this._startDirection.x * 20 + direction.x) / 21,
                (this._startDirection.y * 20 + direction.y) / 21
            )
            this._visual.position.x += this._startDirection.x * timeDelta * speed;
            this._visual.position.y += this._startDirection.y * timeDelta * speed;
            this._start.set(this._visual.position.x, this._visual.position.y);
        }
    }

    public remove() {
        this._visual.parent.removeChild(this._visual);
    }
}

export class Player extends ImageEntity {
    private _world: World;
    private _keys: { [key: string]: boolean } = {};
    private _action: ActorAction|null = null;

    public get god() { return this._god; }
    public set god(value) { this._god = value; }
    private _god = false;

    private _icon: Sprite = new Sprite();

    public get lifeforce() { return this._lifeforce; }
    public set lifeforce(value: number) { this._lifeforce = value; }
    private _lifeforce = 60;

    public get active() { return this._active; }
    public set active(value: boolean) { this._active = value; }
    private _active = true;

    private _keyup: (e: KeyboardEvent) => void;
    private _keydown: (e: KeyboardEvent) => void;
    private _onClick: (e: MouseEvent) => void;

    private _widget: HTMLElement;

    private _suck: HTMLButtonElement;
    private _zombify: HTMLButtonElement;
    private _teleport: HTMLButtonElement;

    private _activeVoice?: Sound;
    private _canvas: HTMLCanvasElement;


    private _suckCallback: (this: HTMLButtonElement, event: MouseEvent) => void;
    private _zombifyCallback: (this: HTMLButtonElement, event: MouseEvent) => void;
    private _teleportCallback: (this: HTMLButtonElement, event: MouseEvent) => void;

    private _particles: Particle[] = [];

    public constructor(world: World, viewport: Container, layerInfo: LayerInfo, data: EntityData | PlayerEntityData) {
        super(layerInfo, data);

        this._world = world;
        if (!layerInfo.uiLayer)
            throw new Error("Ui layer is required by the player");

        layerInfo.topLayer.addChild(this._icon);

        window.addEventListener('keyup', this._keyup = (e) => {
            this._keys[e.code] = false;
        });
        window.addEventListener('keydown', this._keydown = (e) => {
            this._keys[e.code] = true;
        });
        this._canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
        this._canvas.addEventListener('click', this._onClick = (e) => {
            if (!this._active)
                return;

            const mousePosition = new Vector2(
                (e.pageX - viewport.x) / worldSettings.tileSize,
                (e.pageY - viewport.y) / worldSettings.tileSize
            );
            this._action = new WalkToAction(this._world, this, mousePosition, ()=>{
                this._action = null;
            });
            return false;
        });

        this._widget = document.getElementById('playerActions') as HTMLElement;
        this._widget.classList.add('visible');

        this._suck = this._widget.querySelector('[data-action="suck"]') as HTMLButtonElement;
        this._suck.addEventListener('click', this._suckCallback = (e) => {
            this._keys['Space'] = true;
        });
        this._zombify = this._widget.querySelector('[data-action="zombify"]') as HTMLButtonElement;
        this._zombify.addEventListener('click', this._zombifyCallback = (e) => {
            this._keys['KeyE'] = true;
        });
        this._teleport = this._widget.querySelector('[data-action="teleport"]') as HTMLButtonElement;
        this._teleport.addEventListener('click', this._teleportCallback = (e) => {
            this._keys['KeyQ'] = true;
        });

        if (this._visual)
            this._previousPosition = new Vector2(this._visual.x, this._visual.y);
    }

    private _max: number = 0;
    private _age: number = 0;
    private _previousPosition: Vector2 = new Vector2(0, 0);
    public update(timeDelta: number, timeDeltaMs: number) {
        const toRemove = [];
        for(const particle of this._particles) {
            particle.update(timeDelta, timeDeltaMs);
            if (particle.finished) {
                toRemove.push(particle);
            }
        }
        for(const toRmoveItem of toRemove) {
            toRmoveItem.remove();
            const idx = this._particles.indexOf(toRmoveItem);
            this._particles.splice(idx, 1);
        }

        const difficulty = Math.max(0, this._max - 60) / 60;
        if (this._active) {
            if (this._lifeforce <= 0 && !this._god) {
                return;
            }

            this._age += timeDeltaMs;

            if (!this._god) {
                this._lifeforce -= timeDelta / (100 / (difficulty * 4));
            }
        }

        if (this._visual && this._icon.visible) {
            const scalar = 1 + Math.cos(this._age / 20) / 8;
            this._icon.scale.set(scalar, scalar);
            this._icon.position.set(
                this._visual.position.x,
                this._visual.position.y - this._visual?.height
            );
        }

        this._max = Math.max(this._max, this.lifeforce);

        let direction: Vector2|null = null;
        let dx = 0;
        let dy = 0;
        if (this._action) {
            this._action.update(timeDelta, timeDeltaMs);
        }
        else if (this._active) { 
            this._icon.visible = false;
            if (this._keys['Space']) {
                this._keys['Space'] = false;
                this.lifeforce -= 1;
                
                // find any human near you
                const victim = this._world.findEntity(p=>p instanceof Human && !p.dead && p.position.distance(this.position) < 0.75);
                if (victim instanceof Human) {
                    this._action = new CaptureAction(
                        this._world,
                        this, 
                        victim,
                        a => {
                            this.lifeforce += (5 * difficulty);
                            this._action = null;

                            const uiLayer = this._layerInfo.uiLayer!;
                            this._particles.push(new BloodParticle(new Vector2(this._visual!.position.x, this._visual!.position.y), uiLayer));
                            this._particles.push(new BloodParticle(new Vector2(this._visual!.position.x, this._visual!.position.y), uiLayer));
                            this._particles.push(new BloodParticle(new Vector2(this._visual!.position.x, this._visual!.position.y), uiLayer));
                            this._particles.push(new BloodParticle(new Vector2(this._visual!.position.x, this._visual!.position.y), uiLayer));

                            this._activeVoice?.stop();
                            this._activeVoice = Sound.from({
                                url: afterSuckChoices[Math.floor(Math.random() * afterSuckChoices.length)],
                                autoPlay: true,
                                preload: true
                            });
                        }
                    );

                    this._icon.visible = true;
                    this._icon.texture = Texture.from('ui/fangs.png');
                    this._icon.anchor.set(0.5, 1);
                }
            }
            else if (this._keys['KeyQ']) {
                this._keys['KeyQ'] = false;
                this.lifeforce -= 2;
                // find any human near you
                this._action = new TeleportAction(
                    this, 
                    this._world,
                    a => {
                        this.lifeforce -= 15;
                        this._action = null;
                    }
                );
            }
            else if (this._keys['KeyE']) {
                this._keys['KeyE'] = false;
                // find any human near you
                const victim = this._world.findEntity(p=>p instanceof Human && !p.dead && !p.zombified && p.position.distance(this.position) < 0.75);
                if (victim instanceof Human) {
                    this._action = new ZombifyAction(
                        this, 
                        victim,
                        a => {
                            this.lifeforce -= 15;
                            this._action = null;
                        }
                    );
                }
            }
            else {
                if (this._keys['KeyW']) dy -= 1;
                if (this._keys['KeyS']) dy += 1;
                if (this._keys['KeyA']) dx -= 1;
                if (this._keys['KeyD']) dx += 1;

                if (dx != 0 || dy != 0) {
                    direction = new Vector2(dx, dy);

                    moveOnce(this, this._world, direction);
                    
                    if (this._visual) {
                        this._visual.position.set(this.position.x * tileSize, this.position.y * tileSize);
                    }
                }
            }
        }

        this._voiceRetry -= timeDelta;
        if (this._lifeforce < 10 && (!this._activeVoice || !this._activeVoice.isPlaying) && this._voiceRetry < 0) {
            this._voiceRetry = 30;
            this._activeVoice?.stop();
            this._activeVoice = Sound.from({
                url: almostDeadChoices[Math.floor(Math.random() * almostDeadChoices.length)],
                autoPlay: true,
                preload: true
            });
        }

        // update visuals appearance based on direction
        if (this._visual) {
            let distance = this._previousPosition.distance(this.position);
            let direction = this._previousPosition.direction(this.position);
            if (direction && (direction.x !== 0 || direction.y !== 0)) {
                this._direction = direction;
            }
            else {
                direction = this._direction;
            }

            let directionStr = 'front';
            if (direction.y > 0.5) directionStr = 'front';
            else if (direction.y < -0.5) directionStr = 'back';
            else if (direction.x > 0.5) directionStr = 'right';
            else if (direction.x < -0.5) directionStr = 'left';

            if (this._directionStr !== directionStr) {
                this._frame = 0;
                this._directionStr = directionStr;
            }
            this._nextFrame -= timeDelta;
            if (this._nextFrame < 0) {
                this._nextFrame = 5;
                this._frame = (this._frame + 1) % 4;
            }
            if (distance < 0.01) this._frame = 0;
            
            const frameStr = this._frame.toString().padStart(2, '0').substring(-2);
            let animated = `actors/player_walk_${directionStr}_${frameStr}.png`;
            this._visual.texture = Texture.from(animated);
            this._visual.anchor.set(0.5, 0.97);
        }
        this._previousPosition.set(
            this.position.x,
            this.position.y
        );
    }
    private _direction: Vector2 = new Vector2(0, 0);
    private _directionStr: string = "front";
    private _frame = 0;
    private _nextFrame = 0;

    private _voiceRetry = 0;

    public override remove(): void {
        this._widget.classList.remove('visible');
        this._canvas.removeEventListener('click', this._onClick);
        window.removeEventListener('keyup', this._keyup);
        window.removeEventListener('keydown', this._keydown);

        this._suck.removeEventListener('click', this._suckCallback);
        this._zombify.removeEventListener('click', this._zombifyCallback);
        this._teleport.removeEventListener('click', this._teleportCallback);

        super.remove();
    }

    public override export(): PlayerEntityData {
        const base = super.export() as PlayerEntityData;

        base.type = 'player';
        base.visual = this._data.visual;

        return base;
    }
}