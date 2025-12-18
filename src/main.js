import * as THREE from 'three';
import { OrbitControls } from '../src/Wrapview/plugins/OrbitControls.js';
import { Wrapview } from './Wrapview/Wrapview.js';
import { WrapviewSettings } from './Wrapview/WrapviewSettings.js';
import { WrapviewMaterialSet } from './Wrapview/WrapviewSets.js';
import { WrapviewShadowMaterial, WrapviewTexturedMaterial, WrapviewStitchMaterial } from './Wrapview/WrapviewMaterial.js';
import { WrapviewParameter } from './Wrapview/WrapviewParameter.js';
import { WrapviewObject } from './Wrapview/WrapviewObject.js';
import { WrapviewSVGLayer } from './Wrapview/WrapviewLayer.js';
import { WrapviewUtils } from './Wrapview/WrapviewUtils.js';

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
const promises = [];

var materials = new WrapviewMaterialSet();
const shadow = new WrapviewShadowMaterial(
    wrapviewInstance,
    {
        resources: {
            alpha:
                "https://combibmark.s3.amazonaws.com/models/shadow_ultra_light_inverted.png",
        },
    }
);

var color = new WrapviewParameter(null, "textColor");
color.set({
    type: "fixed",
    value: "#2b2b2b",
    descriptor: "Black",
});

const collar = new WrapviewTexturedMaterial(
    wrapviewInstance,
    {
        resources: {
            base: "/3001C_SMALL/textures/F_3001C_SMALL_diffuse_1005.png",
            diffuse: "/3001C_SMALL/textures/F_3001C_SMALL_diffuse_1005.png",
            normal: "/3001C_SMALL/textures/F_3001C_SMALL_normal_1005.png",
            alpha: "/3001C_SMALL/textures/F_3001C_SMALL_opacity_1005.png",
            // roughness:
            // 	"/3001C_SMALL/textures/F_3001C_SMALL_roughness_1005.png",
            metalness:
                "/3001C_SMALL/textures/F_3001C_SMALL_metalness_1005.png",
        },
        build: {
            parameters: {
                base: true,
                size: 2048,
                layers: [],
                color: color,
            },
        },
    }
);

const backNeckTape = new WrapviewTexturedMaterial(
    wrapviewInstance,
    {
        resources: {
            base: "/3001C_SMALL/textures/F_3001C_SMALL_diffuse_1006.png",
            diffuse: "/3001C_SMALL/textures/F_3001C_SMALL_diffuse_1006.png",
            normal: "/3001C_SMALL/textures/F_3001C_SMALL_normal_1006.png",
            alpha: "/3001C_SMALL/textures/F_3001C_SMALL_opacity_1006.png",
            // roughness:
            // 	"/3001C_SMALL/textures/F_3001C_SMALL_roughness_1006.png",
            metalness:
                "/3001C_SMALL/textures/F_3001C_SMALL_metalness_1006.png",
        },
        build: {
            parameters: {
                base: true,
                size: 2048,
                layers: [],
                color: color,
            },
        },
    }
);

const leftArmSleeve = new WrapviewTexturedMaterial(
    wrapviewInstance,
    {
        resources: {
            base: "/3001C_SMALL/textures/F_3001C_SMALL_diffuse_1003.png",
            diffuse: "/3001C_SMALL/textures/F_3001C_SMALL_diffuse_1003.png",
            normal: "/3001C_SMALL/textures/F_3001C_SMALL_normal_1003.png",
            alpha: "/3001C_SMALL/textures/F_3001C_SMALL_opacity_1003.png",
            // roughness:
            // 	"/3001C_SMALL/textures/F_3001C_SMALL_roughness_1003.png",
            metalness:
                "/3001C_SMALL/textures/F_3001C_SMALL_metalness_1003.png",
        },
        build: {
            parameters: {
                base: true,
                size: 2048,
                layers: [],
                color: color,
            },
        },
    }
);

