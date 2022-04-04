import { EntityData } from "../entities/entity";
import { Human } from "./human";
import { ImageEntity, ImageEntityData } from "../entities/imageEntity";
import { LayerInfo } from "../tile";
import { World } from "../world";
import { Player } from "./player";
import { Vector2 } from "../vector2";
import { Sprite, Texture } from "pixi.js";
import { Sound } from "@pixi/sound";
import { ActorAction } from "./action";
import { KillPlayerAction } from "./heroActions/killPlayerAction";
import { FollowAction } from "./heroActions/followAction";
import { InspectBodyAction } from "./heroActions/inspectBodyAction";
import { TalkToHumanAction } from "./heroActions/talkToHumanAction";
import { WanderAction } from "./heroActions/wanderAction";
import { getVolumePercentage } from "../config/audio";

const walkSpeed  = 0.08;
const runSpeed  = 0.125;

const seeDistance = 8;
const heroSpeakDelay = 240;

const heroSearchingVoiceChoice = [
    'actors/hero_come_out.ogg',
    'actors/hero_find_you.ogg',
];

const heroHuntingVoiceChoice = [
    'actors/hero_good_always_wins.ogg',
    'actors/hero_inevitable.ogg',
];

export interface HeroEntityData extends ImageEntityData {

}

export class Hero extends ImageEntity {
    private _world: World;
    private _icon: Sprite = new Sprite();

    public constructor(world: World, layerInfo: LayerInfo, data: EntityData | HeroEntityData) {
        super(layerInfo, data);

        this._world = world;
        
        layerInfo.topLayer.addChild(this._icon);
        this._icon.visible = true;
        this._icon.texture = Texture.from('ui/icon_undetected.png');
        this._icon.anchor.set(0.5, 1);
    }

    public get action() { return this._action; }
    public set action(value) { 
        this._action?.remove();
        this._action = value;
    }
    private _action: ActorAction|null = null;

    public get direction() { return this._direction; }
    private _direction: Vector2 = new Vector2(0, 0);
    private _directionStr: string = "front";

    /**
     * Percentage index of how much the hero knows of the player. 
     * A 1.0, or 100% means the hero knows the player if he sees
     * him.
     */
    private _knowsPlayer: number = 0;

    /**
     * Bodies previously seen, to avoid the hero to reinspect corpses
     */
    private _seenBodies: Human[] = [];
    private _talkedToHistory: Human[] = [];

    private determineTask(): ActorAction|null {
        const inSight = this._world.filterEntities(p=>p instanceof Human || p instanceof Player && p.position.distance(this.position) < seeDistance);
        if (inSight.length == 0)
            return null;

        const player = inSight.find(p=>p instanceof Player) as Player|null;
        if (player) {
            if (this._knowsPlayer > 0.5) {
                if (this.position.distance(player.position) < 1) {
                    return new KillPlayerAction(this, this._world, player);
                }
                else if (this._action instanceof FollowAction === false || (this._action as FollowAction).follow !== player) {
                    return new FollowAction(this, this._world, player, this._knowsPlayer < 0.75 ? walkSpeed : runSpeed);
                }
            }
        }

        const deadHumans = inSight.filter(p=>p instanceof Human && p.dead && !this._seenBodies.includes(p)) as Human[];
        if (deadHumans.length > 0) {
            if (player) {
                this._knowsPlayer += 0.7;
            }
            else { 
                if (this._action instanceof InspectBodyAction === false || deadHumans.includes((this._action as InspectBodyAction).corpse) === false) {
                    this._seenBodies.push(deadHumans[0]);
                    return new InspectBodyAction(this, this._world, deadHumans[0], walkSpeed);
                }
                return null;
            }
        }
        
        const humansPanicing = inSight.filter(p=>p instanceof Human && (p.panic || p.zombified) && !p.dead) as Human[];
        if (humansPanicing.length > 0) {
            let nearestScore = Number.POSITIVE_INFINITY;
            let nearest: Human|null = null;
            for(const human of humansPanicing){
                if (this._talkedToHistory.includes(human)) 
                    continue;

                const distance = human.position.distance(this.position);
                if (distance < nearestScore) {
                    nearestScore = distance;
                    nearest = human;
                }
            }

            if (this._action instanceof TalkToHumanAction == false && nearest) {
                this._talkedToHistory.push(nearest);
                if (this._talkedToHistory.length > 6) {
                    this._talkedToHistory.shift();
                }

                return new TalkToHumanAction(this, this._world, nearest!, runSpeed, human => {
                    if (!human.zombified) {
                        this._knowsPlayer += 0.2;
                    }
                });
            }
            
            return null;
        }

        if (!this._action) {
            this._icon.visible = false;
            this._action = new WanderAction(this, this._world, walkSpeed);
        }
        return null;
    }

