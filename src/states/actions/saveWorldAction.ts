import { World } from "../../world";
import { Action } from "./action";

/**
 * Saves a world to storage
 */
export class SaveWorldAction implements Action {
    public constructor(world: World, doneCallback: (self: SaveWorldAction) => void) {
        const worldExport = world.export();
        const worldExportStr = JSON.stringify(worldExport);
        localStorage['ld50:world:save'] = worldExportStr;
        doneCallback(this);
    }

    public remove() {
        
    }
}
