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

// API Services
import { dataService } from '../services/dataService';
import { Athlete, BiometricData, BodyComposition } from '../types';

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
  // Current twin refs
  const currentMountRef = useRef<HTMLDivElement>(null);
  const currentSceneRef = useRef<THREE.Scene | null>(null);
  const currentCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const currentRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentComposerRef = useRef<EffectComposer | null>(null);
  const currentControlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const currentLabelRendererRef = useRef<CSS2DRenderer | null>(null);
  const currentLabelObjectsRef = useRef<CSS2DObject[]>([]);

  // Target twin refs
  const targetMountRef = useRef<HTMLDivElement>(null);
  const targetSceneRef = useRef<THREE.Scene | null>(null);
  const targetCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetComposerRef = useRef<EffectComposer | null>(null);
  const targetControlsRef = useRef<OrbitControls | null>(null);
  const targetModelRef = useRef<THREE.Group | null>(null);
  const targetLabelRendererRef = useRef<CSS2DRenderer | null>(null);
  const targetLabelObjectsRef = useRef<CSS2DObject[]>([]);

  // Shared animation refs
  const pulseRef = useRef<number>(0);
  const lastBeatTimeRef = useRef<number>(0);
  const beatHistoryRef = useRef<{ time: number; wave: number[] }[]>([]);
  const animationIdRef = useRef<number | null>(null);

  // State
  const [currentModelLoaded, setCurrentModelLoaded] = useState(false);
  const [targetModelLoaded, setTargetModelLoaded] = useState(false);
  const [recoveryExplanation, setRecoveryExplanation] = useState<string>('');
  const [athlete, setAthlete] = useState<Athlete | undefined>(undefined);
  const [bodyData, setBodyData] = useState<BodyComposition | undefined>(undefined);
  const [latestBiometric, setLatestBiometric] = useState<BiometricData | undefined>(undefined);
  const [biometricHistory, setBiometricHistory] = useState<BiometricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Target/ideal state calculations
  const [targetBodyData, setTargetBodyData] = useState<BodyComposition | undefined>(undefined);
  const [targetBiometric, setTargetBiometric] = useState<BiometricData | undefined>(undefined);

  // View mode state
  const [viewMode, setViewMode] = useState<'side-by-side' | 'current-only' | 'target-only'>('side-by-side');

  // Calculate target/ideal values for the athlete
  const calculateTargetValues = () => {
    if (!bodyData || !latestBiometric || !athlete) return;

    // Calculate ideal body composition based on athlete profile
    const targetBodyComp: BodyComposition = {
      ...bodyData,
      bodyFat: Math.max(6, Math.min(15, bodyData.bodyFat * 0.8)), // Target 20% reduction, but not below 6%
      muscleMass: bodyData.muscleMass * 1.15, // Target 15% increase
      // Balance left/right sides
      armMassLeftKg: Math.max(bodyData.armMassLeftKg || 0, bodyData.armMassRightKg || 0),
      armMassRightKg: Math.max(bodyData.armMassLeftKg || 0, bodyData.armMassRightKg || 0),
      legMassLeftKg: Math.max(bodyData.legMassLeftKg || 0, bodyData.legMassRightKg || 0),
      legMassRightKg: Math.max(bodyData.legMassLeftKg || 0, bodyData.legMassRightKg || 0),
    };

    // Calculate ideal biometric values
    const targetBiometrics: BiometricData = {
      ...latestBiometric,
      resting_hr: Math.max(45, Math.min(60, (latestBiometric.resting_hr || 60) * 0.9)), // Target 10% improvement
      hrv_night: Math.min(100, (latestBiometric.hrv_night || 60) * 1.2), // Target 20% improvement
      training_load_pct: Math.min(85, (latestBiometric.training_load_pct || 80) * 0.95), // Slightly reduce load
      spo2_night: Math.min(100, (latestBiometric.spo2_night || 97) * 1.02), // Slight improvement
      temp_trend_c: 36.8, // Optimal temperature
      sleep_duration_h: Math.min(9, (latestBiometric.sleep_duration_h || 7.5) * 1.1), // Target 10% more sleep
    };

    setTargetBodyData(targetBodyComp);
    setTargetBiometric(targetBiometrics);
  };

  // Calculate target values when current data is available
  useEffect(() => {
    calculateTargetValues();
  }, [bodyData, latestBiometric, athlete]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert athleteId to number if it's a string
        const numericAthleteId = typeof athleteId === 'string' ? parseInt(athleteId, 10) : athleteId;

        // Fetch athlete data
        const athleteData = await dataService.getAthleteData(numericAthleteId);

        setAthlete(athleteData.athlete);
        setBiometricHistory(athleteData.biometricData);

        // Get latest body composition data
        if (athleteData.bodyComposition.length > 0) {
          const latestBodyData = athleteData.bodyComposition
            .sort((a: BodyComposition, b: BodyComposition) =>
              new Date(b.measurementDate || '').getTime() - new Date(a.measurementDate || '').getTime()
            )[0];
          setBodyData(latestBodyData);
        }

        // Get latest biometric data
        if (athleteData.biometricData.length > 0) {
          const latestBioData = athleteData.biometricData
            .sort((a: BiometricData, b: BiometricData) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0];
          setLatestBiometric(latestBioData);
        }

      } catch (err) {
        console.error('Failed to fetch DigitalTwin data:', err);
        setError('Failed to load athlete data');
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchData();
    }
  }, [athleteId]);

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
    if (!biometricHistory.length) {
      return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        temp: 36.8 + Math.random() * 0.4,
      }));
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const filtered = biometricHistory
      .filter((d: BiometricData) => d.athlete_id === athleteId && new Date(d.date) >= sevenDaysAgo)
      .sort((a: BiometricData, b: BiometricData) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d: BiometricData) => ({
        date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        temp: parseFloat((d.temp_trend_c || 0).toFixed(1)),
      }));

    return filtered.length > 0 ? filtered : Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      temp: 36.8 + Math.random() * 0.4,
    }));
  }, [biometricHistory, athleteId]);

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

  // Current twin labels
  const currentLabels = useMemo<Label[]>(() => {
    if (!bodyData || !athlete || !latestBiometric) return [];

    const rollingBpm = getRollingBpm();

    const newLabels: Label[] = [
      {
        id: 'muscle',
        text: `Muscle: ${bodyData.muscleMass?.toFixed(1) || '0.0'}kg`,
        position: 'chest',
        color: '#00ff88',
        value: bodyData.muscleMass || 0,
        unit: 'kg',
      },
      {
        id: 'fat',
        text: `Fat: ${bodyData.bodyFat?.toFixed(1) || '0.0'}%`,
        position: 'trunk',
        color: '#ff6b6b',
        value: bodyData.bodyFat || 0,
        unit: '%',
      },
      {
        id: 'armLeft',
        text: `L Arm: ${bodyData.armMassLeftKg?.toFixed(1) || '0.0'}kg`,
        position: 'leftArm',
        color: (bodyData.armMassLeftKg || 0) < (bodyData.armMassRightKg || 0) ? '#ffcc00' : '#00ff88',
        value: bodyData.armMassLeftKg || 0,
        unit: 'kg',
      },
      {
        id: 'armRight',
        text: `R Arm: ${bodyData.armMassRightKg?.toFixed(1) || '0.0'}kg`,
        position: 'rightArm',
        color: (bodyData.armMassRightKg || 0) < (bodyData.armMassLeftKg || 0) ? '#ffcc00' : '#00ff88',
        value: bodyData.armMassRightKg || 0,
        unit: 'kg',
      },
      {
        id: 'legLeft',
        text: `L Leg: ${bodyData.legMassLeftKg?.toFixed(1) || '0.0'}kg`,
        position: 'leftLeg',
        color: (bodyData.legMassLeftKg || 0) < (bodyData.legMassRightKg || 0) ? '#ffcc00' : '#00ff88',
        value: bodyData.legMassLeftKg || 0,
        unit: 'kg',
      },
      {
        id: 'legRight',
        text: `R Leg: ${bodyData.legMassRightKg?.toFixed(1) || '0.0'}kg`,
        position: 'rightLeg',
        color: (bodyData.legMassRightKg || 0) < (bodyData.legMassLeftKg || 0) ? '#ffcc00' : '#00ff88',
        value: bodyData.legMassRightKg || 0,
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

  // Target twin labels
  const targetLabels = useMemo<Label[]>(() => {
    if (!targetBodyData || !targetBiometric) return [];

    // Calculate target values for display
    const targetRestingHeartRate = targetBiometric.resting_hr || 60;
    const targetHrv = targetBiometric.hrv_night || 60;
    const targetTrainingLoad = targetBiometric.training_load_pct || 80;
    const targetSpo2 = targetBiometric.spo2_night || 97;
    const targetTemp = targetBiometric.temp_trend_c || 36.8;
    const targetSleepDuration = targetBiometric.sleep_duration_h || 7.5;

    // Calculate target colors
    const targetEffectiveHrv = Math.max(10, targetHrv * (1 - targetTrainingLoad / 150));
    const targetHrColor = targetEffectiveHrv > 55 ? '#00ff88' : targetEffectiveHrv > 45 ? '#ffcc00' : '#ff4757';

    const targetRecoveryScore = Math.round(
      (targetEffectiveHrv / 80) * 40 +
      (targetSleepDuration / 9) * 30 +
      (1 - targetTrainingLoad / 100) * 30
    );
    const targetRecoveryColor = targetRecoveryScore > 80 ? '#00ff88' : targetRecoveryScore > 50 ? '#ffcc00' : '#ff4757';

    const newLabels: Label[] = [
      {
        id: 'muscle',
        text: `Muscle: ${targetBodyData.muscleMass?.toFixed(1) || '0.0'}kg`,
        position: 'chest',
        color: '#00ff88',
        value: targetBodyData.muscleMass || 0,
        unit: 'kg',
      },
      {
        id: 'fat',
        text: `Fat: ${targetBodyData.bodyFat?.toFixed(1) || '0.0'}%`,
        position: 'trunk',
        color: '#00ff88',
        value: targetBodyData.bodyFat || 0,
        unit: '%',
      },
      {
        id: 'armLeft',
        text: `L Arm: ${targetBodyData.armMassLeftKg?.toFixed(1) || '0.0'}kg`,
        position: 'leftArm',
        color: '#00ff88',
        value: targetBodyData.armMassLeftKg || 0,
        unit: 'kg',
      },
      {
        id: 'armRight',
        text: `R Arm: ${targetBodyData.armMassRightKg?.toFixed(1) || '0.0'}kg`,
        position: 'rightArm',
        color: '#00ff88',
        value: targetBodyData.armMassRightKg || 0,
        unit: 'kg',
      },
      {
        id: 'legLeft',
        text: `L Leg: ${targetBodyData.legMassLeftKg?.toFixed(1) || '0.0'}kg`,
        position: 'leftLeg',
        color: '#00ff88',
        value: targetBodyData.legMassLeftKg || 0,
        unit: 'kg',
      },
      {
        id: 'legRight',
        text: `R Leg: ${targetBodyData.legMassRightKg?.toFixed(1) || '0.0'}kg`,
        position: 'rightLeg',
        color: '#00ff88',
        value: targetBodyData.legMassRightKg || 0,
        unit: 'kg',
      },
      {
        id: 'bpm',
        text: `${Math.round(targetRestingHeartRate)} BPM`,
        position: 'heartRate',
        color: targetHrColor,
        value: targetRestingHeartRate,
        unit: 'BPM',
      },
      {
        id: 'ecg',
        text: '',
        position: 'ecg',
        color: '#00ff88',
        value: 0,
        unit: '',
      },
      {
        id: 'ecgTooltip',
        text: `HRV: ${Math.round(targetEffectiveHrv)} ms`,
        position: 'ecgTooltip',
        color: '#00ff88',
        value: targetEffectiveHrv,
        unit: 'ms',
      },
      {
        id: 'recovery',
        text: `Recovery: ${targetRecoveryScore}/100`,
        position: 'head',
        color: targetRecoveryColor,
        value: targetRecoveryScore,
        unit: '',
      },
    ];

    if (targetSpo2 < 95) {
      newLabels.push({
        id: 'spo2Warning',
        text: `⚠️ Low O₂: ${targetSpo2.toFixed(1)}%`,
        position: 'trunk',
        color: '#ff4757',
        value: targetSpo2,
        unit: '%',
      });
    }

    return newLabels;
  }, [targetBodyData, targetBiometric]);


  // Update current labels
  useEffect(() => {
    if (!currentLabelObjectsRef.current.length || !currentLabels) return;

    currentLabelObjectsRef.current.forEach((labelObj, i) => {
      const data = currentLabels[i];
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
  }, [currentLabels]);

  // Update target labels
  useEffect(() => {
    if (!targetLabelObjectsRef.current.length || !targetLabels) return;

    targetLabelObjectsRef.current.forEach((labelObj, i) => {
      const data = targetLabels[i];
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
  }, [targetLabels]);

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

  // 3D Setup Effect for current twin
  useEffect(() => {
    if (!currentMountRef.current || !athlete) return;

    const getWidth = () => currentMountRef.current?.clientWidth || 400;
    const getHeight = () => currentMountRef.current?.clientHeight || 600;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2a);
    scene.fog = new THREE.Fog(0x000011, 5, 15);
    currentSceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, getWidth() / getHeight(), 0.1, 1000);
    camera.position.z = window.innerWidth < 768 ? 12 : 10;
    camera.position.y = 0.5;
    camera.lookAt(0, 0, 0);
    currentCameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(getWidth(), getHeight());
    renderer.setClearColor(0x0a0a2a);
    renderer.outputColorSpace = 'srgb';
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMountRef.current.appendChild(renderer.domElement);
    currentRendererRef.current = renderer;

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
    currentComposerRef.current = composer;

    // CSS2D Renderer
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(getWidth(), getHeight());
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    currentMountRef.current.appendChild(labelRenderer.domElement);
    currentLabelRendererRef.current = labelRenderer;

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
        model.rotation.y = Math.PI;
        scene.add(model);
        currentModelRef.current = model;

        // Apply temperature-based material
        const tempMaterial = new THREE.MeshBasicMaterial({
          color: tempColor,
          transparent: true,
          opacity: 0.3,
          wireframe: true,
        });

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

        // ECG Grid
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

        // ECG Line
        const totalPoints = 300;
        const ecgGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(totalPoints * 3);
        for (let i = 0; i < totalPoints; i++) {
          const x = (i / (totalPoints - 1)) * 6 - 3;
          positions[i * 3] = x;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
        }
        ecgGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const ecgMaterial = new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 3
        });

        const ecgLine = new THREE.Line(ecgGeometry, ecgMaterial);
        ecgLine.position.set(0, 1.15, 0.5);
        model.add(ecgLine);

        const ecgMaterial2 = new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 2,
          transparent: true,
          opacity: 0.7
        });

        const ecgLine2 = new THREE.Line(ecgGeometry.clone(), ecgMaterial2);
        ecgLine2.position.set(0, 1.15, 0.51);
        model.add(ecgLine2);

        const ecgMaterial3 = new THREE.LineBasicMaterial({
          color: 0xff3333,
          linewidth: 1,
          transparent: true,
          opacity: 0.5
        });

        const ecgLine3 = new THREE.Line(ecgGeometry.clone(), ecgMaterial3);
        ecgLine3.position.set(0, 1.15, 0.49);
        model.add(ecgLine3);

        (scene.userData as any).ecgLine = ecgLine;

        // Create labels
        const labelObjects: CSS2DObject[] = [];
        currentLabels.forEach((label) => {
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
        currentLabelObjectsRef.current = labelObjects;

        setCurrentModelLoaded(true);
      },
      (progress) => console.log('Current model loading:', ((progress.loaded / progress.total) * 100).toFixed(2) + '%'),
      (error) => console.error('Error loading current model:', error)
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
    currentControlsRef.current = controls;

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
      if (currentModelRef.current) {
        pulseRef.current += delta * 2;
        const pulseScale = 1 + 0.03 * Math.sin(pulseRef.current * 5);
        currentModelRef.current.traverse((child) => {
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

        // Create a trailing effect by gradually reducing y-values
        for (let i = 0; i < totalPoints; i++) {
          const x = (i / (totalPoints - 1)) * 6 - 3;
          positions[i * 3] = x;
          positions[i * 3 + 1] *= 0.95;
        }

        // Apply new beats to the ECG line
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
      if (currentModelRef.current) {
        currentModelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial && !child.name.toLowerCase().includes('eye')) {
            child.material.color.lerpColors(new THREE.Color(0x0000ff), new THREE.Color(0xff0000), (temp - 36.0) / 2.0);
          }
        });
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
      if (!currentMountRef.current) return;
      const w = getWidth();
      const h = getHeight();

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(currentMountRef.current);

    // Cleanup
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      resizeObserver.disconnect();
      if (currentMountRef.current?.contains(renderer.domElement)) {
        currentMountRef.current.removeChild(renderer.domElement);
      }
      if (currentLabelRendererRef.current?.domElement && currentMountRef.current?.contains(currentLabelRendererRef.current.domElement)) {
        currentMountRef.current.removeChild(currentLabelRendererRef.current.domElement);
      }
      currentComposerRef.current?.dispose();
      currentRendererRef.current?.dispose();
      currentSceneRef.current?.clear();
    };
  }, [athleteId, athlete, currentLabels, temp, bodyData, latestBiometric]);

  // 3D Setup Effect for target twin
  useEffect(() => {
    if (!targetMountRef.current || !athlete || !targetBodyData || !targetBiometric) return;

    const getWidth = () => targetMountRef.current?.clientWidth || 400;
    const getHeight = () => targetMountRef.current?.clientHeight || 600;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2a);
    scene.fog = new THREE.Fog(0x000011, 5, 15);
    targetSceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, getWidth() / getHeight(), 0.1, 1000);
    camera.position.z = window.innerWidth < 768 ? 12 : 10;
    camera.position.y = 0.5;
    camera.lookAt(0, 0, 0);
    targetCameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(getWidth(), getHeight());
    renderer.setClearColor(0x0a0a2a);
    renderer.outputColorSpace = 'srgb';
    renderer.setPixelRatio(window.devicePixelRatio);
    targetMountRef.current.appendChild(renderer.domElement);
    targetRendererRef.current = renderer;

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
    targetComposerRef.current = composer;

    // CSS2D Renderer
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(getWidth(), getHeight());
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    targetMountRef.current.appendChild(labelRenderer.domElement);
    targetLabelRendererRef.current = labelRenderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00ff88, 1.5, 10); // Green for target
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
        model.rotation.y = Math.PI;
        scene.add(model);
        targetModelRef.current = model;

        // Apply target material (green)
        const targetMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff88,
          transparent: true,
          opacity: 0.3,
          wireframe: true,
        });

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.name.toLowerCase().includes('eye')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x00ff88,
                emissive: 0x00ff88,
                emissiveIntensity: 2.0,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9,
              });
            } else {
              child.material = targetMaterial;
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

        // ECG Grid
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

        // ECG Line
        const totalPoints = 300;
        const ecgGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(totalPoints * 3);
        for (let i = 0; i < totalPoints; i++) {
          const x = (i / (totalPoints - 1)) * 6 - 3;
          positions[i * 3] = x;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
        }
        ecgGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const ecgMaterial = new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 3
        });

        const ecgLine = new THREE.Line(ecgGeometry, ecgMaterial);
        ecgLine.position.set(0, 1.15, 0.5);
        model.add(ecgLine);

        const ecgMaterial2 = new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 2,
          transparent: true,
          opacity: 0.7
        });

        const ecgLine2 = new THREE.Line(ecgGeometry.clone(), ecgMaterial2);
        ecgLine2.position.set(0, 1.15, 0.51);
        model.add(ecgLine2);

        const ecgMaterial3 = new THREE.LineBasicMaterial({
          color: 0xff3333,
          linewidth: 1,
          transparent: true,
          opacity: 0.5
        });

        const ecgLine3 = new THREE.Line(ecgGeometry.clone(), ecgMaterial3);
        ecgLine3.position.set(0, 1.15, 0.49);
        model.add(ecgLine3);

        (scene.userData as any).ecgLine = ecgLine;

        // Create labels
        const labelObjects: CSS2DObject[] = [];
        targetLabels.forEach((label) => {
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
        targetLabelObjectsRef.current = labelObjects;

        setTargetModelLoaded(true);
      },
      (progress) => console.log('Target model loading:', ((progress.loaded / progress.total) * 100).toFixed(2) + '%'),
      (error) => console.error('Error loading target model:', error)
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
    targetControlsRef.current = controls;

    // Base ring
    const ringGeometry = new THREE.RingGeometry(1, 1.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88, // Green for target
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
      if (targetModelRef.current) {
        pulseRef.current += delta * 2;
        const pulseScale = 1 + 0.03 * Math.sin(pulseRef.current * 5);
        targetModelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('chest')) {
            child.scale.set(pulseScale, pulseScale, pulseScale);
          }
        });
      }

      // Target HRV-based beat timing (better values)
      const targetRestingHeartRate = targetBiometric.resting_hr || 60;
      const targetHrv = targetBiometric.hrv_night || 60;
      const targetTrainingLoad = targetBiometric.training_load_pct || 80;
      const targetEffectiveHrv = Math.max(10, targetHrv * (1 - targetTrainingLoad / 150));
      const baseInterval = 60 / targetRestingHeartRate;
      const variability = (70 - targetEffectiveHrv) / 100;
      const jitter = (Math.random() * 2 - 1) * variability * (targetTrainingLoad / 100);
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

        // Create a trailing effect by gradually reducing y-values
        for (let i = 0; i < totalPoints; i++) {
          const x = (i / (totalPoints - 1)) * 6 - 3;
          positions[i * 3] = x;
          positions[i * 3 + 1] *= 0.95;
        }

        // Apply new beats to the ECG line
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

      // Rotate base
      ring.rotation.z += 0.005;

      // Render
      composer.render();
      labelRenderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!targetMountRef.current) return;
      const w = getWidth();
      const h = getHeight();

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(targetMountRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (targetMountRef.current?.contains(renderer.domElement)) {
        targetMountRef.current.removeChild(renderer.domElement);
      }
      if (targetLabelRendererRef.current?.domElement && targetMountRef.current?.contains(targetLabelRendererRef.current.domElement)) {
        targetMountRef.current.removeChild(targetLabelRendererRef.current.domElement);
      }
      targetComposerRef.current?.dispose();
      targetRendererRef.current?.dispose();
      targetSceneRef.current?.clear();
    };
  }, [athleteId, athlete, targetBodyData, targetBiometric, targetLabels]);

  // Show loading state
  if (loading) {
    return (
      <ErrorBoundary fallback={<div className="text-red-500 p-4">Something went wrong with the 3D twin.</div>}>
        <div className="relative w-full h-full bg-indigo-900 flex items-center justify-center min-h-[800px]">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading athlete data...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorBoundary fallback={<div className="text-red-500 p-4">Something went wrong with the 3D twin.</div>}>
        <div className="relative w-full h-full bg-indigo-900 flex items-center justify-center min-h-[800px]">
          <div className="text-white text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show no data state
  if (!athlete) {
    return (
      <ErrorBoundary fallback={<div className="text-red-500 p-4">Something went wrong with the 3D twin.</div>}>
        <div className="relative w-full h-full bg-indigo-900 flex items-center justify-center min-h-[800px]">
          <div className="text-white text-center">
            <div className="text-gray-400 text-4xl mb-4">👤</div>
            <h3 className="text-lg font-semibold mb-2">Athlete Not Found</h3>
            <p className="text-gray-300">No data available for the selected athlete.</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="text-red-500 p-4">Something went wrong with the 3D twin.</div>}>
      <div className="relative w-full h-full bg-indigo-900 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-indigo-800">
          <h2 className="text-white text-xl font-bold">Digital Twin Comparison</h2>

          {/* View Mode Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('current-only')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'current-only'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setViewMode('target-only')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'target-only'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Target
            </button>
          </div>
        </div>

        {/* Dynamic 3D Canvas based on view mode */}
        <div className={`flex-1 min-h-[800px] ${viewMode === 'side-by-side' ? 'flex flex-col lg:flex-row' : ''}`}>
          {/* Current Twin */}
          {(viewMode === 'side-by-side' || viewMode === 'current-only') && (
            <div className={`${viewMode === 'side-by-side' ? 'flex-1' : 'w-full'} relative bg-indigo-900 p-4`}>
              <div className="text-center mb-4">
                <h3 className="text-white text-lg font-semibold">Current State</h3>
                <p className="text-gray-300 text-sm">Current biometric and body composition data</p>
              </div>
              <div
                ref={currentMountRef}
                className="w-full h-[600px] lg:h-[700px] rounded-lg overflow-hidden"
                style={{ minHeight: '600px' }}
              />
            </div>
          )}

          {/* Target Twin */}
          {(viewMode === 'side-by-side' || viewMode === 'target-only') && (
            <div className={`${viewMode === 'side-by-side' ? 'flex-1' : 'w-full'} relative bg-indigo-900 p-4`}>
              <div className="text-center mb-4">
                <h3 className="text-green-400 text-lg font-semibold">Target State</h3>
                <p className="text-gray-300 text-sm">Optimal biometric and body composition goals</p>
              </div>
              <div
                ref={targetMountRef}
                className="w-full h-[600px] lg:h-[700px] rounded-lg overflow-hidden"
                style={{ minHeight: '600px' }}
              />
            </div>
          )}
        </div>

        {/* Comparison Summary - only show in side-by-side mode */}
        {targetBodyData && targetBiometric && viewMode === 'side-by-side' && (
          <div className="p-4 bg-indigo-800 border-t border-indigo-700">
            <h4 className="text-white text-md font-semibold mb-2">Key Improvements Needed:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-red-400 font-semibold">
                  {((bodyData?.bodyFat || 0) - (targetBodyData?.bodyFat || 0)).toFixed(1)}%
                </div>
                <div className="text-gray-300">Body Fat Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-semibold">
                  +{(targetBodyData?.muscleMass || 0) - (bodyData?.muscleMass || 0) >= 0 ? '+' : ''}{((targetBodyData?.muscleMass || 0) - (bodyData?.muscleMass || 0)).toFixed(1)}kg
                </div>
                <div className="text-gray-300">Muscle Gain</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-semibold">
                  -{((latestBiometric?.resting_hr || 60) - (targetBiometric?.resting_hr || 60)).toFixed(0)} BPM
                </div>
                <div className="text-gray-300">Resting HR</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-semibold">
                  +{((targetBiometric?.hrv_night || 60) - (latestBiometric?.hrv_night || 60)).toFixed(0)}ms
                </div>
                <div className="text-gray-300">HRV Improvement</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};