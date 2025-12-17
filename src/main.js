import * as THREE from 'three';
import { OrbitControls } from '../src/Wrapview/plugins/OrbitControls.js';
import { Wrapview } from './Wrapview/Wrapview.js';
import { WrapviewSettings } from './Wrapview/WrapviewSettings.js';
import { WrapviewVectorText } from './Wrapview/WrapviewVectorText.js';

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

// Create 3D geometry and materials
const geometry = new THREE.BoxGeometry();
const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), // +X (front) - SVG texture
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
];

const cube = new THREE.Mesh(geometry, materials);
scene.add(cube);

camera.position.set(0, 2, 8);
camera.lookAt(0, 0, 0);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7.5);
dirLight.castShadow = true;
scene.add(dirLight);

let vectorText = new WrapviewVectorText('vectorText', {});
let currentEffect = 'none';
if (vectorText) {
    vectorText.addNoneEffect();
    currentEffect = 'none';
    setTimeout(() => {
        applyViewportSvgTextureToMesh();
    }, 500);
}

let vectorTextTexture = null;

const applyViewportSvgTextureToMesh = async () => {
    try {
        if (!vectorText) {
            console.error('Vector text not initialized');
            return;
        }

        const canvas = await vectorText.renderSvgViewportToCanvas();

        if (!canvas) {
            console.error('Failed to get canvas from viewport SVG');
            return;
        }

        // Dispose old texture if it exists
        if (vectorTextTexture) {
            vectorTextTexture.dispose();
        }

        // Create texture from canvas
        vectorTextTexture = new THREE.CanvasTexture(canvas);
        vectorTextTexture.needsUpdate = true;
        vectorTextTexture.magFilter = THREE.NearestFilter;
        vectorTextTexture.minFilter = THREE.LinearMipmapLinearFilter;
        vectorTextTexture.generateMipmaps = true;
        vectorTextTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        // Apply material to cube front face
        const viewportSvgMaterial = new THREE.MeshBasicMaterial({
            map: vectorTextTexture,
            transparent: true,
            alphaTest: 0.01,
            side: THREE.FrontSide
        });

        materials[4] = viewportSvgMaterial;
        cube.material = materials;
        console.log('SVG viewport texture applied to cube');

    } catch (error) {
        console.error('Error applying SVG viewport texture:', error);
    }
};

if (document.getElementById('apply-arch-effect-btn')) {
    document.getElementById('apply-arch-effect-btn').addEventListener('click', () => {
        if (vectorText) {
            currentEffect = 'arch';
            renderEffectAndApplyTexture();
        }
    });
}

if (document.getElementById('apply-none-effect-btn')) {
    document.getElementById('apply-none-effect-btn').addEventListener('click', () => {
        if (vectorText) {
            currentEffect = 'none';
            renderEffectAndApplyTexture();
        }
    });
}

if (document.getElementById('apply-flag-effect-btn')) {
    document.getElementById('apply-flag-effect-btn').addEventListener('click', () => {
        if (vectorText) {
            currentEffect = 'flag';
            renderEffectAndApplyTexture();
        }
    });
}

// Helper to rerender text with current effect and update the texture
const renderEffectAndApplyTexture = () => {
    if (!vectorText) return;
    if (currentEffect === 'arch') {
        vectorText.addArchEffect();
    } else if (currentEffect === 'flag') {
        vectorText.addFlagEffect();
    } else {
        vectorText.addNoneEffect();
    }
    setTimeout(() => {
        applyViewportSvgTextureToMesh();
    }, 500);
};

// UI bindings for text editing and styling
const textInput = document.getElementById('quick-text-input');
if (textInput) {
    textInput.addEventListener('input', (e) => {
        vectorText.setText(e.target.value || '');
        renderEffectAndApplyTexture();
    });
}

const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValue = document.getElementById('font-size-value');
if (fontSizeSlider) {
    const updateFontSize = (val) => {
        const size = parseInt(val, 10);
        if (Number.isFinite(size)) {
            vectorText.setFontSize(size);
            if (fontSizeValue) fontSizeValue.textContent = String(size);
            renderEffectAndApplyTexture();
        }
    };
    // initialize display
    updateFontSize(fontSizeSlider.value);
    fontSizeSlider.addEventListener('input', (e) => updateFontSize(e.target.value));
}

const fillColorInput = document.getElementById('fill-color-input');
if (fillColorInput) {
    fillColorInput.addEventListener('input', (e) => {
        const color = e.target.value;
        vectorText.setFontColor(color);
        renderEffectAndApplyTexture();
    });
}

const outlineColorInput = document.getElementById('outline-color-input');
if (outlineColorInput) {
    outlineColorInput.addEventListener('input', (e) => {
        const color = e.target.value;
        vectorText.setOutlineColor(color);
        renderEffectAndApplyTexture();
    });
}

const outlineWidthInput = document.getElementById('outline-width-input');
if (outlineWidthInput) {
    outlineWidthInput.addEventListener('input', (e) => {
        const thickness = parseInt(e.target.value, 10);
        if (Number.isFinite(thickness)) {
            vectorText.setOutlineThickness(thickness);
            renderEffectAndApplyTexture();
        }
    });
}

const toggleOutlineBtn = document.getElementById('toggle-outline-btn');
if (toggleOutlineBtn) {
    // initialize button state from vectorText
    const setBtnState = (enabled) => {
        toggleOutlineBtn.dataset.enabled = String(!!enabled);
        toggleOutlineBtn.textContent = enabled ? 'Outline On' : 'Outline Off';
    };
    setBtnState(vectorText.getOutlineEnabled());
    toggleOutlineBtn.addEventListener('click', () => {
        const isEnabled = vectorText.getOutlineEnabled();
        vectorText.setOutlineEnabled(!isEnabled);
        setBtnState(!isEnabled);
        renderEffectAndApplyTexture();
    });
}

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