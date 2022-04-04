/*
 * Returns score information. Static/singleton.
 */
import { worldSettings } from "../worldSettings";

let highscores: number[]|null = null;

export function getHighscores(): number[] {
    if (!highscores) {
        highscores = worldSettings.highScoreStorageKey in localStorage ? JSON.parse(localStorage[worldSettings.highScoreStorageKey]) : [];
    }
    return highscores!;
}

export function getHighscore(): number {
    const highscores = getHighscores();
    return highscores.length > 0 ? highscores[0] : 0;
}

export function addHighscore(value: number): void {
    const scores: number[] = worldSettings.highScoreStorageKey in localStorage ? JSON.parse(localStorage[worldSettings.highScoreStorageKey]) : [];
    scores.push(value);
    localStorage[worldSettings.highScoreStorageKey] = JSON.stringify(
        highscores = scores.sort((a, b)=>b-a).slice(0, Math.min(10, scores.length))
    );
}
