import {DoubleSide, MeshBasicMaterial, MeshPhysicalMaterial, sRGBEncoding} from "three";
import {WrapviewTexture} from "./WrapviewTexture.js";
import * as LayerTypes from "./WrapviewLayer.js";
import {WrapviewFabric} from "./WrapviewFabric.js";
import {WrapviewParameter} from "./WrapviewParameter.js";
import {WrapviewSettings} from "./WrapviewSettings.js";
import {WrapviewUtils} from "./WrapviewUtils.js";
import {WrapviewImageLayer} from "./WrapviewLayer.js";

class WrapviewMaterial {

    constructor(instance, settings) {
        this.settings = {};
        this.parameters = [];
        this._instance = instance;
        this._material = null;
        this._materialSet = null;
        this._variableSet = null;
        _.merge(this.settings, this.defaults(), settings);
    }

    defaults(){
        return {
            type: 'Basic',
            access:{
                listed: false,
                selectable: false,
                viewable: false
            }
        }
    }
    init(){
        return this.build();
    }

    instance(){
        return this._instance;
    }

    setMaterialSet(r) {
        this._materialSet = r;
    }


    setVariableSet(r) {
        this._variableSet = r;
    }

    getVariableValue(id, param){
        //TODO: If the variable set does not contain id, then detach the variable
        //Show Error in the Log Messages.
        return this._variableSet.get(id)?.value()
    }
    getVariableDescriptor(id, param){
        //TODO: If the variable set does not contain id, then detach the variable
        //Show Error in the Log Messages.
        return this._variableSet.get(id)?.descriptor()
    }

    getInheritedValue(p, id) {
        var panel = this._materialSet.get(p);
        if(panel === null) {
            return null;
        }

        if(!panel.settings.hasOwnProperty(id)) {
            return null;
        }

        if(panel.settings[id] instanceof WrapviewParameter) {
            return panel.settings[id].value();
        }
        return panel.settings[id];
    }

    getInheritedDescriptor(p, id) {
        var panel = this._materialSet.get(p);
        if(panel === null) {
            return null;
        }

        if(!panel.settings.hasOwnProperty(id)) {
            return null;
        }

        if(panel.settings[id] instanceof WrapviewParameter) {
            return panel.settings[id].descriptor();
        }
        return panel.settings[id];
    }

    is(a){
        return this.settings.access[a];
    }

    setMaterial(m){
        this._material = m;
    }

    material() {
        return this._material;
    }

    build(){
        return new Promise((resolve, reject)=>{
            resolve();
        })
    }
}

class WrapviewShadowMaterial extends WrapviewMaterial{
    defaults() {
        return {
            type: 'Basic',
            access:{
                listed: false,
                selectable: false,
                viewable: false
            },
            textures: {
                alpha: null
            },
            resources: {
                alpha: null
            }

        }
    }

    build() {

        return new Promise((resolve, reject)=> {
            if(this.settings.resources.alpha === null) {
                reject();
                return;
            }
            this.settings.textures.alpha = WrapviewSettings.agent.loaders.texture.load(this.settings.resources.alpha);
            this.makeMaterial();
            resolve(this._material);
        });
    }

    makeMaterial() {
        this._material = new MeshBasicMaterial({
            color: 0x000000,
            alphaMap: this.settings.textures.alpha,
            side: DoubleSide,
            transparent: true
        });
    }
}

class WrapviewStitchMaterial extends WrapviewMaterial{
    defaults() {
        return {
            type: 'Stitch',
            access:{
                listed: false,
                selectable: false,
                viewable: false
            },
            color: new WrapviewParameter(this,WrapviewUtils.guid(),{
                type: 'fixed',
                value: '#111111'
            }),
            textures: {
                diffuse: null
            },
            resources: {
                diffuse: null
            }

        }
    }

    build() {
        return new Promise((resolve, reject)=> {
            if(this.settings.resources.diffuse === null) {
                reject();
                return;
            }
            this.settings.textures.diffuse = WrapviewSettings.agent.loaders.texture.load(this.settings.resources.diffuse);
            this.makeMaterial();
            resolve(this._material);
        });
    }

    makeMaterial() {
        this._material = new MeshPhysicalMaterial({
            map: this.settings.textures.diffuse,
            color: this.settings.color.value(),
            reflectivity: 0.0,
            roughness: 0.4,
            shadowSide: DoubleSide,
            //opacity: 0,
            //alphaMap: this.settings.alphaTexture,
            side: DoubleSide,
            transparent: true
        });
    }
}