const rightArmSleeve = new WrapviewTexturedMaterial(
    wrapviewInstance,
    {
        resources: {
            base: "/3001C_SMALL/textures/F_3001C_SMALL_diffuse_1004.png",
            diffuse: "/3001C_SMALL/textures/F_3001C_SMALL_diffuse_1004.png",
            normal: "/3001C_SMALL/textures/F_3001C_SMALL_normal_1004.png",
            alpha: "/3001C_SMALL/textures/F_3001C_SMALL_opacity_1004.png",
            // roughness:
            // 	"/3001C_SMALL/textures/F_3001C_SMALL_roughness_1004.png",
            metalness:
                "/3001C_SMALL/textures/F_3001C_SMALL_metalness_1004.png",
        },
        build: {
            parameters: {
                base: true, // Enable base layer building for text editing
                size: 2048,
                layers: [],
                color: color,
            },
        },
    }
);

const frontBody = new WrapviewTexturedMaterial(
    wrapviewInstance,
    {
        resources: {
            base: "/3001C_SMALL/textures/F_3001C_SMALL_common.png", // Base layer for text editing
            diffuse: "/3001C_SMALL/textures/F_3001C_SMALL_common.png",
            normal: "/3001C_SMALL/textures/F_3001C_SMALL_normal_1001.png",
            alpha: "/3001C_SMALL/textures/F_3001C_SMALL_opacity_1001.png",
            // roughness:
            // 	"/3001C_SMALL/textures/F_3001C_SMALL_roughness_1001.png",
            metalness:
                "/3001C_SMALL/textures/F_3001C_SMALL_metalness_1001.png",
        },
        build: {
            parameters: {
                base: true, // Enable base layer building for text editing
                size: 2048,
                layers: [],
                color: color,
            },
        },
    }
);

const backBody = new WrapviewTexturedMaterial(
    wrapviewInstance,
    {
        resources: {
            base: "/3001C_SMALL/textures/F_3001C_SMALL_common.png",
            diffuse: "/3001C_SMALL/textures/F_3001C_SMALL_common.png",
            normal: "/3001C_SMALL/textures/F_3001C_SMALL_normal_1002.png",
            alpha: "/3001C_SMALL/textures/F_3001C_SMALL_opacity_1002.png",
            // roughness:
            // 	"/3001C_SMALL/textures/F_3001C_SMALL_roughness_1002.png",
            metalness:
                "/3001C_SMALL/textures/F_3001C_SMALL_metalness_1002.png",
        },
        build: {
            parameters: {
                base: true,
                size: 2048,
                layers: [],
                color: color,
            },
        },
    }
);

const stitches = new WrapviewStitchMaterial(
    wrapviewInstance,
    {
        resources: {
            diffuse: "/3001C_SMALL/textures/Basic_Offset_2193.png",
        },
    }
);

promises.push(
    collar.init(),
    backNeckTape.init(),
    leftArmSleeve.init(),
    rightArmSleeve.init(),
    frontBody.init(),
    backBody.init(),
    shadow.init(),
    stitches.init()
);

const materialsReady = Promise.all(promises);

materials.add("COLLAR", collar);
materials.add("BACK_NECK_TAPE", backNeckTape);
materials.add("LEFT_ARM_SLEEVE", leftArmSleeve);
materials.add("RIGHT_ARM_SLEEVE", rightArmSleeve);
materials.add("FRONT_BODY", frontBody);
materials.add("BACK_BODY", backBody);
materials.add("EXT_Stitches", stitches);
materials.add("99_ShadowPanel", shadow);

