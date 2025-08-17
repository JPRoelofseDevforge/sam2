import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  OrbitControls,
  GLTFLoader,
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  CSS2DRenderer,
  CSS2DObject,
} from 'three-stdlib';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Mock Data
import { bodyCompositionData } from '../data/mockData';
import { athletes, biometricData } from '../data/mockData';

// Model URL
const MODEL_URL = '/models/3d_human_body_wireframe_model.glb';

// Label types — only valid positions
type LabelPosition =
  | 'chest'
  | 'head'
  | 'leftArm'
  | 'rightArm'
  | 'leftLeg'
  | 'rightLeg'
  | 'trunk'
  | 'heartRate'
  | 'ecg'
  | 'ecgTooltip'
  | 'recovery'
  | 'spo2Warning';

interface Label {
  id: string;
  text: string;
  position: LabelPosition;
  color: string;
  value: number;
  unit: string;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
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
  const lastBeatTimeRef = useRef<number>(0);
  const beatHistoryRef = useRef<{ time: number; wave: number[] }[]>([]);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  const labelObjectsRef = useRef<CSS2DObject[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const tempMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // State
  const [modelLoaded, setModelLoaded] = useState(false);
  const [recoveryExplanation, setRecoveryExplanation] = useState<string>('');

  // Get athlete and latest biometric data
  const athlete = athletes.find(a => a.athlete_id === athleteId);
  const bodyData = bodyCompositionData
    .filter(d => d.athlete_id === athleteId)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];

