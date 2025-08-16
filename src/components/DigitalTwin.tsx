import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls, GLTFLoader, EffectComposer, RenderPass, UnrealBloomPass } from 'three-stdlib';

// Mock Data
import { bodyCompositionData } from '../data/mockData';
import { athletes } from '../data/mockData';

// Model URL (public folder)
const MODEL_URL = '/models/3d_human_body_wireframe_model.glb';

// Label types
type LabelPosition = 'chest' | 'head' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'trunk';

interface Label {
  id: string;
  text: string;
  position: LabelPosition;
  color: string;
  value: number;
  unit: string;
}

export const DigitalTwin3D: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const pulseRef = useRef<number>(0);

  // State for model loading
  const [modelLoaded, setModelLoaded] = useState(false);

  // Get athlete and latest body data
  const athlete = athletes.find(a => a.athlete_id === athleteId);
  const bodyData = bodyCompositionData
    .filter(d => d.athlete_id === athleteId)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];

  // Generate labels from body composition data
  const labels = useMemo<Label[]>(() => {
    if (!bodyData || !athlete) return [];

    const symmetry = bodyData.symmetry;
    if (!symmetry) return [];

    return [
      {
        id: 'muscle',
        text: `Muscle: ${bodyData.muscle_mass_kg.toFixed(1)}kg`,
        position: 'chest',
        color: '#00ff88',
        value: bodyData.muscle_mass_kg,
        unit: 'kg',
      },
      {
        id: 'fat',
        text: `Fat: ${bodyData.fat_mass_kg.toFixed(1)}kg`,
        position: 'trunk',
        color: '#ff6b6b',
        value: bodyData.fat_mass_kg,
        unit: 'kg',
      },
      {
        id: 'armLeft',
        text: `L Arm: ${symmetry.arm_mass_left_kg.toFixed(1)}kg`,
        position: 'leftArm',
        color: symmetry.arm_mass_left_kg < symmetry.arm_mass_right_kg ? '#ffcc00' : '#00ff88',
        value: symmetry.arm_mass_left_kg,
        unit: 'kg',
      },
      {
        id: 'armRight',
        text: `R Arm: ${symmetry.arm_mass_right_kg.toFixed(1)}kg`,
        position: 'rightArm',
        color: symmetry.arm_mass_right_kg < symmetry.arm_mass_left_kg ? '#ffcc00' : '#00ff88',
        value: symmetry.arm_mass_right_kg,
        unit: 'kg',
      },
      {
        id: 'legLeft',
        text: `L Leg: ${symmetry.leg_mass_left_kg.toFixed(1)}kg`,
        position: 'leftLeg',
        color: symmetry.leg_mass_left_kg < symmetry.leg_mass_right_kg ? '#ffcc00' : '#00ff88',
        value: symmetry.leg_mass_left_kg,
        unit: 'kg',
      },
      {
        id: 'legRight',
        text: `R Leg: ${symmetry.leg_mass_right_kg.toFixed(1)}kg`,
        position: 'rightLeg',
        color: symmetry.leg_mass_right_kg < symmetry.leg_mass_left_kg ? '#ffcc00' : '#00ff88',
        value: symmetry.leg_mass_right_kg,
        unit: 'kg',
      },
    ];
  }, [bodyData, athlete]);

  useEffect(() => {
    if (!mountRef.current || !athlete) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000011, 5, 15);

    const camera = new THREE.PerspectiveCamera(85, 16 / 9, 0.1, 1000);
    camera.position.z = 6;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x000011);
    renderer.outputColorSpace = 'srgb';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing: Bloom
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.3;
    bloomPass.strength = 1.0;
    bloomPass.radius = 0.5;
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00d8ff, 1.5, 10);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    // Load model
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2, 2, 2);
        model.position.set(0, -1, 0);
        scene.add(model);
        modelRef.current = model;

        // Apply materials
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.name.toLowerCase().includes('eye')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x00d8ff,
                emissive: 0x00d8ff,
                emissiveIntensity: 2.0,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9,
              });
            } else {
              child.material = new THREE.MeshBasicMaterial({
                color: 0x00d8ff,
                transparent: true,
                opacity: 0.7,
                wireframe: true,
              });
            }
          }
        });

        // ✅ Model loaded! Update state
        setModelLoaded(true);
      },
      (progress) => console.log('Model loading:', ((progress.loaded / progress.total) * 100).toFixed(2) + '%'),
      (error) => console.error('Error loading model:', error)
    );

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = false;
    controlsRef.current = controls;

    // Base ring
    const ringGeometry = new THREE.RingGeometry(1, 1.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d8ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.6;
    scene.add(ring);

    // Animation loop
    const animate = () => {
      const delta = 0.01;
      controls.update();

      // Pulse chest
      if (modelRef.current) {
        pulseRef.current += delta * 2;
        const pulseScale = 1 + 0.05 * Math.sin(pulseRef.current * 5);
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('chest')) {
            child.scale.set(pulseScale, pulseScale, pulseScale);
          }
        });
      }

      // Rotate base
      ring.rotation.z += 0.005;

      // Render
      composer.render();
      requestAnimationFrame(animate);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      composer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (composerRef.current) {
        composerRef.current.dispose();
      }
      if (rendererRef.current) {
        renderer.dispose();
      }
      if (sceneRef.current) {
        scene.clear();
      }
    };
  }, [athleteId, athlete]);

  // Function to project 3D world position to 2D screen
  const getScreenPosition = (worldPos: THREE.Vector3): { x: number; y: number } => {
    if (!cameraRef.current || !rendererRef.current) return { x: 0, y: 0 };

    const vector = worldPos.clone();
    vector.project(cameraRef.current);

    const canvas = rendererRef.current.domElement;
    const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * canvas.clientHeight;

    return { x, y };
  };

  // Define local offsets (relative to model center)
  const labelOffsets: Record<LabelPosition, THREE.Vector3> = {
    chest: new THREE.Vector3(0, 0.8, 0.4),
    head: new THREE.Vector3(0, 1.6, 0.3),
    leftArm: new THREE.Vector3(-0.7, 1.0, 0.1),
    rightArm: new THREE.Vector3(0.7, 1.0, 0.1),
    leftLeg: new THREE.Vector3(-0.3, -0.2, 0.3),
    rightLeg: new THREE.Vector3(0.3, -0.2, 0.3),
    trunk: new THREE.Vector3(0, 0.2, 0.5),
  };

  return (
    <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
      {/* Three.js Canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Left Text Overlay */}
      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 text-left space-y-4 z-10 pointer-events-none">
        <h2 className="text-5xl font-bold text-white tracking-wide">DIGITAL TWIN</h2>
        <p className="text-xl text-gray-300">Welcome to</p>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative text-6xl font-bold text-white drop-shadow-lg">
            {athlete?.name.split(' ')[0].toLowerCase()}
          </div>
        </div>
      </div>

      {/* Dynamic Labels Overlay */}
      {modelLoaded && labels.map((label) => {
        const offset = labelOffsets[label.position];
        const worldPos = offset.clone();

        // Apply model's world transform
        if (modelRef.current) {
          worldPos.applyMatrix4(modelRef.current.matrixWorld);
        }

        const screenPos = getScreenPosition(worldPos);

        return (
          <div
            key={label.id}
            className="absolute bg-black/60 text-xs font-bold px-2 py-1 rounded border pointer-events-none animate-in fade-in zoom-in-95"
            style={{
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              transform: 'translate(-50%, -50%)',
              borderColor: label.color,
              color: label.color,
              textShadow: `0 0 8px ${label.color}`,
            }}
          >
            {label.text}
          </div>
        );
      })}

      {/* Base Glow Rings */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-64 h-16 opacity-30">
        <svg viewBox="0 0 200 20" className="w-full h-full">
          <circle cx="100" cy="10" r="8" fill="none" stroke="#00d8ff" strokeWidth="1" />
          <circle cx="90" cy="10" r="6" fill="none" stroke="#00d8ff" strokeWidth="1" opacity="0.6" />
          <circle cx="110" cy="10" r="6" fill="none" stroke="#00d8ff" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
};