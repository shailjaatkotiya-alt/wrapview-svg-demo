import { ImageLoader, LoadingManager, TextureLoader } from "three";
import { WrapviewFontLoader } from "./WrapviewFontLoader.js";
import { GLTFLoader } from './plugins/GLTFLoader.js';

export class WrapviewSettings {
    static agent = {
        darkMode: false,
        manager: null,
        pixelRatio: window.devicePixelRatio,
        loaders: {
            image: null,
            texture: null,
            font: null,
            object: null,
            audio: null,
            environment: null
        },
        lodLevel: 0,
        enableGPT5MiniForAllClients: true
    };

    static init() {
        WrapviewSettings.agent.manager = new LoadingManager();
        WrapviewSettings.agent.loaders = {
            image: new ImageLoader(WrapviewSettings.agent.manager),
            texture: new TextureLoader(WrapviewSettings.agent.manager),
            font: new WrapviewFontLoader(),
            object: new GLTFLoader(WrapviewSettings.agent.manager)
        }
    }
}