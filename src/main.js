import * as THREE from 'three';
import { OrbitControls } from '../src/Wrapview/plugins/OrbitControls.js';
import { Wrapview } from './Wrapview/Wrapview.js';
import { WrapviewObject } from './Wrapview/WrapviewObject.js';
import { WrapviewSettings } from './Wrapview/WrapviewSettings.js';
import { WrapviewSvgLayer } from './Wrapview/WrapviewSvgLayer.js';

WrapviewSettings.init();

const threeDiv = document.getElementById("viewer-container");
const wrapviewInstance = Wrapview.makeInstance('main', {
    agent: {
        width: Math.floor(window.innerWidth / 2),
        height: window.innerHeight
    }
});

wrapviewInstance.draw(threeDiv);
const scene = wrapviewInstance.scene();
const camera = wrapviewInstance.camera();
const renderer = wrapviewInstance.renderer();
scene.background = new THREE.Color(0xffffff);
renderer.setClearColor(0xffffff);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

const geometry = new THREE.BoxGeometry();

const defaultMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const materials = [
    defaultMaterial, 
    defaultMaterial, 
    defaultMaterial, 
    defaultMaterial, 
    defaultMaterial, 
    defaultMaterial  
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

// SVG Editor Setup
const svgContainer = document.getElementById('main-area');
const svgEditor = wrapviewInstance.svgEditor();
if (svgContainer && svgEditor) {
    svgEditor.attachTo(svgContainer);
} else {
    console.warn('SVG editor or container not available.');
}

// Create and use SVG Layer
let currentSvgLayer = null;

const createSvgLayerFromEditor = () => {
    const svgData = svgEditor.getDataURL();
    if (!svgData) {
        console.warn('No SVG data available from editor');
        return null;
    }

    const svgLayer = new WrapviewSvgLayer('svg-layer-' + Date.now(), {
        size: { width: 2560, height: 2560 },
        pivot: { x: 0.5, y: 0.5 },
        position: { x: 1280, y: 1280 },
        angle: 0
    });

    // Load the SVG data
    svgLayer.load({ svgData: svgData })
        .then(() => {
            console.log('SVG layer loaded successfully');
            
            // Create texture from SVG layer canvas with optimal filtering for zoom
            const canvas = svgLayer.getCanvas();
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            // Use NearestFilter for pixel-perfect rendering at native resolution
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.generateMipmaps = true;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            
            // Apply to cube material with transparency support
            const svgMaterial = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                alphaTest: 0.01
            });
            materials[0] = svgMaterial; // Apply to front face
            cube.material = materials;
            
            console.log('SVG layer applied as texture to cube');
        })
        .catch(error => {
            console.error('Failed to load SVG layer:', error);
        });

    return svgLayer;
};

// Update SVG layer when editor changes
svgEditor.setOnChange((dataUrl) => {
    if (!currentSvgLayer) {
        // Create initial SVG layer
        currentSvgLayer = createSvgLayerFromEditor();
    } else {
        // Update existing SVG layer
        currentSvgLayer.load({ svgData: dataUrl })
            .then(() => {
                // Dispose old texture and create new one for proper update
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
                console.log('SVG layer updated');
            })
            .catch(error => {
                console.error('Failed to update SVG layer:', error);
            });
    }
});

// Initialize SVG layer on startup
setTimeout(() => {
    currentSvgLayer = createSvgLayerFromEditor();
}, 1000);

// GLB Object Loading
const wrapviewObject = new WrapviewObject({
    transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
    },
});

wrapviewObject.setInstance(wrapviewInstance);

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