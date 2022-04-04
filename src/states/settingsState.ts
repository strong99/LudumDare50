import { Container } from "@pixi/display";
import { Application } from "pixi.js";
import { getVolume, setVolume } from "../config/audio";
import { getEditorEnabled, setEditorEnabled } from "../config/editor";
import { AppState } from "./appState";
import { MenuState } from "./menuState";

const viewClass = 'settingsview';
const widgetId = 'settings';
const cssVisibilityClass = 'visible';

/**
 * Shows and allows editing of settings like audio volume etc.
 */
export class SettingsState implements AppState {
    private _app: Application;
    private _viewport = new Container();

    private _menuWidget: HTMLElement;

    private _handlers: Array<{ element: HTMLElement, event: string, callback: (this: HTMLElement, ev: MouseEvent) => void }> = [];

    private _updateCallback = (timeDelta: number)=>this.update(timeDelta);

    public constructor(app: Application) {
        this._app = app;
        
        this._menuWidget = document.getElementById(widgetId)!;
        this._menuWidget.classList.add(cssVisibilityClass);

        this._app.view.style.display = 'none';
        this._app.view.parentElement!.classList.add(viewClass);

        const register = (element: HTMLElement|null, callback: (this: HTMLElement, ev: MouseEvent) => void, event?: string) => {
            if (!element)
                return;

            event = event || 'click';
            element.addEventListener(event as any, callback);
            this._handlers.push({
                element,
                event, 
                callback
            });
        }
        register(this._menuWidget.querySelector("[data-state=menu]"), (e) => {
            this.remove();
            new MenuState(this._app);
            return false;
        });

        const audioVolumeRange = document.getElementById("audioVolume") as HTMLInputElement;
        audioVolumeRange.value = getVolume().toString();
        register(audioVolumeRange, (e) => setVolume(Number((e.target as HTMLInputElement).value)), 'change');

        const toggleEditorRange = document.getElementById("toggleEditor") as HTMLInputElement;
        toggleEditorRange.checked = getEditorEnabled();
        register(toggleEditorRange, (e) => setEditorEnabled((e.target as HTMLInputElement).checked), 'change');

        const resetBtn = document.getElementById("resetBtn") as HTMLInputElement;
        resetBtn.checked = getEditorEnabled();
        register(resetBtn, (e) => {
            localStorage.clear();
            location.reload();
        });
        
        this._app.ticker.add(this._updateCallback);
    }

    /**
     * Updates all entities and objects required to play the game
     * @param timeDelta time passed since the last update tick
     */
    public update(timeDelta: number) {
        
    }

    public remove() {
        this._app.view.classList.remove(viewClass);
        
        for(const handler of this._handlers) {
            handler.element.removeEventListener('click', handler.callback);
        }

        this._menuWidget.classList.remove(cssVisibilityClass);
        this._app.stage.removeChild(this._viewport);
        this._app.ticker.remove(this._updateCallback);
    }
}
