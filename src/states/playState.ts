import { Container } from "@pixi/display";
import { Application } from "pixi.js";
import { World, WorldData } from "../world";
import { AppState } from "./appState";
import { TileDrawAction } from "./actions/tileDrawAction";
import { Action } from "./actions/action";
import { SaveWorldAction } from "./actions/saveWorldAction";
import { LoadWorldAction } from "./actions/loadWorldAction";
import { PlaceEntityAction } from "./actions/placeEntityAction";
import { RemoveEntityAction } from "./actions/removeEntityAction";
import { MoveEntityAction } from "./actions/moveEntityAction";
import { ExportWorldAction } from "./actions/exportWorldAction";
import { Player } from "../actors/player";
import { Human } from "../actors/human";
import { Hero } from "../actors/hero";
import { Lifebar } from "../ui/lifebar";
import { TimeBar } from "../ui/timebar";
import { GameOver } from "../ui/gameover";
import { HeadBar } from "../ui/headbar";
import { worldData } from "../worldData";
import { worldSettings } from "../worldSettings";
import { Options, Sound } from "@pixi/sound";
import { getVolumePercentage } from "../config/audio";
import { SubtitleBar } from "../ui/subtitleBar";

/**
 * Manages the game itself
 */
export class PlayState implements AppState {
    private _app: Application;
    private _world: World;

    private _viewport = new Container();
    private _bottomLayer = new Container();
    private _playLayer = new Container();
    private _topLayer = new Container();
    private _uiLayer = new Container();

    private _lifebar: Lifebar;
    private _timebar: TimeBar;
    private _gameover: GameOver | null = null;
    private _headbar: HeadBar;
    private _subTitleBar: SubtitleBar;

    private _action: Action | null = null;

    private _player: Player;

    private _playTime = 0;
    public get playTime() { return this._playTime; }

    private _creativeWidget?: HTMLElement;

    private _updateCallback = (timeDelta: number) => this.update(timeDelta, this._app.ticker.deltaMS);

    private _backgroundMusicDefault: Sound;

    private _handlers: Array<{ element: HTMLElement, callback: (this: HTMLElement, ev: MouseEvent) => void }> = [];

    public constructor(app: Application) {
        this._app = app;
        this._app.view.style.display = 'block';

        this._viewport.addChild(this._bottomLayer);
        this._viewport.addChild(this._playLayer);
        this._viewport.addChild(this._topLayer);
        this._app.stage.addChild(this._viewport);
        this._app.stage.addChild(this._uiLayer);

        this._backgroundMusicDefault = Sound.from({
            url: 'backgroundDefault.ogg',
            preload: true,
            autoPlay: true,
            loop: true,
            volume: getVolumePercentage()
        } as Options);

        // Create an empty world when no level to load
        let world: WorldData | null = null;
        const worldImportStr = localStorage['ld50:world:save'];
        if (worldImportStr) {
            const loadedWorld = JSON.parse(worldImportStr);
            if (loadedWorld && loadedWorld.chunks) {
                world = loadedWorld;
            }
        }

        if (!world) {
            world = worldData;
        }

        // Create the world from the level data
        this._world = new World(world, this._bottomLayer, this._topLayer);

        let player = this._world.findEntity(p => p instanceof Player) as Player | null;
        if (!player) {
            const x = 54, y = 24;
            const tile = this._world.getTile(x, y);

            if (!tile)
                throw new Error();

            tile.chunk.entities.push(player = new Player(this._world, this._viewport, {
                bottomLayer: this._bottomLayer,
                topLayer: this._topLayer,
                uiLayer: this._uiLayer
            }, {
                type: 'player',
                x,
                y,
                visual: 'actors/player_front.png'
            }));
        }
        this._player = player;
        this._player.active = false;

        if (!this._world.someEntity(p => p instanceof Hero)) {
            const x = 20, y = 20;
            const tile = this._world.getTile(x, y);
            if (tile) {
                tile.chunk.entities.push(new Hero(this._world, {
                    bottomLayer: this._bottomLayer,
                    topLayer: this._topLayer
                }, {
                    type: 'player',
                    x,
                    y,
                    visual: 'actors/hero_front.png'
                }));
            }
        }

        const humans = this._world.filterEntities(p => p instanceof Human);
        for (let i = humans.length; i < 10; i++) {
            this.spawnHuman();
        }

        this._headbar = new HeadBar(player, this._uiLayer);
        this._lifebar = new Lifebar(player, this._uiLayer);
        this._timebar = new TimeBar(this, this._uiLayer);
        this._subTitleBar = new SubtitleBar(player, this, this._uiLayer);
        this._subTitleBar.play([
            "Finally lost that pesky hero!",
            "This is not the time to fight...",
            "But look here, a town with townsfolk!",
            "How lucky for the HUNGRY me!",
            "Sooo HUNGRY!! For... BLOOOOD..."
        ], () => {
            if (this._player) {
                this._player.active = true;
            }
        });

        if (localStorage[worldSettings.editorEnabledStorageKey] === "true") {
            this._creativeWidget = document.getElementById('creative')!;
            this._creativeWidget.classList.add('visible');

            const register = (element: HTMLElement | null, callback: (this: HTMLElement, ev: MouseEvent) => void) => {
                if (!element)
                    return;

                element.addEventListener('click', callback);
                this._handlers.push({
                    element,
                    callback
                });
            }

            const createAction = (e: MouseEvent, callback: (skip: () => void) => Action | null) => {
                const target = e.target as HTMLElement;
                const elements = this._creativeWidget!.querySelectorAll('button[data-action]');

                for (const element of elements)
                    element.classList.remove('active');

                target.classList.add('active');

                this._action?.remove();
                this._action = null;

                let skipped = false;
                const newAction = callback(() => skipped = true);
                if (newAction && !skipped) {
                    this._action = newAction;
                }
                e.preventDefault();
                e.stopImmediatePropagation();
            }

            register(this._creativeWidget.querySelector("[data-action=door]"), e => createAction(e, () => new TileDrawAction(this._world, this._viewport, p => p.door = true)));
            register(this._creativeWidget.querySelector("[data-action=block]"), e => createAction(e, () => new TileDrawAction(this._world, this._viewport, p => p.solid = true)));
            register(this._creativeWidget.querySelector("[data-action=unblock]"), e => createAction(e, () => new TileDrawAction(this._world, this._viewport, p => p.solid = false)));
            register(this._creativeWidget.querySelector("[data-action=paint]"), e => createAction(e, () => new TileDrawAction(this._world, this._viewport, p => {
                p.type = (document.getElementById('paintTemplate') as HTMLSelectElement).value;
            })));
            register(this._creativeWidget.querySelector("[data-action=remove]"), e => createAction(e, () => new RemoveEntityAction(this._world, this._viewport)));
            register(this._creativeWidget.querySelector("[data-action=move]"), e => createAction(e, () => new MoveEntityAction(this._world, this._viewport)));
            register(this._creativeWidget.querySelector("[data-action=export]"), e => createAction(e, (skip) => new ExportWorldAction(this._world, skip)));
            register(this._creativeWidget.querySelector("[data-action=place]"), e => createAction(e, () => new PlaceEntityAction(this._world, this._viewport, {
                bottomLayer: this._bottomLayer,
                topLayer: this._topLayer
            }, (document.getElementById('entityTemplate') as HTMLSelectElement).value)));
            register(this._creativeWidget.querySelector("[data-action=save]"), e => createAction(e, (skip) => new SaveWorldAction(this._world, skip)));
            register(this._creativeWidget.querySelector("[data-action=load]"), e => createAction(e, (skip) => new LoadWorldAction(this._world, skip)));
        }

        this._app.ticker.add(this._updateCallback);
    }