class WrapviewPlainMaterial extends WrapviewMaterial{
    defaults() {
        return {
            type: 'Plain',
            access:{
                listed: false,
                selectable: false,
                viewable: false
            },
            color: new WrapviewParameter(this,WrapviewUtils.guid(),{
                type: 'fixed',
                value: '#111111'
            })

        }
    }

    build() {
        return new Promise((resolve, reject)=> {
            this.makeMaterial();
            resolve(this._material);
        });
    }

    makeMaterial() {
        this._material = new MeshBasicMaterial({
            color: this.settings.color.value(),
            reflectivity: 0.0,
            roughness: 0.4,
            side: DoubleSide
        });
    }
}


class WrapviewTexturedMaterial extends WrapviewMaterial{
    defaults() {
        return {
            type: 'Textured',
            status: {
                base: false,
                layers: false
            },
            build:{
                parameters: {
                    base: false,
                    layers: false,
                    size: 2048,
                    inner: 'inherit',
                    color: new WrapviewParameter(this,WrapviewUtils.guid(),{
                        type: 'fixed',
                        descriptor: 'White',
                        value: '#FFFFFF'
                    })
                }
            },
            raw: {
                diffuse: null
            },
            textures: {
                diffuse: null,
                normal: null
            },
            buildable: {
                diffuse: null
            },
            resources: {
                base: null,
                diffuse: null,
                normal: null
            }

        }
    }

    build() {
        return new Promise((resolve, reject)=> {
            if(this.settings.resources.diffuse === null) {
                reject();
                return;
            }
            this.settings.textures.diffuse = WrapviewSettings.agent.loaders.texture.load(this.settings.resources.diffuse);
            this.settings.textures.diffuse.encoding = sRGBEncoding;
            this.settings.textures.diffuse.flipY = false;
            this.settings.buildable.diffuse = new WrapviewTexture(this,{
                size: {
                    width: this.settings.build.parameters.size,
                    height: this.settings.build.parameters.size,
                }
            });
            this.makeMaterial();

            if(this.settings.build.parameters.base) {
                this.buildBaseLayer().then(()=>{

                    if(this.settings.build.parameters.layers) {
                        var promises = [];
                        this.settings.build.parameters.layers.forEach((l)=>{
                            promises.push(this.buildLayer(l));
                        });
                        Promise.all(promises).then(()=>{
                            this.texture()?.beginEditing().then(()=>{
                                this.texture()?.render();
                                this.texture()?.endEditing();
                                resolve(this._material);
                            });

                        })
                    } else {
                        resolve(this._material);
                    }

                });
            } else {
                resolve(this._material);
            }
        });
    }

    buildBaseLayer(){
        return new Promise((resolve, reject)=>{
            const imageLayer = new LayerTypes.WrapviewImageLayer(WrapviewUtils.guid(),{
                pivot: {
                    x: 0,
                    y: 0
                },
                position: {
                    x: 0,
                    y: 0
                },
                angle: 0
            });

            this.settings.buildable.diffuse.setBaseLayer(imageLayer);
            imageLayer.setColorParameter(this.settings.build.parameters.color);
            imageLayer.lock();

            imageLayer.load({
                path: this.settings.resources.base
            }).then(()=>{
                this.settings.status.base = true;
                resolve(this._material);
            });
        })
    }

    buildLayer(l) {
        return new Promise((resolve, reject)=>{
            var uid = WrapviewUtils.guid();
            var layer = new LayerTypes[l.type](uid,{});
            layer.applySettings(l.settings, this);
            this.settings.buildable.diffuse.addLayer(layer);
            layer.load(l.data, this).then(()=>{
                resolve();
            },()=>{
                resolve();
            });
        });
    }

    setCapturedTexture(texture, imageData){
        this.settings.raw.diffuse = imageData;
        if(this.settings.textures.diffuse !== null) {
            this.settings.textures.diffuse.dispose();
        }
        this.settings.textures.diffuse = texture;
        this.settings.textures.diffuse.encoding = sRGBEncoding;
        this.settings.textures.diffuse.flipY = false;
    }

    texture() {
        return this.settings.buildable.diffuse;
    }

    beginEditing(){
        return new Promise((resolve)=>{
            if(!this.settings.status.base) {
                this.buildBaseLayer().then(()=>{

                    if(this.settings.build.parameters.layers) {
                        var promises = [];
                        this.settings.build.parameters.layers.forEach((l)=>{
                            promises.push(this.buildLayer(l));
                        });
                        Promise.all(promises).then(()=>{
                            this._material.map = this.settings.buildable.diffuse.texture();
                            resolve();
                        })
                    } else {
                        this._material.map = this.settings.buildable.diffuse.texture();
                        resolve();
                    }
                })
            } else {
                this._material.map = this.settings.buildable.diffuse.texture();
                resolve();
            }

        })

    }