  const latestBiometric = biometricData
    .filter(d => d.athlete_id === athleteId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const restingHeartRate = latestBiometric?.resting_hr || 60;
  const hrv = latestBiometric?.hrv_night || 60;
  const trainingLoad = latestBiometric?.training_load_pct || 80;
  const spo2 = latestBiometric?.spo2_night || 97;
  const temp = latestBiometric?.temp_trend_c || 37.0;
  const sleepDuration = latestBiometric?.sleep_duration_h || 7.5;

  // Simulate fatigue
  const effectiveHrv = Math.max(10, hrv * (1 - trainingLoad / 150));
  const hrColor = effectiveHrv > 55 ? '#00ff88' : effectiveHrv > 45 ? '#ffcc00' : '#ff4757';
  const ecgLineColor = new THREE.Color().lerpColors(
    new THREE.Color(0x0000ff),
    new THREE.Color(0xff0000),
    1 - effectiveHrv / 80
  );

  // 🔹 Temperature-based color
  const tempColor = new THREE.Color().lerpColors(
    new THREE.Color(0x0000ff),
    new THREE.Color(0xff0000),
    (temp - 36.0) / 2.0
  );

  // 🔹 Recovery Score
  const recoveryScore = Math.round(
    (effectiveHrv / 80) * 40 +
    (sleepDuration / 9) * 30 +
    (1 - trainingLoad / 100) * 30
  );
  const recoveryColor = recoveryScore > 80 ? '#00ff88' : recoveryScore > 50 ? '#ffcc00' : '#ff4757';

  // 🔹 Recovery Explanation
  useEffect(() => {
    if (recoveryScore < 60) {
      if (trainingLoad > 90) {
        setRecoveryExplanation('High training load – consider rest');
      } else if (sleepDuration < 7) {
        setRecoveryExplanation('Low sleep duration');
      } else if (effectiveHrv < 45) {
        setRecoveryExplanation('Low HRV – recovery impaired');
      } else if (temp > 37.2) {
        setRecoveryExplanation('Elevated body temperature');
      } else {
        setRecoveryExplanation('Multiple stressors affecting recovery');
      }
    } else {
      setRecoveryExplanation('Optimal recovery state');
    }
  }, [recoveryScore, trainingLoad, sleepDuration, effectiveHrv, temp]);

  // 🔹 7-Day Temp Trend Data
  const tempTrendData = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const filtered = biometricData
      .filter(d => d.athlete_id === athleteId && new Date(d.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(d => ({
        date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        temp: parseFloat(d.temp_trend_c.toFixed(1)),
      }));

    return filtered.length > 0 ? filtered : Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      temp: 36.8 + Math.random() * 0.4,
    }));
  }, [athleteId]);

  // Generate ECG waveform
  const generateEcgWaveform = () => {
    const points: number[] = [];
    for (let x = -0.2; x <= 0; x += 0.02) {
      const y = 0.1 * Math.exp(-((x + 0.1) ** 2) * 100);
      points.push(x, y, 0);
    }
    for (let x = 0; x <= 0.04; x += 0.01) {
      points.push(x, x < 0.02 ? -0.1 : 0.3, 0);
    }
    for (let x = 0.04; x <= 0.2; x += 0.02) {
      const y = 0.15 * Math.exp(-((x - 0.12) ** 2) * 50);
      points.push(x, y, 0);
    }
    return points;
  };

  // Get rolling BPM
  const getRollingBpm = () => {
    const now = performance.now() / 1000;
    const recent = beatHistoryRef.current.filter(b => b.time > now - 60);
    if (recent.length < 2) return restingHeartRate;
    const intervalSec = recent[recent.length - 1].time - recent[0].time;
    const beats = recent.length - 1;
    return (beats / intervalSec) * 60;
  };

  // Labels
  const labels = useMemo<Label[]>(() => {
    if (!bodyData || !athlete || !latestBiometric) return [];

    const symmetry = bodyData.symmetry;
    if (!symmetry) return [];

    const rollingBpm = getRollingBpm();

    const newLabels: Label[] = [
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
      {
        id: 'bpm',
        text: `${Math.round(rollingBpm)} BPM`,
        position: 'heartRate',
        color: hrColor,
        value: rollingBpm,
        unit: 'BPM',
      },
      {
        id: 'ecg',
        text: '',
        position: 'ecg',
        color: '#00d8ff',
        value: 0,
        unit: '',
      },
      {
        id: 'ecgTooltip',
        text: `HRV: ${Math.round(effectiveHrv)} ms`,
        position: 'ecgTooltip',
        color: '#00d8ff',
        value: effectiveHrv,
        unit: 'ms',
      },
      {
        id: 'recovery',
        text: `Recovery: ${recoveryScore}/100`,
        position: 'head',
        color: recoveryColor,
        value: recoveryScore,
        unit: '',
      },
    ];

    if (spo2 < 95) {
      newLabels.push({
        id: 'spo2Warning',
        text: `⚠️ Low O₂: ${spo2.toFixed(1)}%`,
        position: 'trunk',
        color: '#ff4757',
        value: spo2,
        unit: '%',
      });
    }

    return newLabels;
  }, [bodyData, athlete, latestBiometric, hrv, trainingLoad, spo2, recoveryScore]);

  // Update labels
  useEffect(() => {
    if (!labelObjectsRef.current.length || !labels) return;

    labelObjectsRef.current.forEach((labelObj, i) => {
      const data = labels[i];
      if (data && labelObj.element.textContent !== data.text) {
        labelObj.element.textContent = data.text;
        labelObj.element.style.borderColor = data.color;
        labelObj.element.style.color = data.color;
        labelObj.element.style.textShadow = `0 0 4px ${data.color}`;
        labelObj.element.style.fontSize = window.innerWidth < 768 ? '10px' : '12px';
        labelObj.element.style.padding = window.innerWidth < 768 ? '2px 4px' : '4px 6px';
        labelObj.element.style.whiteSpace = 'nowrap';

        if (data.id === 'recovery') {
          labelObj.element.style.fontSize = window.innerWidth < 768 ? '11px' : '14px';
          labelObj.element.style.fontWeight = 'bold';
        }
      }
    });
  }, [labels]);

  // Corrected label offsets (aligned to model)
  const labelOffsets: Record<LabelPosition, THREE.Vector3> = {
    chest: new THREE.Vector3(0, 1.15, 0.4),
    head: new THREE.Vector3(0, 2.3, 0.3),
    leftArm: new THREE.Vector3(-0.8, 1.3, 0.2),
    rightArm: new THREE.Vector3(0.8, 1.3, 0.2),
    leftLeg: new THREE.Vector3(-0.6, -0.3, 0.3),
    rightLeg: new THREE.Vector3(0.6, -0.3, 0.3),
    trunk: new THREE.Vector3(0, 0.7, 0.4),
    heartRate: new THREE.Vector3(0, 1.9, 0.5),
    ecg: new THREE.Vector3(0, 1.15, 0.5), // Centered
    ecgTooltip: new THREE.Vector3(0, 1.7, 0.5),
    recovery: new THREE.Vector3(0, 2.3, 0.3),
    spo2Warning: new THREE.Vector3(0, 0.0, 0.4),
  };

  // 3D Setup Effect
  useEffect(() => {
    if (!mountRef.current || !athlete) return;

    const getWidth = () => mountRef.current?.clientWidth || 800;
    const getHeight = () => mountRef.current?.clientHeight || 600;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000011, 5, 15);
    sceneRef.current = scene;

    // Initialize userData
    (scene.userData as any).ecgLine = null;
    (scene.userData as any).heartGlow = null;
    (scene.userData as any).ecgGrid = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, getWidth() / getHeight(), 0.1, 1000);
    camera.position.z = window.innerWidth < 768 ? 12 : 10; // Wider view
    camera.position.y = 0.5;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(getWidth(), getHeight());
    renderer.setClearColor(0x000011);
    renderer.outputColorSpace = 'srgb';
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(getWidth(), getHeight()),
      1.8,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.2;
    bloomPass.strength = 0.7;
    bloomPass.radius = 0.7;
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // CSS2D Renderer
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(getWidth(), getHeight());
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    mountRef.current.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00d8ff, 1.5, 10);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    // Heartbeat Light
    const heartbeatLight = new THREE.PointLight(0xff0000, 0, 0);
    heartbeatLight.decay = 2;
    scene.add(heartbeatLight);

    // Load model
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
        const verticalScale = window.innerWidth < 768 ? 1.8 : 2.5;
        const horizontalScale = window.innerWidth < 768 ? 1.2 : 1.4;
        model.scale.set(horizontalScale, verticalScale, horizontalScale);
        model.position.set(0, window.innerWidth < 768 ? -0.3 : -0.5, 0);
        model.rotation.y = Math.PI; // Face forward
        scene.add(model);
        modelRef.current = model;

        // Apply temperature-based material
        const tempMaterial = new THREE.MeshBasicMaterial({
          color: tempColor,
          transparent: true,
          opacity: 0.3,
          wireframe: true,
        });
        tempMaterialRef.current = tempMaterial;

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
              child.material = tempMaterial;
            }
          }
        });

        // Heartbeat in chest
        heartbeatLight.position.set(0, 0.8, 0.4);
        heartbeatLight.parent = model;

        // Glow sphere
        const heartGlowGeometry = new THREE.SphereGeometry(0.075, 32, 32);
        const heartGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.8,
        });
        const heartGlow = new THREE.Mesh(heartGlowGeometry, heartGlowMaterial);
        heartGlow.position.set(0, 0.8, 0.4);
        model.add(heartGlow);
        (scene.userData as any).heartGlow = heartGlow;

        // ECG Grid (full width)
        const gridGroup = new THREE.Group();
        gridGroup.position.set(0, 1.15, 0.5);
        for (let x = -3; x <= 3; x += 0.5) {
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(x, -0.1, 0),
              new THREE.Vector3(x, 0.3, 0),
            ]),
            new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.4 })
          );
          gridGroup.add(line);
        }
        model.add(gridGroup);
        (scene.userData as any).ecgGrid = gridGroup;

        // ECG Line (full width)
        const totalPoints = 300;
        const ecgGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(totalPoints * 3);
        for (let i = 0; i < totalPoints; i++) {
          const x = (i / (totalPoints - 1)) * 6 - 3; // [-3, +3]
          positions[i * 3] = x;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
        }
        ecgGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const ecgMaterial = new THREE.LineBasicMaterial({ color: ecgLineColor, linewidth: 2 });
        const ecgLine = new THREE.Line(ecgGeometry, ecgMaterial);
        ecgLine.position.set(0, 1.15, 0.5);
        model.add(ecgLine);
        (scene.userData as any).ecgLine = ecgLine;

        // Create labels
        const labelObjects: CSS2DObject[] = [];
        labels.forEach((label) => {
          const offset = labelOffsets[label.position];
          const dummy = new THREE.Object3D();
          dummy.position.copy(offset);
          model.add(dummy);

          const labelDiv = document.createElement('div');
          labelDiv.className = 'font-bold text-xs px-2 py-1 rounded border bg-black/70 text-white pointer-events-none';
          labelDiv.textContent = label.text;
          labelDiv.style.borderColor = label.color;
          labelDiv.style.color = label.color;
          labelDiv.style.textShadow = `0 0 4px ${label.color}`;
          labelDiv.style.whiteSpace = 'nowrap';
          labelDiv.style.fontSize = window.innerWidth < 768 ? '10px' : '12px';
          labelDiv.style.padding = window.innerWidth < 768 ? '2px 4px' : '4px 6px';

          if (label.id === 'recovery') {
            labelDiv.style.fontSize = window.innerWidth < 768 ? '11px' : '14px';
            labelDiv.style.fontWeight = 'bold';
          }

          const labelObject = new CSS2DObject(labelDiv);
          labelObject.center.set(0.5, 0.5);
          dummy.add(labelObject);
          labelObjects.push(labelObject);
        });
        labelObjectsRef.current = labelObjects;

        setModelLoaded(true);
      },
      (progress) => console.log('Model loading:', ((progress.loaded / progress.total) * 100).toFixed(2) + '%'),
      (error) => console.error('Error loading model:', error)
    );

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = window.innerWidth < 768 ? 0.5 : 0.8;
    controls.zoomSpeed = window.innerWidth < 768 ? 0.8 : 1.0;
    controls.minDistance = window.innerWidth < 768 ? 8 : 10;
    controls.maxDistance = window.innerWidth < 768 ? 20 : 25;
    controls.enablePan = false;
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
      const delta = 0.016;
      const now = performance.now() / 1000;
      controls.update();

      // Chest breathing
      if (modelRef.current) {
        pulseRef.current += delta * 2;
        const pulseScale = 1 + 0.03 * Math.sin(pulseRef.current * 5);
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('chest')) {
            child.scale.set(pulseScale, pulseScale, pulseScale);
          }
        });
      }

      // HRV-based beat timing
      const baseInterval = 60 / restingHeartRate;
      const variability = (70 - effectiveHrv) / 100;
      const jitter = (Math.random() * 2 - 1) * variability * (trainingLoad / 100);
      const interval = baseInterval + jitter;

      if (now - lastBeatTimeRef.current > interval) {
        lastBeatTimeRef.current = now;

        beatHistoryRef.current.push({
          time: now,
          wave: generateEcgWaveform(),
        });

        beatHistoryRef.current = beatHistoryRef.current.filter(b => b.time > now - 60);

        // Pulse visuals
        const heartGlow = (scene.userData as any).heartGlow;
        if (heartGlow) {
          heartGlow.scale.set(1.8, 1.8, 1.8);
          (heartGlow.material as THREE.MeshBasicMaterial).opacity = 1.0;
          setTimeout(() => {
            heartGlow.scale.set(1, 1, 1);
            (heartGlow.material as THREE.MeshBasicMaterial).opacity = 0.8;
          }, 100);
        }

        heartbeatLight.intensity = 8;
        setTimeout(() => {
          heartbeatLight.intensity = 0;
        }, 100);
      }

      // Update ECG Line
      const ecgLine = (scene.userData as any).ecgLine;
      if (ecgLine?.geometry) {
        const positions = ecgLine.geometry.attributes.position.array;
        const timeWindow = 6;
        const totalPoints = 300;

        for (let i = 0; i < totalPoints; i++) {
          const x = (i / (totalPoints - 1)) * 6 - 3;
          positions[i * 3] = x;
          positions[i * 3 + 1] = 0;
        }

        beatHistoryRef.current.forEach((beat) => {
          const delay = now - beat.time;
          if (delay >= 0 && delay <= timeWindow) {
            const baseIndex = Math.round((delay / timeWindow) * totalPoints);
            beat.wave.forEach((_, j) => {
              if (j % 3 === 1) {
                const x = beat.wave[j - 1];
                const y = beat.wave[j];
                const sampleIndex = baseIndex - Math.round(x * 50);
                if (sampleIndex >= 0 && sampleIndex < totalPoints) {
                  positions[sampleIndex * 3 + 1] = Math.max(positions[sampleIndex * 3 + 1], y);
                }
              }
            });
          }
        });

        ecgLine.geometry.attributes.position.needsUpdate = true;
      }

      // Update temperature color
      if (tempMaterialRef.current) {
        tempMaterialRef.current.color.lerpColors(new THREE.Color(0x0000ff), new THREE.Color(0xff0000), (temp - 36.0) / 2.0);
      }

      // Rotate base
      ring.rotation.z += 0.005;

      // Render
      composer.render();
      labelRenderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = getWidth();
      const h = getHeight();

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountRef.current);

    // Cleanup
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      resizeObserver.disconnect();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (labelRendererRef.current?.domElement && mountRef.current?.contains(labelRendererRef.current.domElement)) {
        mountRef.current.removeChild(labelRendererRef.current.domElement);
      }
      composerRef.current?.dispose();
      rendererRef.current?.dispose();
      sceneRef.current?.clear();
    };
  }, [athleteId, athlete, labels, temp]);

  return (
    <ErrorBoundary fallback={<div className="text-red-500 p-4">Something went wrong with the 3D twin.</div>}>
      <div className="relative w-full h-full bg-black flex flex-col">
        {/* 3D Canvas */}
        <div
          ref={mountRef}
          className="flex-1 min-h-[800px] w-full"
          style={{ minHeight: '800px' }}
        />
      </div>
    </ErrorBoundary>
  );
};