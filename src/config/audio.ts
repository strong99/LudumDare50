/*
 * Configuration for audio volume, including music and sfx. Static/singleton.
 */
import { worldSettings } from "../worldSettings";

export function getVolume(): number {
    return worldSettings.audioStorageKey in localStorage ? Number(localStorage[worldSettings.audioStorageKey]) || 0 : 50;
}

export function getVolumePercentage(): number {
    return getVolume() / 100;
}

export function setVolume(value: number): void {
    if (value < 0 || value > 100)
        throw new Error("Value expected of or between 0 and 100");

    localStorage[worldSettings.audioStorageKey] = value;
}
