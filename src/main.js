import * as THREE from 'three';
import { OrbitControls } from '../src/Wrapview/plugins/OrbitControls.js';
import { Wrapview } from './Wrapview/Wrapview.js';
import { WrapviewSettings } from './Wrapview/WrapviewSettings.js';
import { WrapviewSVGLayer } from './Wrapview/WrapviewLayer.js';

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

// Setup SVG text editor
const svgContainer = document.getElementById('editor-panel');
const svgEditor = wrapviewInstance.svgEditor();
if (svgContainer && svgEditor) {
    svgEditor.attachTo(svgContainer);
} else {
    console.warn('SVG editor or container not available.');
}

const quickTextInput = document.getElementById('quick-text-input');
const fillColorInput = document.getElementById('fill-color-input');
const outlineColorInput = document.getElementById('outline-color-input');
const outlineWidthInput = document.getElementById('outline-width-input');
const toggleOutlineButton = document.getElementById('toggle-outline-btn');
const effectButtons = document.querySelectorAll('.effect-btn');
let outlineEnabled = false;

// SVG layer and texture management
let currentSvgLayer = new WrapviewSVGLayer('svgTextLayer', {
    size: { width: 2560, height: 2560 },
    pivot: { x: 0.5, y: 0.5 },
    position: { x: 1280, y: 1280 },
    angle: 0
});
let currentTextTexture = null;

// Helper to apply text texture to cube front face
const applyTextTextureToCube = async (dataUrl) => {
    if (!dataUrl) {
        console.warn('No data URL provided for texture');
        return;
    }

    try {
        // Update SVG layer with new data URL
        await currentSvgLayer.updateFromDataUrl(dataUrl);
        
        // Get canvas from layer
        const canvas = currentSvgLayer.getCanvas();
        if (!canvas) {
            console.error('Failed to get canvas from SVG layer');
            return;
        }

        // Dispose old texture if it exists
        if (currentTextTexture) {
            currentTextTexture.dispose();
        }

        // Create texture from layer canvas
        currentTextTexture = new THREE.CanvasTexture(canvas);
        currentTextTexture.needsUpdate = true;
        currentTextTexture.magFilter = THREE.NearestFilter;
        currentTextTexture.minFilter = THREE.LinearMipmapLinearFilter;
        currentTextTexture.generateMipmaps = true;
        currentTextTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        // Apply material to cube
        const textMaterial = new THREE.MeshBasicMaterial({
            map: currentTextTexture,
            transparent: true,
            alphaTest: 0.01,
            side: THREE.FrontSide
        });

        materials[0] = textMaterial;
        cube.material = materials;
        console.log('Text texture applied to cube front face via WrapviewSVGLayer');
    } catch (error) {
        console.error('Error applying text texture:', error);
    }
};

// Setup editor change listener for real-time texture updates
if (svgEditor) {
    svgEditor.setOnChange((dataUrl) => {
        if (dataUrl) {
            applyTextTextureToCube(dataUrl);
        }
    });

    const updateText = () => {
        if (!quickTextInput) return;
        svgEditor.setText(quickTextInput.value || '');
    };

    const updateFillColor = () => {
        if (!fillColorInput) return;
        svgEditor.setFillColor(fillColorInput.value || '#000000');
    };

    const updateOutline = () => {
        const width = parseFloat(outlineWidthInput?.value) || 0;
        const color = outlineColorInput?.value || '#000000';
        svgEditor.setOutline({ enabled: outlineEnabled, color, width });
    };

    const toggleOutline = () => {
        outlineEnabled = !outlineEnabled;
        if (toggleOutlineButton) {
            toggleOutlineButton.dataset.enabled = outlineEnabled.toString();
            toggleOutlineButton.textContent = outlineEnabled ? 'Outline On' : 'Outline Off';
        }
        updateOutline();
    };

    const setEffect = (effect) => {
        if (!effect) return;
        svgEditor.setEffect(effect);
        effectButtons.forEach(btn => {
            if (btn.dataset.effect === effect) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    if (quickTextInput) {
        quickTextInput.addEventListener('input', updateText);
    }

    if (fillColorInput) {
        fillColorInput.addEventListener('input', updateFillColor);
    }

    if (outlineColorInput) {
        outlineColorInput.addEventListener('input', updateOutline);
    }

    if (outlineWidthInput) {
        outlineWidthInput.addEventListener('input', updateOutline);
    }

    if (toggleOutlineButton) {
        toggleOutlineButton.addEventListener('click', toggleOutline);
    }

    if (effectButtons.length) {
        effectButtons.forEach(btn => {
            btn.addEventListener('click', () => setEffect(btn.dataset.effect));
        });
    }

    // Seed editor with initial UI values
    updateText();
    updateFillColor();
    updateOutline();
    const initialEffect = Array.from(effectButtons).find(b => b.classList.contains('active'))?.dataset.effect || 'none';
    setEffect(initialEffect);
}

// Initialize text texture on startup
if (svgEditor) {
    setTimeout(() => {
        const initialDataUrl = svgEditor.getDataURL();
        if (initialDataUrl) {
            applyTextTextureToCube(initialDataUrl);
            console.log('Initial text texture loaded via WrapviewSVGLayer');
        }
    }, 500);
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