    endEditing(){
        return new Promise((resolve)=> {
            this._material.map = this.settings.textures.diffuse;
            resolve();
        });
    }

    makeMaterial() {
        this._material = new MeshPhysicalMaterial({
            map: this.settings.textures.diffuse,
            reflectivity: 0.0,
            roughness: 0.4,
            shadowSide: DoubleSide,
            side: DoubleSide
        });
    }

    uploadRawData(s){
        return new Promise((resolve, reject)=>{
            var settings = _.merge({
                url: '/api/panels/save/texture',
                path: 'captures/'
            },s);
            if(this.settings.raw.diffuse === null) {
                resolve();
            } else {
                var url = settings.url;
                axios(url, {
                    method:'post',
                    data: {
                        asset: this.settings.raw.diffuse,
                        path: settings.path,
                        guid: WrapviewUtils.guid()
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    responseType: 'json',
                })
                .then((response) => {
                    this.settings.raw.diffuse = null
                    this.settings.resources.diffuse = response.data.url;
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
            }
        })
    }
}

class WrapviewReversibleTexturedMaterial extends WrapviewTexturedMaterial{
    defaults() {
        return {
            type: 'Textured',
            status: {
                base: false,
                layers: false,
                reverse_layers: false,
                reversed: false,
                editing: false
            },
            build:{
                parameters: {
                    base: false,
                    layers: false,
                    size: 2048,
                    inner: 'inherit',
                    color: new WrapviewParameter(this,WrapviewUtils.guid(),{
                        type: 'fixed',
                        descriptor: 'White',
                        value: '#FFFFFF'
                    }),
                    reverse_color: new WrapviewParameter(this,WrapviewUtils.guid(),{
                        type: 'fixed',
                        descriptor: 'White',
                        value: '#FFFFFF'
                    })
                }
            },
            textures: {
                diffuse: null,
                normal: null,
                reverse: null
            },
            raw:{
                diffuse: null,
                reverse: null
            },
            buildable: {
                diffuse: null,
                reverse: null
            },
            resources: {
                base: null,
                diffuse: null,
                normal: null,
                reverse: null
            }

        }
    }

    build() {
        return new Promise((resolve, reject)=> {
            if(this.settings.resources.diffuse === null) {
                reject();
                return;
            }

            if(this.settings.resources.reverse === null) {
                reject();
                return;
            }
            this.settings.textures.diffuse = WrapviewSettings.agent.loaders.texture.load(this.settings.resources.diffuse);
            this.settings.textures.diffuse.encoding = sRGBEncoding;
            this.settings.textures.diffuse.flipY = false;
            this.settings.buildable.diffuse = new WrapviewTexture(this,{
                size: {
                    width: this.settings.build.parameters.size,
                    height: this.settings.build.parameters.size,
                }
            });

            this.settings.textures.reverse = WrapviewSettings.agent.loaders.texture.load(this.settings.resources.reverse);
            this.settings.textures.reverse.encoding = sRGBEncoding;
            this.settings.textures.reverse.flipY = false;
            this.settings.buildable.reverse = new WrapviewTexture(this,{
                size: {
                    width: this.settings.build.parameters.size,
                    height: this.settings.build.parameters.size,
                }
            });

            this.makeMaterial();

            if(this.settings.build.parameters.base) {
                this.buildBaseLayer().then(()=>{
                    var promises = [];
                    if(this.settings.build.parameters.layers) {

                        this.settings.build.parameters.layers.forEach((l)=>{
                            promises.push(this.buildLayer(l,'diffuse'));
                        });

                    }
                    if(this.settings.build.parameters.reverse_layers) {
                        this.settings.build.parameters.reverse_layers.forEach((l) => {
                            promises.push(this.buildLayer(l,'reverse'));
                        });
                    }


                    if(promises.length === 0) {
                        resolve(this._material);
                        return;
                    }

                    Promise.all(promises).then(()=>{
                        this.texture()?.beginEditing().then(()=>{
                            this.texture()?.render();
                            this.toggle().then(()=>{
                                this.texture()?.render();
                                this.texture()?.endEditing();
                                resolve(this._material);                            })
                        });
                    });
                });
            } else {
                resolve(this._material);
            }
        });
    }

    buildBaseLayer(){
        return new Promise((resolve, reject)=>{
            const imageLayer = new LayerTypes.WrapviewImageLayer(WrapviewUtils.guid(),{
                pivot: {
                    x: 0,
                    y: 0
                },
                position: {
                    x: 0,
                    y: 0
                },
                angle: 0
            });

            this.settings.buildable.diffuse.setBaseLayer(imageLayer);
            imageLayer.setColorParameter(this.settings.build.parameters.color);
            imageLayer.lock();

            const reverseLayer = new LayerTypes.WrapviewImageLayer(WrapviewUtils.guid(),{
                pivot: {
                    x: 0,
                    y: 0
                },
                position: {
                    x: 0,
                    y: 0
                },
                angle: 0
            });

            this.settings.buildable.reverse.setBaseLayer(reverseLayer);
            reverseLayer.setColorParameter(this.settings.build.parameters.reverse_color);
            reverseLayer.lock();

            imageLayer.load({
                path: this.settings.resources.base
            }).then(()=>{
                reverseLayer.load({
                    path: this.settings.resources.base
                }).then(()=>{
                    this.settings.status.base = true;
                    resolve(this._material);
                });
            });
        })
    }

    buildLayer(l, t) {
        return new Promise((resolve, reject)=>{
            var uid = WrapviewUtils.guid();
            var layer = new LayerTypes[l.type](uid,{});
            layer.applySettings(l.settings, this);
            this.settings.buildable[t].addLayer(layer);
            layer.load(l.data, this).then(()=>{
                resolve();
            },()=>{
                resolve();
            });
        });
    }

    setCapturedTexture(texture, imageData){
        if(this.settings.status.reversed) {
            this.settings.raw.reverse = imageData;
            if(this.settings.textures.reverse !== null) {
                this.settings.textures.reverse.dispose();
            }
            this.settings.textures.reverse = texture;
            this.settings.textures.reverse.encoding = sRGBEncoding;
            this.settings.textures.reverse.flipY = false;
        } else {
            this.settings.raw.diffuse = imageData;
            if(this.settings.textures.diffuse !== null) {
                this.settings.textures.diffuse.dispose();
            }
            this.settings.textures.diffuse = texture;
            this.settings.textures.diffuse.encoding = sRGBEncoding;
            this.settings.textures.diffuse.flipY = false;
        }

    }

    texture() {
        if(this.settings.status.reversed) {
            return this.settings.buildable.reverse;
        } else {
            return this.settings.buildable.diffuse;
        }
    }

    toggle(){
        return new Promise((resolve, reject)=>{
            if(this.settings.status.editing) {
                this.texture().endEditing().then(()=>{
                    this.settings.status.reversed = !this.settings.status.reversed;
                    this.texture().beginEditing().then(()=>{
                        resolve();
                    });
                });
            } else {
                this.settings.status.reversed = !this.settings.status.reversed;
                if(this.settings.status.reversed) {
                    this._material.map = this.settings.textures.reverse;
                } else {
                    this._material.map = this.settings.textures.diffuse;
                }
                resolve();
            }
        })
    }


    beginEditing(){
        return new Promise((resolve)=>{
            if(!this.settings.status.base) {
                this.buildBaseLayer().then(()=>{

                    if(this.settings.status.reversed) {
                        if(!this.settings.status.reverse_layers) {
                            if(this.settings.build.parameters.reverse_layers) {
                                var promises = [];
                                this.settings.build.parameters.reverse_layers.forEach((l)=>{
                                    promises.push(this.buildLayer(l,'reverse'));
                                });
                                Promise.all(promises).then(()=>{
                                    this._material.map = this.settings.buildable.reverse.texture();
                                    this.settings.status.reverse_layers = true;
                                    this.settings.status.editing = true;
                                    resolve();
                                })
                            } else {
                                this._material.map = this.settings.buildable.reverse.texture();
                                this.settings.status.reverse_layers = true;
                                this.settings.status.editing = true;
                                resolve();
                            }
                        } else {
                            this._material.map = this.settings.buildable.reverse.texture();
                            this.settings.status.reverse_layers = true;
                            this.settings.status.editing = true;
                            resolve();
                        }
                    } else {
                        if(!this.settings.status.layers) {
                            if (this.settings.build.parameters.layers) {
                                var promises = [];
                                this.settings.build.parameters.layers.forEach((l) => {
                                    promises.push(this.buildLayer(l, 'diffuse'));
                                });
                                Promise.all(promises).then(() => {
                                    this._material.map = this.settings.buildable.diffuse.texture();
                                    this.settings.status.layers = true;
                                    this.settings.status.editing = true;
                                    resolve();
                                })
                            } else {
                                this._material.map = this.settings.buildable.diffuse.texture();
                                this.settings.status.layers = true;
                                this.settings.status.editing = true;
                                resolve();
                            }
                        } else {
                            this._material.map = this.settings.buildable.diffuse.texture();
                            this.settings.status.layers = true;
                            this.settings.status.editing = true;
                            resolve();
                        }
                    }
                })
            } else {
                if(this.settings.status.reversed) {
                    if(!this.settings.status.reverse_layers) {
                        if(this.settings.build.parameters.reverse_layers) {
                            var promises = [];
                            this.settings.build.parameters.reverse_layers.forEach((l)=>{
                                promises.push(this.buildLayer(l,'reverse'));
                            });
                            Promise.all(promises).then(()=>{
                                this._material.map = this.settings.buildable.reverse.texture();
                                this.settings.status.reverse_layers = true;
                                this.settings.status.editing = true;
                                resolve();
                            })
                        } else {
                            this._material.map = this.settings.buildable.reverse.texture();
                            this.settings.status.reverse_layers = true;
                            this.settings.status.editing = true;
                            resolve();
                        }
                    } else {
                        this._material.map = this.settings.buildable.reverse.texture();
                        this.settings.status.reverse_layers = true;
                        this.settings.status.editing = true;
                        resolve();
                    }
                } else {
                    if(!this.settings.status.layers) {
                        if (this.settings.build.parameters.layers) {
                            var promises = [];
                            this.settings.build.parameters.layers.forEach((l) => {
                                promises.push(this.buildLayer(l, 'diffuse'));
                            });
                            Promise.all(promises).then(() => {
                                this._material.map = this.settings.buildable.diffuse.texture();
                                this.settings.status.layers = true;
                                this.settings.status.editing = true;
                                resolve();
                            })
                        } else {
                            this._material.map = this.settings.buildable.diffuse.texture();
                            this.settings.status.layers = true;
                            this.settings.status.editing = true;
                            resolve();
                        }
                    } else {
                        this._material.map = this.settings.buildable.diffuse.texture();
                        this.settings.status.layers = true;
                        this.settings.status.editing = true;
                        resolve();
                    }
                }
            }

        })

    }

    endEditing(){
        return new Promise((resolve)=> {
            if(this.settings.status.reversed) {
                this._material.map = this.settings.textures.reverse;
            } else {
                this._material.map = this.settings.textures.diffuse;
            }
            this.settings.status.editing = false;
            resolve();
        });
    }

    makeMaterial() {
        this._material = new MeshPhysicalMaterial({
            map: this.settings.textures.diffuse,
            reflectivity: 0.0,
            roughness: 0.4,
            shadowSide: DoubleSide,
            side: DoubleSide
        });
    }

    uploadDiffuse(s){
        return new Promise((resolve, reject)=>{
            var settings = _.merge({
                url: '/api/panels/save/texture',
                path: 'captures/'
            },s);
            if(this.settings.raw.diffuse === null) {
                resolve();
            } else {
                var url = settings.url;
                axios(url, {
                    method:'post',
                    data: {
                        asset: this.settings.raw.diffuse,
                        path: settings.path,
                        guid: WrapviewUtils.guid()
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    responseType: 'json',
                })
                    .then((response) => {
                        this.settings.raw.diffuse = null
                        this.settings.resources.diffuse = response.data.url;
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            }
        })
    }

    uploadReverse(s){
        return new Promise((resolve, reject)=>{
            var settings = _.merge({
                url: '/api/panels/save/texture',
                path: 'captures/'
            },s);
            if(this.settings.raw.reverse === null) {
                resolve();
            } else {
                var url = settings.url;
                axios(url, {
                    method:'post',
                    data: {
                        asset: this.settings.raw.reverse,
                        path: settings.path,
                        guid: WrapviewUtils.guid()
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    responseType: 'json',
                })
                    .then((response) => {
                        this.settings.raw.reverse = null
                        this.settings.resources.reverse = response.data.url;
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            }
        })
    }

    uploadRawData(s){
        return new Promise((resolve, reject)=>{
            this.uploadDiffuse(s).then(()=> {
                this.uploadReverse(s).then(()=>{
                    resolve();
                },(error)=>{
                    reject(error);
                })
            },(error)=>{
                reject(error);
            })
        })
    }
}


export {
    WrapviewMaterial,
    WrapviewShadowMaterial,
    WrapviewStitchMaterial,
    WrapviewPlainMaterial,
    WrapviewTexturedMaterial,
    WrapviewReversibleTexturedMaterial
}
