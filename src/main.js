import * as THREE from 'three';
import { OrbitControls } from '../src/Wrapview/plugins/OrbitControls.js';
import { Wrapview } from './Wrapview/Wrapview.js';
import { WrapviewSettings } from './Wrapview/WrapviewSettings.js';
import { WrapviewMaterialSet } from './Wrapview/WrapviewSets.js';
import { WrapviewShadowMaterial, WrapviewTexturedMaterial, WrapviewStitchMaterial } from './Wrapview/WrapviewMaterial.js';
import { WrapviewParameter } from './Wrapview/WrapviewParameter.js';
import { WrapviewObject } from './Wrapview/WrapviewObject.js';
import { WrapviewSVGLayer, WrapviewVectorSvgTextLayer } from './Wrapview/WrapviewLayer.js';
import { WrapviewUtils } from './Wrapview/WrapviewUtils.js';

// Constants
const TEXTURE_SIZE = 2048;
const MODEL_PATH = '/3001C_SMALL/3001C_SMALL_LOD0.glb';
const TEXTURE_BASE_PATH = '/3001C_SMALL/textures';

// Material configurations for textured panels
const TEXTURED_MATERIALS_CONFIG = {
    COLLAR: { suffix: 1005, base: 'F_3001C_SMALL_diffuse_1005.png' },
    BACK_NECK_TAPE: { suffix: 1006, base: 'F_3001C_SMALL_diffuse_1006.png' },
    LEFT_ARM_SLEEVE: { suffix: 1003, base: 'F_3001C_SMALL_diffuse_1003.png' },
    RIGHT_ARM_SLEEVE: { suffix: 1004, base: 'F_3001C_SMALL_diffuse_1004.png' },
    FRONT_BODY: { suffix: 1001, base: 'F_3001C_SMALL_common.png' },
    BACK_BODY: { suffix: 1002, base: 'F_3001C_SMALL_common.png' },
};

// Effect button configurations
const EFFECT_BUTTONS_CONFIG = [
    { id: 'apply-none-effect-btn', effect: 'none' },
    { id: 'apply-arch-effect-btn', effect: 'arch' },
    { id: 'apply-circle-effect-btn', effect: 'circle' },
    { id: 'apply-flag-effect-btn', effect: 'flag' },
    { id: 'apply-buldge-effect-btn', effect: 'buldge' },
    { id: 'apply-pinch-effect-btn', effect: 'pinch' },
    { id: 'apply-valley-effect-btn', effect: 'valley' },
    { id: 'apply-bridge-effect-btn', effect: 'bridge' },
];

WrapviewSettings.init();

// Initialize Wrapview 3D instance
const threeDiv = document.getElementById("viewer-container");
const wrapviewInstance = Wrapview.makeInstance('main', {
    agent: {
        width: Math.floor(window.innerWidth / 2),
        height: window.innerHeight
    }
});

wrapviewInstance.draw(threeDiv);

// Get THREE.js components
const scene = wrapviewInstance.scene();
const camera = wrapviewInstance.camera();
const renderer = wrapviewInstance.renderer();
// Setup scene rendering
scene.background = new THREE.Color(0xffffff);
renderer.setClearColor(0xffffff);

// Setup orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

wrapviewInstance.updateOffsets();

// Initialize text color parameter
const color = new WrapviewParameter(null, "textColor");
color.set({
    type: "fixed",
    value: "#2b2b2b",
    descriptor: "Black",
});

// Factory function to create textured materials
const createTexturedMaterial = (config) => {
    const { suffix, base } = config;
    return new WrapviewTexturedMaterial(
        wrapviewInstance,
        {
            resources: {
                base: `${TEXTURE_BASE_PATH}/${base}`,
                diffuse: `${TEXTURE_BASE_PATH}/${base}`,
                normal: `${TEXTURE_BASE_PATH}/F_3001C_SMALL_normal_${suffix}.png`,
                alpha: `${TEXTURE_BASE_PATH}/F_3001C_SMALL_opacity_${suffix}.png`,
                metalness: `${TEXTURE_BASE_PATH}/F_3001C_SMALL_metalness_${suffix}.png`,
            },
            build: {
                parameters: {
                    base: true,
                    size: TEXTURE_SIZE,
                    layers: [],
                    color: color,
                },
            },
        }
    );
};

// Create all textured materials
const texturedMaterials = {};
Object.entries(TEXTURED_MATERIALS_CONFIG).forEach(([name, config]) => {
    texturedMaterials[name] = createTexturedMaterial(config);
});

