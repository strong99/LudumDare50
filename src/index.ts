import { Application } from "pixi.js";
import { MenuState } from "./states/menuState";

const canvas = document.getElementsByTagName("canvas")[0] as HTMLCanvasElement;
const app = new Application({
	view: canvas,
	resolution: window.devicePixelRatio || 1,
	autoDensity: true,
	backgroundColor: 0x000000,
	width: window.innerWidth,
	height: window.innerHeight
});

document.addEventListener('DOMContentLoaded', function() {
	app.resizeTo = canvas.parentElement!
 });

new MenuState(app);