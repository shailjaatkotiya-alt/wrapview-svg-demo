import { WrapviewUtils } from "./WrapviewUtils.js";
import { Color, CubeTextureLoader, DirectionalLight, AmbientLight, PointLight, HemisphereLight, RectAreaLight } from 'three';

export class WrapviewLight {
    constructor(settings) {
        this.id = WrapviewUtils.guid();
        this._instance = null;
        this._light = null;
        this.settings = {};
        this.children = {};
        _.merge(this.settings, this.defaults(), settings);
    }

    defaults() {
        return {
            type: 'ambient', // 'ambient', 'directional', 'point', 'hemisphere'
            color: 0xffffff,
            intensity: 1,
            position: {
                x: 0,
                y: 0,
                z: 0
            },
            target: null, // for directional lights
            envMap: null, // path to an environment map (cubemap)
            width: 10,
            height: 10
        };
    }

    setInstance(instance) {
        this._instance = instance;
    }

    setLight(light) {
        this._light = light;
    }

    update(deltaTime) { }

    loadEnvironmentMap(paths) {
        return new Promise((resolve, reject) => {
            if (!paths || paths.length !== 6) return reject('Invalid cubemap paths');
            const loader = new CubeTextureLoader();
            loader.load(paths, (texture) => {
                this._light.environment = texture;
                resolve(texture);
            }, undefined, reject);
        });
    }

    createLight() {
        let light;
        const { type, color, intensity, position, target, width, height } = this.settings;

        switch (type.toLowerCase()) {
            case 'directional':
                light = new DirectionalLight(new Color(color), intensity);
                if (target) {
                    light.target.position.set(target.x, target.y, target.z);
                }
                break;
            case 'point':
                light = new PointLight(new Color(color), intensity);
                break;
            case 'hemisphere':
                light = new HemisphereLight(new Color(color), 0x000000, intensity);
                break;
            case 'rectarea':
                light = new RectAreaLight(new Color(color), intensity, width, height);
                break;
            case 'ambient':
            default:
                light = new AmbientLight(new Color(color), intensity);
                break;
        }

        light.position.set(position.x, position.y, position.z);
        this._light = light;

        return light;
    }

    light() {
        return this._light;
    }

    remove() {
        this._instance?.removeObject(this);
        this._light = null;
    }
}
