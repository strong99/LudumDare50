import { Container } from "@pixi/display";
import { Application } from "pixi.js";
import { AppState } from "./appState";
import { MenuState } from "./menuState";

const viewClass = 'creditsview';
const widgetId = 'credits';
const cssVisibilityClass = 'visible';

/**
 * Shows creation and library credits
 */
export class CreditsState implements AppState {
    private _app: Application;
    private _viewport = new Container();

    private _menuWidget: HTMLElement;

    private _handlers: Array<{ element: HTMLElement, callback: (this: HTMLElement, ev: MouseEvent) => void }> = [];

    private _updateCallback = (timeDelta: number)=>this.update(timeDelta);

    public constructor(app: Application) {
        this._app = app;
        
        this._menuWidget = document.getElementById(widgetId)!;
        this._menuWidget.classList.add(cssVisibilityClass);

        this._app.view.style.display = 'none';
        this._app.view.parentElement!.classList.add(viewClass);

        const register = (element: HTMLElement|null, callback: (this: HTMLElement, ev: MouseEvent) => void) => {
            if (!element)
                return;

            element.addEventListener('click', callback);
            this._handlers.push({
                element,
                callback
            });
        }
        register(this._menuWidget.querySelector("[data-state=menu]"), (e) => {
            this.remove();
            new MenuState(this._app);
            return false;
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