// Create special materials
const shadow = new WrapviewShadowMaterial(
    wrapviewInstance,
    {
        resources: {
            alpha: "https://combibmark.s3.amazonaws.com/models/shadow_ultra_light_inverted.png",
        },
    }
);

const stitches = new WrapviewStitchMaterial(
    wrapviewInstance,
    {
        resources: {
            diffuse: `${TEXTURE_BASE_PATH}/Basic_Offset_2193.png`,
        },
    }
);

// Initialize all materials in parallel
const materialsReady = Promise.all([
    ...Object.values(texturedMaterials).map(m => m.init()),
    shadow.init(),
    stitches.init(),
]);

// Add all materials to the set
const materials = new WrapviewMaterialSet();
Object.entries(texturedMaterials).forEach(([name, material]) => {
    materials.add(name, material);
});
materials.add("EXT_Stitches", stitches);
materials.add("99_ShadowPanel", shadow);

const item = new WrapviewObject({
    transform: {
        rotation: {
            y: 0,
        },
        position: {
            y: 0.16,
        },
        scale: {
            x: 0.8,
            y: 0.8,
            z: 0.8,
        },
    },
});
item.setMaterials(materials);
item.load(MODEL_PATH).then(() => {
    wrapviewInstance.addObject(item);
});

camera.position.set(0, 0, 2);
camera.lookAt(0, 0, 0);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7.5);
dirLight.castShadow = true;
scene.add(dirLight);

// Debounce utility to prevent excessive texture updates
let debounceTimer = null;
const debounce = (func, delay) => {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func(...args), delay);
    };
};

const currentPanel = () => {
    const panel = materials.get("FRONT_BODY");
    if (!panel) {
        console.error("FRONT_BODY panel not found in materials");
        return null;
    }
    return panel;
}

let currentSvgLayer = null;

const applyTextTextureToPanels = async (dataUrl) => {
    if (!dataUrl) {
        console.warn('No data URL provided for texture');
        return;
    }

    // try {
    //     await materialsReady;
    // } catch (error) {
    //     console.error('Materials failed to initialize', error);
    //     return;
    // }

    const panel = currentPanel();
    if (!panel) {
        return;
    }
    if (!panel.texture()) {
        console.error('Cannot add SVG layer: texture not initialized');
        return;
    }

    const size = panel.settings.build?.parameters?.size || 2048;

    if (!currentSvgLayer) {
        currentSvgLayer = new WrapviewSVGLayer(WrapviewUtils.guid(), {
            size: { width: 480, height: 480 },
            pivot: { x: 0.5, y: 0.5 },
            position: { x: size / 2, y:  size / 3 },
            angle: 0,
        });
    }

    const layer = currentSvgLayer;
    const texture = panel.texture();

    await texture.beginEditing();
    try {
        const layers = texture.layers();
        let layerIndex = layers.findIndex((l) => l.id === layer.id);
        if (layerIndex === -1) {
            layerIndex = texture.addLayer(layer);
        }

        await layer.load({
            svgData: dataUrl,
        }, panel);

        texture.editLayer(layerIndex);
        texture.render();
    } catch (error) {
        console.error('Error loading text layer:', error);
    } finally {
        await texture.endEditing();
    }

    console.log('Text texture applied to garment panel');
};

const debouncedApplyTexture = debounce(applyTextTextureToPanels, 300);

let vectorTextLayer = null;
let currentEffect = 'none';

const updateGarmentTexture = async () => {
    try {
        if (!vectorTextLayer || !vectorTextLayer._canvas) {
            console.warn('Vector text layer or canvas not ready');
            return;
        }

        const dataUrl = vectorTextLayer._canvas.toDataURL("image/png");
        applyTextTextureToPanels(dataUrl);
    } catch (error) {
        console.error('Error applying SVG viewport texture:', error);
    }
};

const renderEffectAndApplyTexture = async () => {
    if (!vectorTextLayer) return;

    try {
        await vectorTextLayer.setEffect(currentEffect);
        // Wait for the canvas to be updated
        await new Promise(resolve => setTimeout(resolve, 100));
        updateGarmentTexture();
    } catch (error) {
        console.error('Error rendering effect:', error);
    }
};

