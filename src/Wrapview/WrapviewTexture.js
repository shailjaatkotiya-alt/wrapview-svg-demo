import {
    CanvasTexture,
    sRGBEncoding,
    NearestMipmapNearestFilter, NearestFilter
} from 'three';
import {WrapviewEditor} from './WrapviewEditor.js'
import {WrapviewSettings} from "./WrapviewSettings.js";
import {WrapviewParameter} from "./WrapviewParameter.js";
import {WrapviewUtils} from "./WrapviewUtils.js";
import {WrapviewTexturedMaterial} from "./WrapviewMaterial.js";

class WrapviewTexture {
    constructor(material, settings) {
        this.settings = {};
        _.merge(this.settings, this.defaults(), settings);
        this._container = null;
        this._canvas = null;
        this._context = null;
        this._texture = null;
        this._editor = null;
        this._editingLayer = -1;
        this._offsets = null;
        this._material = material;
        this._withEditor = false;
        this._layers = [];
        this._baseLayer = null;
        this._fabric = null;
        this._isDrawn = false;
        this._sizes = {};
        this._currentSize = null;
        this._isEditing = false;
        this.init();
    }

    defaults() {
        return {
            color: new WrapviewParameter(null, WrapviewUtils.guid(),{
                type: 'fixed',
                value: '#FFFFFF'
            }),
            size: {
                width: 2048,
                height: 2048
            }
        }
    }

    context() {
        return this._context;
    }

    material() {
        return this._material;
    }

    setMaterial(m){
        this._material = m;
    }
    init() {

    }

    texture() {
        return this._texture;
    }

    editor(){
        return this._editor;
    }

    offsets(){
        return this._offsets;
    }

    reverseLayers() {
        var layers = _.cloneDeep(this._layers);
        layers = layers.reverse();
        return layers;
    }

    addLayer(layer) {
        layer.setTexture(this);
        this._layers.push(layer);
        return this._layers.length -1;
    }

    setBaseLayer(layer) {
        layer.setTexture(this);
        this._baseLayer = layer;
    }

    baseLayer(){
        return this._baseLayer;
    }

    layers(n){
        if(typeof n === 'undefined') {
            return this._layers;
        }
        if(this._layers[n]) {
            return this._layers[n];
        }
        return null;
    }

    editLayer(i) {
        this._editingLayer = i;
        this.render();
    }

    selectLayer(point) {

        var layerSelected = false;
        var layers = _.cloneDeep(this._layers);
        layers = layers.reverse();
        layers.forEach((l,i)=>{
            if(!layerSelected) {
                if (!l.isLocked && l.isInBounds({
                    x: point.x * this.offsets().ratio.x,
                    y: point.y * this.offsets().ratio.y
                })) {

                    this.editLayerById(l.id);
                    layerSelected = true;
                }
            }
        });
        return layerSelected;
    }

    editLayerById(id) {
        var map = {};
        this._layers.forEach((l, i)=>{
            map[l.id] = i;
        });
        this.editLayer(map[id]);
    }

    removeCurrentLayer() {
        if(!this.isEditingLayer()) {
            return;
        }
        this._layers.splice(this._editingLayer,1);
        this.stopEditingLayer();
    }


    removeLayerById(id) {
        var map = {};
        this._layers.forEach((l, i)=>{
            map[l.id] = i;
        });
        this._layers.splice(map[id],1);
        if(this._editingLayer === map[id]) {
            this.stopEditingLayer();
        }

    }

    stopEditingLayer() {
        this._editingLayer = -1;
        this.render();
    }
    isEditing(){
        return this._isEditing;
    }
    isEditingLayer() {
        return this._editingLayer !== -1;
    }

    editingLayer() {
        if(typeof this._editingLayer === 'undefined') return null;
        if(this._editingLayer === -1) return null;
        return this.layers(this._editingLayer);
    }

    beginEditing(){
        return new Promise((resolve)=>{
            this._editingLayer = -1;
            this._isEditing = true;
            this.acquire();
            var offsets = _.merge({},this.material().instance().offsets());
            offsets['ratio'] = {
                x: this.settings.size.width / offsets.size.width,
                y: this.settings.size.height / offsets.size.height
            }
            this._offsets = offsets;
            this.material()?.beginEditing().then(()=>{
                this.render();
                resolve();
            });
        })

    }

