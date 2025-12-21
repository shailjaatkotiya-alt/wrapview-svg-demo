import {
    Scene,
    WebGLRenderer,
    PerspectiveCamera,
    sRGBEncoding,
    PCFSoftShadowMap,
    Clock,
    Mesh,
    Color,
    ShaderChunk
} from 'three';
import { WrapviewSettings } from "./WrapviewSettings.js";
import { WrapviewEditor } from "./WrapviewEditor.js";

export class WrapviewInstance {
    constructor(id, settings) {
        this.id = id;
        this.settings = {};
        _.assign(this.settings, this.defaults(), settings);
        this._scene = null;
        this._camera = null;
        this._renderer = null;
        this._controller = null;
        this._lights = {};
        this._objects = {};
        this._clock = new Clock();
        this._canvas = null;
        this._texture = null;
        this._frameRef = null;
        this._viewer = null;
        this._offsets = null;
        this.animate = () => {
            this._frameRef = requestAnimationFrame(this.animate);
            if (this._viewer !== null) {
                this._renderer.setSize(this._viewer.clientWidth, this._viewer.clientHeight);
                this._camera.aspect = (this._viewer.clientWidth / this._viewer.clientHeight);
                this._camera.updateProjectionMatrix();
            }
            if (this._controller !== null) {
                this._controller.update();
            }
            var deltaTime = this._clock.getDelta();
            Object.keys(this._objects).forEach((i) => {
                const o = this._objects[i];
                o.update(deltaTime);
            });
            Object.keys(this._lights).forEach((i) => {
                const o = this._lights[i];
                o.update();

            });

            this._renderer.render(this._scene, this._camera);
        }
        this.init();
    };

    defaults() {
        return {
            renderer: {
                antialias: true
            },
            camera: {
                fov: 40,
                near: 0.1,
                far: 5000,
                position: {
                    x: 5,
                    y: 2,
                    z: 150
                }
            },
            agent: {
                width: 0,
                height: 0
            },
            mode: 'viewer',
            controller: {
                target: {
                    x: 0,
                    y: 0.5,
                    z: 0
                },
                maxDistance: 200,
                minDistance: 50,
                enable: {
                    pan: false,
                    damping: true
                }
            }
        }
    }

    aspectRatio() {
        return this.settings.agent.width / this.settings.agent.height;
    }
    offsets() {
        return this._offsets;
    }

    editor() {
        return this._editor;
    }

    svgEditor(){
        return this._svgEditor;
    }

    canvas(){
        return this._canvas;
    }

    refreshCanvas() {
        this._canvas.style.width = '1px';
        this._canvas.style.height = '1px';
        this.editor().refresh();
        this._canvas.style.width = this._container.clientWidth + 'px';
        this._canvas.style.height = this._container.clientHeight + 'px';
        this.updateOffsets();
    }

    texture() {
        return this._texture;
    }

    beginEditingTexture(texture) {
        this._texture = texture;
    }

    endEditingTexture() {
        this._texture = null;
    }

    renderer() {
        return this._renderer;
    }

    scene() {
        return this._scene;
    }
    camera() {
        return this._camera;
    }
    controller() {
        return this._controller;
    }
    setController(c) {
        this._controller = c;
    }
    loader() {
        return this._loader;
    }
    setLoader(l) {
        this._loader = l;
    }
    setMaterials(m) {
        this._materials = m;
    }
    init() {
        this._canvas = document.createElement('canvas');
        this._canvas.width = 1;
        this._canvas.height = 1;
        this._editor = new WrapviewEditor(this.id+'_editor',this);

        this._scene = new Scene();
        if (this.settings.renderer.hasOwnProperty('background')) {
            this._scene.background = new Color(this.settings.renderer.background);
        }
        this._renderer = new WebGLRenderer(this.settings.renderer);
        this._renderer.setPixelRatio(WrapviewSettings.agent.pixelRatio);
        this._renderer.setSize(this.settings.agent.width, this.settings.agent.height);
        this._renderer.outputEncoding = sRGBEncoding;
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.soft = true;
        this._renderer.shadowMap.type = PCFSoftShadowMap;
        this._camera = new PerspectiveCamera(this.settings.camera.fov, this.aspectRatio(), this.settings.camera.near, this.settings.camera.far);
        this._camera.position.set(this.settings.camera.position.x,
            this.settings.camera.position.y,
            this.settings.camera.position.z);

    }

    draw(container) {
        this._viewer = container;
        container.appendChild(this._renderer.domElement);
    }

    drawCanvas(container) {
        this._canvas.style.width = container.clientWidth + 'px';
        this._canvas.style.height = container.clientHeight + 'px';
        this._container = container;
        this._container.prepend(this._canvas);
        this.updateOffsets();

    }

    updateOffsets() {

        var cLeft = this._canvas.offsetLeft;
        var cWidth = this._canvas.offsetWidth;
        var cTop = this._canvas.offsetTop;
        var cHeight = this._canvas.offsetHeight;

        this._offsets = {
            position: {
                x: cLeft,
                y: cTop
            },
            size: {
                width: cWidth,
                height: cHeight
            }
        }
        console.log('-- Offsets --', this._offsets);
    }

    addLight(light) {
        light.setInstance(this);
        this._lights[light.id] = light;
        this._scene.add(light.light());
    }

    addObject(obj) {
        obj.setInstance(this);
        this._objects[obj.id] = obj;
        this._scene.add(obj.object());
    }

    removeObject(obj) {
        this._scene.remove(obj.object());
        delete this._objects[obj.id];
    }

    removeLight(light) {
        this._scene.remove(light.light());
        delete this._objects[light.id];
    }

    unload() {
        const objects = Object.keys(this._objects);
        objects.forEach((obj_id) => {
            this.removeObject(this._objects[obj_id]);
        });

        const lights = Object.keys(this._lights);
        lights.forEach((light_id) => {
            this.removeLight(this._lights[light_id]);
        });
        if (this._frameRef !== null) {
            cancelAnimationFrame(this._frameRef);
        }
        this._scene = null;
        this._renderer = null;
        this._camera = null;

    }


}