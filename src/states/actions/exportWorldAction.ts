import { saveAs } from "file-saver";
import { World } from "../../world";
import { Action } from "./action";

/**
 * Exports and saves a world to file
 */
export class ExportWorldAction implements Action {
    public constructor(world: World, doneCallback: (self: ExportWorldAction) => void) {
        const data = world.export();
        const str = JSON.stringify(data);
        var blob = new Blob([str], {type: "text/plain;charset=utf-8"});
        saveAs(blob, 'ld50-world-save.json');
        
        doneCallback(this);
    }

    public remove() {
        
    }
}
