import {ImageLoader, LoadingManager, TextureLoader} from "three";
import { GLTFLoader } from '../Wrapview/plugins/GLTFLoader.js';
class WrapviewSettings {
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
        lodLevel: 0
    };

    static init(){
        WrapviewSettings.agent.manager = new LoadingManager();
        WrapviewSettings.agent.loaders = {
            image: new ImageLoader(WrapviewSettings.agent.manager),
            texture: new TextureLoader(WrapviewSettings.agent.manager),
            object: new GLTFLoader(WrapviewSettings.agent.manager)
        }
    }
}


export  {
    WrapviewSettings
}