    public spawnHuman() {
        const doors = this._world.getDoors();
        const tile = doors[Math.floor(Math.random() * doors.length)];

        tile.chunk.entities.push(new Human(this._world, {
            bottomLayer: this._bottomLayer,
            topLayer: this._topLayer
        }, {
            type: 'player',
            x: tile.globalPosition.x,
            y: tile.globalPosition.y,
            visual: 'actors/human_01_front.png'
        }));
    }

    /**
     * Updates all entities and objects required to play the game
     * @param timeDelta time passed since the last update tick in %
     * @param timeDeltaMs time passed since the last update tick in Ms
     */
    public update(timeDelta: number, timeDeltaMs: number) {
        this._bottomLayer.children.sort((a, b) => a.y - b.y);

        if (this._player.lifeforce > 0) {
            if (this._player.active)
                this._playTime += timeDeltaMs;
        }
        else if (!this._gameover) {
            this._gameover = new GameOver(this._player, this, this._app, this._uiLayer);
        }

        let humansAlive = 0;
        const { tileSize } = worldSettings;
        for (const chunkRow of this._world.chunks) {
            for (const chunk of chunkRow) {
                for (const entity of chunk.entities) {
                    if ('update' in entity) {
                        // Update the entity
                        (entity as any as { update: (t: number, ms: number) => void }).update(timeDelta, timeDeltaMs);
                    }
                    if (entity instanceof Human && !entity.dead) {
                        humansAlive++;
                    }
                }
            }
        }

        if (humansAlive < 8) {
            this.spawnHuman();
        }

        // Update viewport location to match the player
        this._viewport.position.set(
            // Viewport should transform in the opposite direction of the 
            // player's sprite position and add the viewport's half dimension 
            // to center it
            -this._player.position.x * tileSize + window.innerWidth / 2,
            -this._player.position.y * tileSize + window.innerHeight / 2,
        );

        this._lifebar?.update(timeDelta, timeDeltaMs);
        this._timebar?.update(timeDelta, timeDeltaMs);
        this._gameover?.update(timeDelta, timeDeltaMs);
        this._headbar?.update(timeDelta, timeDeltaMs);
        this._subTitleBar?.update(timeDelta, timeDeltaMs);
    }

    public remove() {
        if (this._creativeWidget) {
            this._creativeWidget.classList.remove('visible');
        }

        for (const handler of this._handlers) {
            handler.element.removeEventListener('click', handler.callback);
        }

        this._world.remove();

        this._lifebar?.remove();
        this._timebar?.remove();
        this._gameover?.remove();
        this._subTitleBar?.remove();

        this._backgroundMusicDefault.stop();

        this._app.stage.removeChild(this._viewport);
        this._app.ticker.remove(this._updateCallback);
    }
}
