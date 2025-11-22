import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ThreeDViewerProps {
    garmentSrc: string;
    mannequinUrl: string;
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ garmentSrc, mannequinUrl }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
        let controls: OrbitControls;
        let animationFrameId: number;

        const init = () => {
            try {
                // Scene
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0x18181b); // bg-zinc-900

                // Camera
                camera = new THREE.PerspectiveCamera(50, mountRef.current!.clientWidth / mountRef.current!.clientHeight, 0.1, 1000);
                camera.position.set(0, 1.6, 3);

                // Renderer
                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                mountRef.current!.appendChild(renderer.domElement);

                // Controls
                controls = new OrbitControls(camera, renderer.domElement);
                controls.target.set(0, 1, 0);
                controls.enableDamping = true;
                controls.minDistance = 1.5;
                controls.maxDistance = 5;
                controls.update();

                // Lighting
                const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
                scene.add(ambientLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
                directionalLight.position.set(5, 5, 5);
                scene.add(directionalLight);

                // Loaders
                const textureLoader = new THREE.TextureLoader();
                const gltfLoader = new GLTFLoader();

                // Load Garment Texture
                textureLoader.load(garmentSrc, (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;

                    // Load Mannequin Model
                    gltfLoader.load(mannequinUrl, (gltf) => {
                        const model = gltf.scene;
                        model.position.set(0, 0, 0);
                        scene.add(model);

                        let bodyMesh: THREE.Mesh | undefined;
                        model.traverse((child) => {
                            if (child instanceof THREE.Mesh) {
                                // Find the main body mesh, assuming it's the largest one
                                if (!bodyMesh || child.geometry.boundingSphere!.radius > bodyMesh.geometry.boundingSphere!.radius) {
                                    bodyMesh = child;
                                }
                            }
                        });

                        if (bodyMesh) {
                            // Decal placement logic
                            const position = new THREE.Vector3(0, 1.3, 0.3); // Position on the chest
                            const orientation = new THREE.Euler(0, 0, 0);
                            const size = new THREE.Vector3(0.6, 0.8, 0.8); // Width, Height, Depth of decal

                            const decalMaterial = new THREE.MeshPhongMaterial({
                                map: texture,
                                specular: 0x444444,
                                shininess: 30,
                                transparent: true,
                                depthTest: true,
                                depthWrite: false,
                                polygonOffset: true,
                                polygonOffsetFactor: -4,
                                wireframe: false,
                            });

                            const decalGeometry = new DecalGeometry(bodyMesh, position, orientation, size);
                            const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
                            scene.add(decalMesh);
                        }
                        
                        setIsLoading(false);
                    }, undefined, (error) => {
                        console.error('An error happened during model loading', error);
                        setError('Failed to load 3D model.');
                        setIsLoading(false);
                    });
                }, undefined, (error) => {
                    console.error('An error happened during texture loading', error);
                    setError('Failed to load garment texture.');
                    setIsLoading(false);
                });
            } catch (err) {
                console.error("Error initializing 3D scene:", err);
                setError("Could not initialize 3D viewer.");
                setIsLoading(false);
            }
        };

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        const handleResize = () => {
            if (!mountRef.current) return;
            const { clientWidth, clientHeight } = mountRef.current;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
        };

        init();
        animate();

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (renderer) {
                renderer.dispose();
                if (renderer.domElement.parentElement) {
                    renderer.domElement.parentElement.removeChild(renderer.domElement);
                }
            }
            // Dispose geometries, materials, textures if needed
             if (scene) {
                while(scene.children.length > 0){ 
                    scene.remove(scene.children[0]); 
                }
            }
        };
    }, [garmentSrc, mannequinUrl]);

    return (
        <div className="w-full h-full relative" ref={mountRef}>
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80">
                    <SpinnerIcon className="w-10 h-10 text-indigo-400" />
                    <p className="mt-2 text-sm text-zinc-300">Cargando modelo 3D...</p>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 text-center">
                    <p className="text-red-400">Error: {error}</p>
                </div>
            )}
             <div className="absolute bottom-2 right-2 p-2 bg-black/50 text-white text-xs rounded-md backdrop-blur-sm">
                Arrastra para rotar / Rueda para hacer zoom
            </div>
        </div>
    );
};

export default ThreeDViewer;