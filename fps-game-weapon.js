import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(() => {
    const canvas = document.getElementById('weaponCanvas');
    const mount = document.getElementById('weapon');
    if (!canvas || !mount) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.05, 30);
    camera.position.set(-2.1, 1.1, 3.15);
    camera.lookAt(0, 0.04, 0);

    scene.add(new THREE.HemisphereLight(0xd7e8ed, 0x222a34, 2.25));
    const keyLight = new THREE.DirectionalLight(0xffe1c8, 3.0);
    keyLight.position.set(-3.5, 5, 3.2);
    scene.add(keyLight);
    const coolFill = new THREE.DirectionalLight(0x7adaca, 1.6);
    coolFill.position.set(2.2, 2.4, -3.5);
    scene.add(coolFill);

    // Simple first-person sleeves and hands sit around the stock and foregrip.
    const arms = new THREE.Group();
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x26333a, roughness: 0.88 });
    const glove = new THREE.MeshStandardMaterial({ color: 0x171d22, roughness: 0.94 });
    const skin = new THREE.MeshStandardMaterial({ color: 0x9a7059, roughness: 0.92 });
    function limb(a, b, radius, material) {
        const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
        const delta = end.clone().sub(start);
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .8, radius, delta.length(), 10), material);
        mesh.position.copy(start).add(end).multiplyScalar(.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
        arms.add(mesh);
    }
    // Hands are anchored to the Vandal's pistol grip (right) and handguard (left).
    const gripHand = [-.2, -.22, .52], guardHand = [.21, -.12, -.49];
    const at = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
    limb(at(gripHand, [-.45, -.97, .73]), at(gripHand, [-.15, -.16, .4]), .19, sleeve);
    limb(at(guardHand, [.64, -.93, .18]), at(guardHand, [.06, -.16, .35]), .17, sleeve);
    limb(at(gripHand, [-.15, -.16, .4]), gripHand, .105, glove);
    limb(at(guardHand, [.06, -.16, .35]), guardHand, .11, skin);
    scene.add(arms);

    const loader = new GLTFLoader();
    loader.load('./assets/models/rgx-vandal.glb', (gltf) => {
        const rifle = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(rifle);
        const center = bounds.getCenter(new THREE.Vector3());
        rifle.position.sub(center);
        const dimensions = bounds.getSize(new THREE.Vector3());
        const longestSide = Math.max(dimensions.x, dimensions.y, dimensions.z);
        rifle.scale.setScalar(2.45 / longestSide);
        rifle.traverse((node) => {
            if (!node.isMesh) return;
            node.frustumCulled = false;
            node.castShadow = false;
            node.receiveShadow = false;
            if (node.material) {
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material) => {
                    material.side = THREE.DoubleSide;
                    if ('envMapIntensity' in material) material.envMapIntensity = 0.7;
                    material.needsUpdate = true;
                });
            }
        });
        scene.add(rifle);
        mount.classList.add('model-loaded');
    }, undefined, (error) => {
        console.error('Could not load the Vandal model:', error);
        const status = document.getElementById('statusLabel');
        if (status && status.textContent === 'SIMULATION STANDBY') status.textContent = 'VANDAL MODEL UNAVAILABLE';
    });

    function resize() {
        const width = Math.max(1, Math.round(canvas.clientWidth * renderer.getPixelRatio()));
        const height = Math.max(1, Math.round(canvas.clientHeight * renderer.getPixelRatio()));
        if (canvas.width !== width || canvas.height !== height) {
            renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
            camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
            camera.updateProjectionMatrix();
        }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    function frame() {
        resize();
        renderer.render(scene, camera);
        requestAnimationFrame(frame);
    }
    resize();
    requestAnimationFrame(frame);
})();