    private _speakDelay = 0;
    private _sound?: Sound;
    public say(choices: string[]) {
        if (this._sound && this._sound.isPlaying)
            return;

        this._sound = Sound.from({
            url: choices[Math.floor(choices.length * Math.random())],
            autoPlay: true,
            preload: true,
            volume: getVolumePercentage()
        });
    }

    private _frame = 0;
    private _nextFrame = 0
    private _prevPosition: Vector2|null = null;
    public update(timeDelta: number, timeDeltaMs: number) {
        
        // within sight
        let newAction = this.determineTask();
        if (newAction) {
            this._action?.remove();
            this._action = newAction;
        }

        this._speakDelay -= timeDelta;
        this._knowsPlayer = Math.min(Math.max(0, this._knowsPlayer - 0.0001 * timeDelta), 1);
        if (this._knowsPlayer > 0.25) {
            this._icon.visible = true;
            if (this._knowsPlayer > 0.8) {
                this._icon.texture = Texture.from('ui/icon_hunting.png');
            }
            else if (this._knowsPlayer > 0.5) {
                this._icon.texture = Texture.from('ui/icon_alerted.png');
            }
            else {
                this._icon.texture = Texture.from('ui/icon_alerted.png');
            }

            if (this._speakDelay < 0) {
                this._speakDelay = heroSpeakDelay;
                const followingPlayer = (this._action instanceof FollowAction && this._action.follow instanceof Player);
                this.say(followingPlayer ? heroHuntingVoiceChoice  : heroSearchingVoiceChoice);
            }
        }else {
            this._icon.visible = false;
        }

        if (this._visual) {
            this._icon.position.set(
                this._visual.position.x,
                this._visual.position.y - this._visual?.height
            );
        }

        const canContinue = this._action?.update(timeDelta, timeDeltaMs);
        if (!canContinue)
            this._action = null;


        if (!this._prevPosition)
            this._prevPosition = new Vector2(this.position.x, this.position.y);

        let direction: Vector2|null = this._prevPosition.direction(this.position);
        if (direction && !isNaN(direction.x) && !isNaN(direction.y)) {
            this._direction.set(direction.x, direction.y);
        }
        this._prevPosition.set(this.position.x, this.position.y);
        
        if (this._visual && direction) {
            let moving = true;
            let directionStr = this._directionStr;
            if (direction.y > 0.5) directionStr = 'front';
            else if (direction.y < -0.5) directionStr = 'back';
            else if (direction.x > 0.5) directionStr = 'right';
            else if (direction.x < -0.5) directionStr = 'left';
            else moving = false;

            if (this._directionStr !== directionStr) {
                this._frame = 0;
                this._directionStr = directionStr;
            }
            this._nextFrame -= timeDelta;

            if (!moving) {
                this._frame = 0;
                this._nextFrame = 5;
            } else {
                if (this._nextFrame < 0) {
                    this._nextFrame = 5;
                    this._frame = (this._frame + 1) % 4;
                }
            }

            const frameStr = this._frame.toString().padStart(2, '0').substring(-2);
            let animated = `actors/hero_walk_${directionStr}_${frameStr}.png`;
            this._visual.texture = Texture.from(animated);
            this._visual.anchor.set(0.5, 0.97);
        }
    };

    public override export(): HeroEntityData {
        const base = super.export() as HeroEntityData;

        base.type = 'human';
        base.visual = this._data.visual;

        return base;
    }

    public override remove(): void {
        super.remove();
    }
}