const item = new WrapviewObject({
    transform: {
        rotation: {
            y: Math.PI,
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
item.load("/3001C_SMALL/3001C_SMALL_LOD0.glb").then(() => {
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

const svgEditor = wrapviewInstance.svgEditor();
const svgLayersByPanel = {};
const colorTargets = [
    'COLLAR',
    'BACK_NECK_TAPE',
    'LEFT_ARM_SLEEVE',
    'RIGHT_ARM_SLEEVE',
    'FRONT_BODY',
    'BACK_BODY'
];

// Debounce utility to prevent excessive texture updates
let debounceTimer = null;
const debounce = (func, delay) => {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func(...args), delay);
    };
};

const currentPanel = function () {
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

    try {
        await materialsReady;
    } catch (error) {
        console.error('Materials failed to initialize', error);
        return;
    }

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
            size: { width: size, height: size },
            pivot: { x: 0.5, y: 0.5 },
            position: { x: size / 2, y: size / 2 },
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

// Debounced version with 300ms delay
const debouncedApplyTexture = debounce(applyTextTextureToPanels, 300);

const setupSvgEditorUi = () => {
    svgEditor.attachTo('svg-preview-container');
    svgEditor.setOnChange((dataUrl) => {
        debouncedApplyTexture(dataUrl);
    });

    const textInput = document.getElementById('quick-text-input');
    if (textInput) {
        svgEditor.setText(textInput.value || '');
        textInput.addEventListener('input', (e) => svgEditor.setText(e.target.value || ''));
    }

    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-value');
    if (fontSizeSlider) {
        const updateFontSize = (val) => {
            const size = parseInt(val, 10);
            if (Number.isFinite(size)) {
                svgEditor.setFontSize(size);
                if (fontSizeValue) fontSizeValue.textContent = String(size);
            }
        };
        updateFontSize(fontSizeSlider.value);
        fontSizeSlider.addEventListener('input', (e) => updateFontSize(e.target.value));
    }

    const fillColorInput = document.getElementById('fill-color-input');
    if (fillColorInput) {
        svgEditor.setFillColor(fillColorInput.value);
        fillColorInput.addEventListener('input', (e) => svgEditor.setFillColor(e.target.value));
    }

    const outlineColorInput = document.getElementById('outline-color-input');
    if (outlineColorInput) {
        svgEditor.setOutline({ color: outlineColorInput.value });
        outlineColorInput.addEventListener('input', (e) => svgEditor.setOutline({ color: e.target.value }));
    }

    const outlineWidthInput = document.getElementById('outline-width-input');
    if (outlineWidthInput) {
        const updateOutlineWidth = (val) => {
            const width = parseInt(val, 10);
            if (Number.isFinite(width)) {
                svgEditor.setOutline({ width });
            }
        };
        updateOutlineWidth(outlineWidthInput.value);
        outlineWidthInput.addEventListener('input', (e) => updateOutlineWidth(e.target.value));
    }

    const toggleOutlineBtn = document.getElementById('toggle-outline-btn');
    if (toggleOutlineBtn) {
        const setBtnState = (enabled) => {
            toggleOutlineBtn.dataset.enabled = String(!!enabled);
            toggleOutlineBtn.textContent = enabled ? 'Outline On' : 'Outline Off';
        };
        let enabled = toggleOutlineBtn.dataset.enabled === 'true';
        setBtnState(enabled);
        svgEditor.setOutline({ enabled });

        toggleOutlineBtn.addEventListener('click', () => {
            enabled = !enabled;
            setBtnState(enabled);
            svgEditor.setOutline({ enabled });
        });
    }

    const applyEffect = (effect) => svgEditor.setEffect(effect);

    const applyArchBtn = document.getElementById('apply-arch-effect-btn');
    if (applyArchBtn) {
        applyArchBtn.addEventListener('click', () => applyEffect('arch'));
    }

    const applyNoneBtn = document.getElementById('apply-none-effect-btn');
    if (applyNoneBtn) {
        applyNoneBtn.addEventListener('click', () => applyEffect('none'));
    }

    const applyFlagBtn = document.getElementById('apply-flag-effect-btn');
    if (applyFlagBtn) {
        applyFlagBtn.addEventListener('click', () => applyEffect('flag'));
    }

    const fontSelect = document.getElementById('vector-font-select');
    if (fontSelect) {
        svgEditor.setFontFamily(fontSelect.value);
        fontSelect.addEventListener('change', (e) => svgEditor.setFontFamily(e.target.value));
    }
};

materialsReady.then(() => {
    setupSvgEditorUi();
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