/*
 * Configuration about the ingame editor. Static/singleton.
 */
import { worldSettings } from "../worldSettings";

export function getEditorEnabled(): boolean {
    return worldSettings.editorEnabledStorageKey in localStorage ? localStorage[worldSettings.editorEnabledStorageKey] === "true" : false;
}

export function setEditorEnabled(value: boolean): void {
    localStorage[worldSettings.editorEnabledStorageKey] = value;
}
