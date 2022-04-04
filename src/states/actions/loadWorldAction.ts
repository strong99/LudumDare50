import { World } from "../../world";
import { Action } from "./action";

/**
 * Loads a world from storage and imports it into the world
 */
export class LoadWorldAction implements Action {
    public constructor(world: World, doneCallback: (self: LoadWorldAction) => void) {
        // Load from localstorage, and import it into the world if available, otherwise skip
        const worldImportStr = localStorage['ld50:world:save'];
        if (worldImportStr) {
            const worldImport = JSON.parse(worldImportStr);

            world.import(worldImport);
        }

        doneCallback(this);
    }

    public remove() {
        
    }
}
