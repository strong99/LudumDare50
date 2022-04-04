import { Container } from "@pixi/display";
import { Application } from "pixi.js";
import { AppState } from "./appState";
import { PlayState } from "./playState";
import { HelpState } from "./helpState";
import { SettingsState } from "./settingsState";
import { CreditsState } from "./creditsState";

let hasPreloaded = false;

const menuViewClass = 'menuview';
const menuWidgetId = 'menu';
const cssVisibilityClass = 'visible';

/**
 * Shows a menu with basic buttons and highscore
 */
export class MenuState implements AppState {
    private _app: Application;
    private _viewport = new Container();

    private _menuWidget: HTMLElement;

    private _handlers: Array<{ element: HTMLElement, callback: (this: HTMLElement, ev: MouseEvent) => void }> = [];

    private _updateCallback = (timeDelta: number)=>this.update(timeDelta);

    public constructor(app: Application) {
        this._app = app;
        
        this._menuWidget = document.getElementById(menuWidgetId)!;
        this._menuWidget.classList.add(cssVisibilityClass);

        this._app.view.style.display = 'none';
        this._app.view.parentElement!.classList.add(menuViewClass);

        const register = (element: HTMLElement|null, callback: (this: HTMLElement, ev: MouseEvent) => void) => {
            if (!element)
                return;

            element.addEventListener('click', callback);
            this._handlers.push({
                element,
                callback
            });
        }
        register(document.getElementById("startbtn"), (e) => {
            this.remove();
            new PlayState(this._app);
            return false;
        });
        register(document.getElementById("settingsbtn"), (e) => {
            this.remove();
            new SettingsState(this._app);
            return false;
        });
        register(document.getElementById("helpbtn"), (e) => {
            this.remove();
            new HelpState(this._app);
            return false;
        });
        register(document.getElementById("creditsbtn"), (e) => {
            this.remove();
            new CreditsState(this._app);
            return false;
        });

        if (!hasPreloaded) {
            hasPreloaded = true;
            this._app.loader.add([
                'entities/house_01.png',
                'entities/house_02.png',
                'entities/house_03.png',
                'entities/tree_01.png',
                'tiles/grass.png',
                'tiles/water.png',
                'tiles/road.png',
                'tiles/grass_road_west.png',
                'tiles/grass_road_north.png',
                'tiles/grass_road_east.png',
                'tiles/grass_road_south.png',
                'tiles/grass_dirt_west.png',
                'tiles/grass_dirt_north.png',
                'tiles/grass_dirt_east.png',
                'tiles/grass_dirt_south.png',
                'tiles/road_water_north.png',
                'tiles/road_water_south.png',
                'ui/abilityButton.png',
                'ui/abilityButton-hover.png',
                'actors/hero_back.png',
                'actors/hero_front.png',
                'actors/hero_left.png',
                'actors/hero_right.png',
                'actors/player_back.png',
                'actors/player_walk_back_00.png',
                'actors/player_walk_back_01.png',
                'actors/player_walk_back_02.png',
                'actors/player_walk_back_03.png',
                'actors/player_front.png',
                'actors/player_walk_front_00.png',
                'actors/player_walk_front_01.png',
                'actors/player_walk_front_02.png',
                'actors/player_walk_front_03.png',
                'actors/player_left.png',
                'actors/player_walk_left_00.png',
                'actors/player_walk_left_01.png',
                'actors/player_walk_left_02.png',
                'actors/player_walk_left_03.png',
                'actors/player_right.png',
                'actors/player_walk_right_00.png',
                'actors/player_walk_right_01.png',
                'actors/player_walk_right_02.png',
                'actors/player_walk_right_03.png',
                'actors/human_01_back.png',
                'actors/human_01_front.png',
                'actors/human_01_left.png',
                'actors/human_01_right.png',
                'actors/human_02_back.png',
                'actors/human_02_front.png',
                'actors/human_02_left.png',
                'actors/human_02_right.png'
            ]);
            this._app.loader.load();
        }
        
        this._app.ticker.add(this._updateCallback);
    }

    /**
     * Updates all entities and objects required to play the game
     * @param timeDelta time passed since the last update tick
     */
    public update(timeDelta: number) {
        
    }

    public remove() {
        this._app.view.classList.remove(menuViewClass);
        
        for(const handler of this._handlers) {
            handler.element.removeEventListener('click', handler.callback);
        }

        this._menuWidget.classList.remove(cssVisibilityClass);
        this._app.stage.removeChild(this._viewport);
        this._app.ticker.remove(this._updateCallback);
    }
}
