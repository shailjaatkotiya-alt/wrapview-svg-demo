import { WrapviewTexture } from "./WrapviewTexture";
import { WrapviewPatternLayer } from "./WrapviewLayer";
import { WrapviewSettings } from "./WrapviewSettings";

export class WrapviewFabric {
    constructor(id, settings) {
        this.id = id;
        this.settings = {};

        _.assign(this.settings, this.defaults(), settings);
        this._normal = null;
        this._diffuseLayer = null;
        this._data = {};
    }

    defaults() {
        return {
            tiling: 1,
            size: {
                width: WrapviewSettings.agent.normalSize,
                height: WrapviewSettings.agent.normalSize
            }
        }
    }

    fetch() {
        return new Promise((resolve, reject) => {
            var url = '/api/fabrics/' + this.id;
            axios(url, {
                method: 'get',
                params: {},
                headers: {
                    'Content-Type': 'application/json'
                },
                responseType: 'json',
            })
                .then((response) => {

                    this._data = response.data.object;
                    this._buildNormalTexture().then(() => {
                        this._buildDiffuseLayer().then(() => {
                            resolve();
                        });
                    });
                })
                .catch((error) => {
                    console.log(error)
                    reject(error);
                });
        });
    }

    _buildNormalTexture() {
        return new Promise((resolve, reject) => {
            if (!WrapviewSettings.agent.loadNormalMaps) {
                resolve();
                return;
            }
            if (this._data.normal === null) {
                resolve();
                return;
            }
            this._instace_id = guid();
            this._normal = new WrapviewTexture(this._instace_id, {
                type: 'Normal',
                size: this.settings.size
            });
            var uid = guid();
            var normalLayer = new WrapviewPatternLayer(uid, {
                tile: {
                    x: this.settings.tiling,
                    y: this.settings.tiling
                },
                size: this.settings.size
            });

            normalLayer.lock();
            this._normal.setBaseLayer(normalLayer);
            normalLayer.load({
                path: this._data.normal
            }).then(() => {
                resolve();
            }, (error) => {
                console.log(error);
                reject(error);
            });
        });
    }

    _buildDiffuseLayer() {
        return new Promise((resolve, reject) => {
            if (this._data.diffuse === null) {
                resolve();
                return;
            }
            var uid = guid();
            this._diffuseLayer = new WrapviewPatternLayer(uid, {
                tile: {
                    x: (this.settings.size.width / this.settings.tiling),
                    y: (this.settings.size.height / this.settings.tiling)
                },
                size: this.settings.size
            });
            this._diffuseLayer.lock();
            this._diffuseLayer.load({
                path: this._data.diffuse
            }).then(() => {
                resolve();
            });
        });
    }

    normal() {
        return this._normal;
    }

    diffuse() {
        return this._diffuseLayer;
    }
    render(context) {
        if (this._diffuseLayer === null) return;
        this._diffuseLayer.draw(context);
    }

}