const setupVectorTextUi = () => {
    // Helper function to get element safely
    const getElement = (id) => document.getElementById(id);

    // Text input handler
    const textInput = getElement('quick-text-input');
    if (textInput) {
        textInput.value = vectorTextLayer?.getText() || 'Hello World';
        textInput.addEventListener('input', (e) => {
            if (vectorTextLayer) {
                vectorTextLayer.setText(e.target.value || '');
                renderEffectAndApplyTexture();
            }
        });
    }

    // Font size slider handler
    const fontSizeSlider = getElement('font-size-slider');
    const fontSizeValue = getElement('font-size-value');
    if (fontSizeSlider) {
        const updateFontSize = (val) => {
            const size = parseInt(val, 10);
            if (Number.isFinite(size) && vectorTextLayer) {
                vectorTextLayer.setFontSize(size);
                if (fontSizeValue) fontSizeValue.textContent = size;
                renderEffectAndApplyTexture();
            }
        };
        updateFontSize(fontSizeSlider.value);
        fontSizeSlider.addEventListener('input', (e) => updateFontSize(e.target.value));
    }

    // Color and number input handler factory
    const createColorInputHandler = (elementId, setterMethod) => {
        const element = getElement(elementId);
        if (element) {
            element.addEventListener('input', (e) => {
                if (vectorTextLayer) {
                    vectorTextLayer[setterMethod](e.target.value);
                    renderEffectAndApplyTexture();
                }
            });
        }
    };

    const createNumberInputHandler = (elementId, setterMethod) => {
        const element = getElement(elementId);
        if (element) {
            element.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10);
                if (Number.isFinite(value) && vectorTextLayer) {
                    vectorTextLayer[setterMethod](value);
                    renderEffectAndApplyTexture();
                }
            });
        }
    };

    // Setup color inputs
    createColorInputHandler('fill-color-input', 'setColor');
    createColorInputHandler('outline-color-input', 'setOutlineColor');
    createNumberInputHandler('outline-width-input', 'setOutlineThickness');

    // Outline toggle button
    const toggleOutlineBtn = getElement('toggle-outline-btn');
    if (toggleOutlineBtn) {
        const setBtnState = (enabled) => {
            toggleOutlineBtn.dataset.enabled = String(!!enabled);
            toggleOutlineBtn.textContent = enabled ? 'Outline On' : 'Outline Off';
        };
        setBtnState(vectorTextLayer?.outline()?.includes || false);
        toggleOutlineBtn.addEventListener('click', () => {
            if (vectorTextLayer) {
                const isEnabled = vectorTextLayer.outline()?.includes || false;
                isEnabled ? vectorTextLayer.removeOutline() : vectorTextLayer.addOutline();
                setBtnState(!isEnabled);
                renderEffectAndApplyTexture();
            }
        });
    }

    // Effect buttons
    EFFECT_BUTTONS_CONFIG.forEach(({ id, effect }) => {
        const btn = getElement(id);
        if (btn) {
            btn.addEventListener('click', () => {
                currentEffect = effect;
                renderEffectAndApplyTexture();
            });
        }
    });
};

materialsReady.then(async () => {
    const panel = currentPanel();
    if (!panel) {
        console.error('Front body panel not found');
        return;
    }

    const size = panel.settings.build?.parameters?.size || 2048;

    // Create the vector text layer with basic settings
    vectorTextLayer = new WrapviewVectorSvgTextLayer(WrapviewUtils.guid(), {
        size: { width: 480, height: 480 },
        pivot: { x: 0.5, y: 0.5 },
        position: { x: size / 2, y: size / 2  },
        angle: 0,
    });

    vectorTextLayer.setApiKey('AIzaSyDwE8sM8Ts9SE1ZFkBqEtHNX_3MIwnKNTw');

    // Initial settings to apply - these require the material (panel) for WrapviewParameter creation
    const initialSettings = {
        text: 'Hello World',
        font: {
            family: 'ABeeZee',
            variant: 500,
            source: 'google'
        },
        fontSize: 48,
        color: '#ffffff',
        size: { width: 480, height: 480 },
        pivot: { x: 0.5, y: 0.5 },
        position: { x: size / 2, y: size / 2 },
        angle: 0,
        effect: {
            effectName: 'none',
            effectProperties: {
                intensity: 0,
                characterSpacing: 1
            }
        },
        outline: {
            includes: false,
            color: '#000000',
            thickness: 2
        },
    };

    try {
        // Use applySettings to initialize the layer with all settings and the panel (material)
        await vectorTextLayer.applySettings(initialSettings, panel);
        currentEffect = 'none';
        setupVectorTextUi();
        setTimeout(() => {
            updateGarmentTexture();
        }, 500);
    } catch (error) {
        console.error('Failed to initialize vector text layer:', error);
    }
}).catch((error) => {
    console.error('Failed to initialize materials:', error);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});