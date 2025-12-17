import * as THREE from 'three';
import { OrbitControls } from '../src/Wrapview/plugins/OrbitControls.js';
import { Wrapview } from './Wrapview/Wrapview.js';
import { WrapviewSettings } from './Wrapview/WrapviewSettings.js';
import { WrapviewTextVector } from './Wrapview/WrapviewTextVector.js';

WrapviewSettings.init();

// Enable GPT-5 mini for all clients
console.log("Enable GPT-5 mini for all clients");

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

// ---- TextVector layer setup and UI bindings ----
const quickTextInput = document.getElementById('quick-text-input');
const fillColorInput = document.getElementById('fill-color-input');
const outlineColorInput = document.getElementById('outline-color-input');
const outlineWidthInput = document.getElementById('outline-width-input');
const toggleOutlineButton = document.getElementById('toggle-outline-btn');
const fontFamilySelect = document.getElementById('font-family-select');
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValue = document.getElementById('font-size-value');
const effectButtons = document.querySelectorAll('.effect-btn');
const charSpacingSlider = document.getElementById('char-spacing-slider');
const charSpacingValue = document.getElementById('char-spacing-value');
const shapeIntensitySlider = document.getElementById('shape-intensity-slider');
const shapeIntensityValue = document.getElementById('shape-intensity-value');
let outlineEnabled = false;

// Create TextVector layer
const textVectorLayer = new WrapviewTextVector('textVectorLayer', {
    fontFamily: 'Impact',
    fontSize: 100,
    text: (quickTextInput?.value) || 'HELLO WORLD',
    color: { fill: (fillColorInput?.value) || '#000000' },
    outline: { include: false, color: (outlineColorInput?.value) || '#000000', thickness: parseFloat(outlineWidthInput?.value) || 2 },
    size: { width: 2048, height: 2048 },
    pivot: { x: 0.5, y: 0.5 },
    position: { x: 1024, y: 1024 },
    angle: 0
});

let currentTextTexture = null;

const updateCubeTextureFromLayer = async () => {
    try {
        await textVectorLayer.generateTexture();
        const canvas = textVectorLayer.getCanvas();
        if (!canvas) return;

        if (currentTextTexture) currentTextTexture.dispose();

        currentTextTexture = new THREE.CanvasTexture(canvas);
        currentTextTexture.needsUpdate = true;
        currentTextTexture.magFilter = THREE.NearestFilter;
        currentTextTexture.minFilter = THREE.LinearMipmapLinearFilter;
        currentTextTexture.generateMipmaps = true;
        currentTextTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const textMaterial = new THREE.MeshBasicMaterial({
            map: currentTextTexture,
            transparent: true,
            alphaTest: 0.01,
            side: THREE.FrontSide
        });

        materials[4] = textMaterial;
        cube.material = materials;
    } catch (err) {
        console.error('Failed updating cube texture from TextVector:', err);
    }
};

// Bind UI controls to TextVector functions
const updateText = () => {
    if (!quickTextInput) return;
    textVectorLayer.setText(quickTextInput.value || '');
    updateCubeTextureFromLayer();
};

const updateFillColor = () => {
    if (!fillColorInput) return;
    textVectorLayer.setFillColor(fillColorInput.value || '#000000');
    updateCubeTextureFromLayer();
};

const updateFontFamily = () => {
    if (!fontFamilySelect) return;
    const selectedOption = fontFamilySelect.options[fontFamilySelect.selectedIndex];
    const fontValue = fontFamilySelect.value || 'Impact';
    const fontUrl = selectedOption.dataset.fontUrl;

    if (fontUrl) {
        console.log('Loading Google Font from:', fontUrl);
        textVectorLayer.loadGoogleFont(fontUrl)
            .then(() => {
                textVectorLayer.setFontUrl(fontUrl);
                textVectorLayer.setFontFamily(fontValue);
                updateCubeTextureFromLayer();
            })
            .catch(err => {
                console.error('Failed to load Google Font:', err);
                textVectorLayer.setFontUrl(null);
                textVectorLayer.setFontFamily('Impact');
                updateCubeTextureFromLayer();
            });
    } else {
        textVectorLayer.setFontUrl(null);
        textVectorLayer.setFontFamily(fontValue);
        updateCubeTextureFromLayer();
    }
};

const updateFontSize = () => {
    if (!fontSizeSlider) return;
    const size = parseInt(fontSizeSlider.value) || 60;
    if (fontSizeValue) fontSizeValue.textContent = size;
    textVectorLayer.setFontSize(size);
    updateCubeTextureFromLayer();
};

const updateOutline = () => {
    const width = parseFloat(outlineWidthInput?.value) || 0;
    const color = outlineColorInput?.value || '#000000';
    textVectorLayer.setOutline({ enabled: outlineEnabled, color, width });
    updateCubeTextureFromLayer();
};

const toggleOutline = () => {
    outlineEnabled = !outlineEnabled;
    if (toggleOutlineButton) {
        toggleOutlineButton.dataset.enabled = outlineEnabled.toString();
        toggleOutlineButton.textContent = outlineEnabled ? 'Outline On' : 'Outline Off';
    }
    updateOutline();
};

const updateCharSpacing = () => {
    const spacing = parseInt(charSpacingSlider.value) || 0;
    if (charSpacingValue) charSpacingValue.textContent = spacing;
    textVectorLayer.setCharSpacing(spacing);
    updateCubeTextureFromLayer();
};

const updateShapeIntensity = () => {
    const intensity = parseInt(shapeIntensitySlider.value) || 100;
    if (shapeIntensityValue) shapeIntensityValue.textContent = intensity;
    textVectorLayer.setShapeIntensity(intensity);
    updateCubeTextureFromLayer();
};

// Effects: connect buttons to setEffect on the TextVector layer
if (effectButtons && effectButtons.length) {
    effectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const effect = btn.dataset.effect || 'none';
            // Toggle active class
            effectButtons.forEach(b => b.classList.toggle('active', b === btn));
            // Set effect and re-generate texture
            textVectorLayer.setEffect(effect);
            // For 'pinch', you may register a custom processor:
            // textVectorLayer.setEffectProcessor((svg, eff, params) => {/* return processed svg */});
            updateCubeTextureFromLayer();
        });
    });
}

// Attach listeners
quickTextInput?.addEventListener('input', updateText);
fillColorInput?.addEventListener('input', updateFillColor);
fontFamilySelect?.addEventListener('change', updateFontFamily);
fontSizeSlider?.addEventListener('input', updateFontSize);
outlineColorInput?.addEventListener('input', updateOutline);
outlineWidthInput?.addEventListener('input', updateOutline);
toggleOutlineButton?.addEventListener('click', toggleOutline);
charSpacingSlider?.addEventListener('input', updateCharSpacing);
shapeIntensitySlider?.addEventListener('input', updateShapeIntensity);

// Seed with initial values and apply texture once
updateText();
updateFillColor();
updateFontFamily();
updateFontSize();
updateOutline();
updateCharSpacing();
updateShapeIntensity();
updateCubeTextureFromLayer();

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