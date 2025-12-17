import * as THREE from 'three';
import { OrbitControls } from '../src/Wrapview/plugins/OrbitControls.js';
import { Wrapview } from './Wrapview/Wrapview.js';
import { WrapviewSettings } from './Wrapview/WrapviewSettings.js';
import { WrapviewVectorTextLayer } from './Wrapview/WrapviewLayer.js';
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

const quickTextInput = document.getElementById('quick-text-input');

let vectorText = new WrapviewVectorText('vectorText', {});
if (vectorText) {
    vectorText.addNoneEffect();
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

// Add event listener to apply viewport SVG texture on demand
if (document.getElementById('apply-arch-effect-btn')) {
    document.getElementById('apply-arch-effect-btn').addEventListener('click', () => {
        if (vectorText) {
            vectorText.addArchEffect();
            setTimeout(() => {
                applyViewportSvgTextureToMesh();
            }, 500);
        }
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