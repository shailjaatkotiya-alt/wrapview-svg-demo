import * as THREE from 'three';
import { OrbitControls } from '../src/Wrapview/plugins/OrbitControls.js';
import { Wrapview } from './Wrapview/Wrapview.js';
import { WrapviewSettings } from './Wrapview/WrapviewSettings.js';
import { WrapviewSvgLayer } from './Wrapview/WrapviewSvgLayer.js';

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
const svgContainer = document.getElementById('main-area');
const svgEditor = wrapviewInstance.svgEditor();
if (svgContainer && svgEditor) {
    svgEditor.attachTo(svgContainer);
} else {
    console.warn('SVG editor or container not available.');
}

// Create SVG layer state
let currentSvgLayer = null;

// Helper to create SVG layer from editor canvas
const createSvgLayerFromEditor = () => {
    const svgData = svgEditor.getDataURL();
    if (!svgData) return null;

    const svgLayer = new WrapviewSvgLayer('svg-layer-' + Date.now(), {
        size: { width: 2560, height: 2560 },
        pivot: { x: 0.5, y: 0.5 },
        position: { x: 1280, y: 1280 },
        angle: 0
    });

    svgLayer.load({ svgData: svgData })
        .then(() => {
            console.log('SVG layer loaded successfully');
            const canvas = svgLayer.getCanvas();
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.generateMipmaps = true;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            
            const svgMaterial = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                alphaTest: 0.01
            });
            materials[0] = svgMaterial;
            cube.material = materials;
            console.log('SVG texture applied to cube front face');
        })
        .catch(error => console.error('Failed to load SVG layer:', error));

    return svgLayer;
};

// Update cube texture when SVG editor changes
svgEditor.setOnChange((dataUrl) => {
    if (!currentSvgLayer) {
        currentSvgLayer = createSvgLayerFromEditor();
        return;
    }
    
    currentSvgLayer.load({ svgData: dataUrl })
        .then(() => {
            if (materials[0].map) {
                materials[0].map.dispose();
            }
            const newCanvas = currentSvgLayer.getCanvas();
            const newTexture = new THREE.CanvasTexture(newCanvas);
            newTexture.needsUpdate = true;
            newTexture.magFilter = THREE.NearestFilter;
            newTexture.minFilter = THREE.LinearMipmapLinearFilter;
            newTexture.generateMipmaps = true;
            newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            materials[0].map = newTexture;
            console.log('SVG texture updated');
        })
        .catch(error => console.error('Failed to update SVG layer:', error));
});

// Initialize SVG layer on startup
setTimeout(() => {
    currentSvgLayer = createSvgLayerFromEditor();
}, 1000);

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