    endEditing(){
        return new Promise((resolve)=>{
            this._isEditing = false;
            this.capture();
            this._editingLayer = -1;
            if(this._texture && typeof this._texture.dispose === 'function') {
                this._texture.dispose();

            }
            this._texture = null;
            this.release();
            this.material()?.endEditing().then(()=>{
                resolve();
            });
        })
    }

    acquire(){
        this.material().instance().beginEditingTexture(this);
        this._context = this.material().instance().canvas().getContext('2d');
        this._texture = new CanvasTexture(this.material().instance().canvas());
        this._texture.flipY = false;
        this._texture.magFilter = NearestFilter;
        this._texture.encoding = sRGBEncoding;
        this._canvasInitialized = true;
    }

    prep() {
        if(!this._canvasInitialized) {
            this.acquire();
        }
        //this.material().instance().editor().canvas().width = this.settings.size.width;
        //this.material().instance().editor().canvas().height = this.settings.size.height;
        this.material().instance().canvas().width = this.settings.size.width;
        this.material().instance().canvas().height = this.settings.size.height;
    }

    release(){
        this._canvasInitialized = false;
        this.material().instance().canvas().width = 1;
        this.material().instance().canvas().height = 1;
        if(this._withEditor) {
            this.material().instance().editor().release();
        }
        this.material().instance().endEditingTexture();
        this._context = null;
    }

    renderPrint(panel){
        this._baseLayer.setVectorBase(panel);
        this._layers.forEach((layer, i)=>{
            layer.drawVector(panel);
        });
    }

    render() {

        this.prep();
        this._context.clearRect(0,0, this.settings.size.width, this.settings.size.height);
        this._context.globalCompositeOperation = 'source-over';

        //this._baseLayer.fillCanvas(this._context)
        this._baseLayer.draw(this._context);
        this._layers.forEach((layer, i)=>{
            this._context.globalCompositeOperation = 'source-atop';
            layer.draw(this._context);
        });
        this._texture.needsUpdate = true;
        if(this.material().instance().settings.mode === 'editor' && this._isEditing) {
            this.material().instance().editor().render(this);
        }


    }

    capture(){

        if(this.material() instanceof WrapviewTexturedMaterial) {
            this.material()?.setCapturedTexture(
                WrapviewSettings.agent.loaders.texture.load(this.material().instance().canvas().toDataURL("image/png")),
                this.material().instance().canvas().toDataURL("image/png")
            );
        }
        this.release();
    }

    saveImage(imageData){
        return new Promise((resolve, reject)=>{
            var url = '/api/assets/upload/data';
            axios(url, {
                method:'post',
                data: {
                    asset: imageData,
                    path: 'captures',
                    guid: WrapviewUtils.guid()
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                responseType: 'json',
            })
            .then((response) => {
                resolve(response.data.url);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }
}

// Add a helper that always returns a THREE.Texture for this WrapviewTexture instance.
// Relies on THREE being available in this module (the file already imports three in the original code).
// It caches the created texture on this.threeTexture.
WrapviewTexture.prototype.toTexture = function() {
    // prefer existing cached three texture
    if (this.threeTexture) return this.threeTexture;
    // prefer any explicit texture property
    if (this.texture) return this.texture;
    // canvas-backed texture
    if (this.canvas) {
        const tex = new THREE.CanvasTexture(this.canvas);
        tex.needsUpdate = true;
        this.threeTexture = tex;
        return tex;
    }
    // image-backed texture
    if (this.image) {
        const tex = new THREE.Texture(this.image);
        tex.needsUpdate = true;
        this.threeTexture = tex;
        return tex;
    }
    // if object can render into an internal canvas, try to invoke it then use canvas
    if (typeof this.render === 'function') {
        try { this.render(); } catch (e) { /* ignore render errors */ }
        if (this.canvas) {
            const tex = new THREE.CanvasTexture(this.canvas);
            tex.needsUpdate = true;
            this.threeTexture = tex;
            return tex;
        }
    }
    // fallback: create a minimal 1x1 white canvas texture
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1, 1);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    this.threeTexture = tex;
    return tex;
};



export  {
    WrapviewTexture
}
