import { WrapviewUtils } from "./WrapviewUtils.js";
import { WrapviewSettings } from "./WrapviewSettings.js";
import { Mesh } from 'three';

export class WrapviewObject {
    constructor(settings) {
        this.id = WrapviewUtils.guid();
        this._instance = null;
        this.settings = {};
        this._materials = null;
        this._object = null;
        this.children = {};
        _.merge(this.settings, this.defaults(), settings);
    }
    defaults() {
        return {
            transform: {
                position: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                scale: {
                    x: 1,
                    y: 1,
                    z: 1
                },
            }
        }
    }
    setInstance(i) {
        this._instance = i;
    }

    setObject(o) {
        this._object = o;
    }

    setMaterials(m) {
        this._materials = m;
    }

    update(deltaTime) {

    }

    load(path) {
        return new Promise((resolve, reject) => {
            WrapviewSettings.agent.loaders.object.load(path, (o) => {
                var object = o.scene;
                object.position.set(this.settings.transform.position.x, this.settings.transform.position.y, this.settings.transform.position.z);
                object.rotation.set(this.settings.transform.rotation.x, this.settings.transform.rotation.y, this.settings.transform.rotation.z);
                object.scale.set(this.settings.transform.scale.x, this.settings.transform.scale.y, this.settings.transform.scale.z);
                object.traverse((child) => {
                    if (child instanceof Mesh) {
                        this.children[child.name] = child;
                        if (this._materials !== null) {
                            if (child.name.startsWith('EXT_ZIPPER_PANEL')) {
                                child.material = this._materials.get('ZIPPER_PANEL')._material;
                            } else if (this._materials.has(child.name)) {
                                child.material = this._materials.get(child.name)._material;
                            }
                        }


                    }
                });
                this._object = object;
                resolve();
            });
        });
    }

    object() {
        return this._object;
    }

    remove() {
        this._instance?.removeObject(this);
        this._object = null;
    }
}