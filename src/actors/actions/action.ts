export interface ActorAction {
    update(deltaTime: number, timeDeltaMs: number): boolean|void;
    remove(): void;
}