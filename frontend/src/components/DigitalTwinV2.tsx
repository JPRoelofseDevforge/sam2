import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Heart,
  Wind,
  Brain,
  Eye,
  Ear,
  Activity,
  Dna,
  Moon,
  Thermometer,
  Droplets,
  Target,
  Shield,
  Atom,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Stethoscope,
  Microscope,
  Zap,
  Gauge,
  Layers,
  Scan,
  Pill,
  Ruler,
  Weight,
  Percent,
  Timer,
  ChevronRight,
  Filter,
  Download,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Athlete as AthleteType, BiometricData as BiometricDataType, GeneticProfile, BodyComposition } from '../types';

// Enhanced Medical-Grade Styling
const medicalStyles = `
  .medical-gradient {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  }

  .hologram-glow {
    box-shadow:
      0 0 20px rgba(34, 211, 238, 0.3),
      inset 0 0 20px rgba(34, 211, 238, 0.05);
  }

  .medical-pulse {
    animation: medicalPulse 2s ease-in-out infinite;
  }

  .organ-highlight {
    filter: drop-shadow(0 0 8px currentColor);
    transition: all 0.3s ease;
  }

  .organ-highlight:hover {
    filter: drop-shadow(0 0 16px currentColor);
    transform: scale(1.05);
  }

  .data-stream {
    animation: dataStream 3s linear infinite;
  }

  .neural-network {
    background-image:
      radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%);
  }

  @keyframes medicalPulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }

  @keyframes dataStream {
    0% { transform: translateY(100%); opacity: 0; }
    10%, 90% { opacity: 1; }
    100% { transform: translateY(-100%); opacity: 0; }
  }

  .glass-morphism {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(34, 211, 238, 0.2);
  }

  .critical-alert {
    animation: criticalAlert 1s ease-in-out infinite alternate;
  }

  @keyframes criticalAlert {
    0% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
    100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
  }

  .scan-line {
    animation: scanLine 4s linear infinite;
  }

  @keyframes scanLine {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
`;

// Enhanced TypeScript interfaces for medical data
interface MedicalBiometricData {
  heart_rate: number;
  hrv: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  temperature: number;
  oxygen_saturation: number;
  respiratory_rate: number;
  stress_level: number;
  blood_glucose?: number;
  cortisol_level?: number;
  inflammation_markers?: number;
  recovery_score: number;
  timestamp: string;
}

interface AdvancedGeneticProfile {
  dna_health_score: number;
  genetic_markers: {
    cardiovascular_risk: 'low' | 'medium' | 'high';
    metabolic_efficiency: 'poor' | 'average' | 'excellent';
    recovery_rate: 'slow' | 'normal' | 'fast';
    injury_predisposition: 'low' | 'medium' | 'high';
    endurance_capacity: 'low' | 'medium' | 'high';
    strength_potential: 'low' | 'medium' | 'high';
  };
  nutrigenomics: {
    vitamin_d_metabolism: string;
    caffeine_metabolism: string;
    carbohydrate_response: string;
    protein_utilization: string;
    fat_metabolism: string;
  };
  pharmacogenomics: {
    pain_medication_response: string;
    anti_inflammatory_response: string;
    cardiovascular_medication: string;
  };
  disease_risk_factors: {
    diabetes_risk: number;
    cardiovascular_disease_risk: number;
    osteoporosis_risk: number;
    cancer_predisposition: number;
  };
}

interface ComprehensiveBodyComposition {
  skeletal_muscle_mass: number;
  body_fat_percentage: number;
  visceral_fat_level: number;
  bone_density_score: number;
  hydration_level: number;
  segmental_analysis: {
    left_arm: { muscle: number; fat: number };
    right_arm: { muscle: number; fat: number };
    left_leg: { muscle: number; fat: number };
    right_leg: { muscle: number; fat: number };
    trunk: { muscle: number; fat: number };
  };
  metabolic_rate: {
    bmr: number; // Basal Metabolic Rate
    tdee: number; // Total Daily Energy Expenditure
  };
}

interface OrganHealthMetrics {
  organ: string;
  health_score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  biomarkers: { name: string; value: number; unit: string; status: 'normal' | 'elevated' | 'low' }[];
  issues: string[];
  recommendations: string[];
  risk_factors: string[];
  last_assessment: string;
}

interface SleepArchitecture {
  duration_hours: number;
  quality_score: number;
  sleep_stages: {
    deep_sleep_minutes: number;
    light_sleep_minutes: number;
    rem_sleep_minutes: number;
    awake_minutes: number;
  };
  sleep_efficiency: number;
  recovery_score: number;
  sleep_debt: number;
  circadian_rhythm_score: number;
}

interface DigitalTwinV2Props {
  athleteId: string;
  athlete?: any;
  biometricData?: any;
  medicalMode?: boolean;
  realTimeUpdates?: boolean;
}

// Professional Anatomical 3D Model Component
const AnatomicalModel3D: React.FC<{
  biometricData: MedicalBiometricData;
  organHealth: OrganHealthMetrics[];
  onOrganClick: (organ: string) => void;
}> = ({ biometricData, organHealth, onOrganClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('Creating professional anatomical model...');

    // Create medical scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f23);
    scene.fog = new THREE.Fog(0x0f0f23, 20, 100);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 6, 20);

    // Create professional renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: "highp"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f0f23, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Load GLB Model instead of creating custom geometry
    const loader = new GLTFLoader();
    const anatomicalGroup = new THREE.Group();

    // Load the GLB model
    console.log('Attempting to load GLB model from: /models/FinalBaseMesh.glb');
    loader.load(
      '/models/FinalBaseMesh.glb',
      (gltf) => {
        console.log('GLB model loaded successfully');

        // Add the loaded model to the scene
        const model = gltf.scene;
        model.scale.setScalar(1.5); // Reduced scale for better visibility
        model.position.set(0, -2, 0); // Lower position to center better

        // Enable shadows for the model
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Add medical-style materials to meshes
            if (child.material) {
              child.material = new THREE.MeshPhysicalMaterial({
                color: child.material.color || 0x2d3748,
                transparent: true,
                opacity: 0.9,
                roughness: 0.3,
                metalness: 0.1,
                clearcoat: 0.5,
                clearcoatRoughness: 0.1
              });
            }
          }
        });

        // Add organ interaction data to specific parts of the model
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Try to identify organs by name first, then by position
            const meshName = child.name.toLowerCase();
            const position = child.position;

            // Check for organ names in mesh names
           
          }
        });

        anatomicalGroup.add(model);
        scene.add(anatomicalGroup);

        console.log('GLB model added to scene successfully');
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading GLB model:', error);

        // Fallback to basic geometry if GLB fails to load
        console.log('Creating fallback geometry...');

        // Main Body Structure - Realistic proportions
        const torsoGeometry = new THREE.CapsuleGeometry(1.0, 2.0, 8, 16);
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x2d3748,
          transparent: true,
          opacity: 0.9,
          roughness: 0.3,
          metalness: 0.1,
          clearcoat: 0.5,
          clearcoatRoughness: 0.1
        });
        const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
        torso.position.set(0, 0, 0);
        torso.castShadow = true;
        torso.receiveShadow = true;
        torso.userData = { organ: 'Musculoskeletal', clickable: true };
        anatomicalGroup.add(torso);

        // Add basic head as fallback
        const headGeometry = new THREE.SphereGeometry(0.75, 20, 20);
        const headMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xf7fafc,
          transparent: true,
          opacity: 0.95,
          roughness: 0.8,
          metalness: 0.0
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 2.8, 0);
        head.castShadow = true;
        head.userData = { organ: 'Brain', clickable: true };
        anatomicalGroup.add(head);

        scene.add(anatomicalGroup);
      }
    );

    // Professional Medical Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4338ca, 0.4);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x22c55e, 0.2);
    rimLight.position.set(0, 0, -5);
    scene.add(rimLight);

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Raycast against all objects in the anatomical group (including GLB model children)
      const objectsToCheck: THREE.Object3D[] = [];
      anatomicalGroup.traverse((child) => {
        objectsToCheck.push(child);
      });

      const intersects = raycaster.intersectObjects(objectsToCheck, true);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData && clickedObject.userData.clickable) {
          onOrganClick(clickedObject.userData.organ);
        }
      }
    };


    renderer.domElement.addEventListener('click', onMouseClick);

    // Manual zoom controls
    const onMouseWheel = (event: WheelEvent) => {
      event.preventDefault();

      const zoomSpeed = 0.5;
      const minDistance = 8;
      const maxDistance = 35;

      const newZ = camera.position.z + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed);

      // Clamp zoom between min and max distances
      camera.position.z = Math.max(minDistance, Math.min(maxDistance, newZ));
    };

    renderer.domElement.addEventListener('wheel', onMouseWheel);

    // Professional animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Smooth rotation
      anatomicalGroup.rotation.y += 0.001;

      // Add subtle animation effects to the GLB model
      if (anatomicalGroup.children.length > 0) {
        const model = anatomicalGroup.children[0];

        // Find and animate heart-like element
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData.organ === 'Heart') {
            const heartPulse = 1 + Math.sin(Date.now() * 0.002) * 0.08;
            child.scale.setScalar(heartPulse);
          }
        });

        // Add subtle breathing effect to the entire model
        const breatheScale = 1 + Math.sin(Date.now() * 0.001) * 0.02;
        model.scale.set(breatheScale, 1, breatheScale);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Force initial render
    renderer.render(scene, camera);

    console.log('Professional anatomical model created successfully');

    // Cleanup
    return () => {
      console.log('Cleaning up anatomical model');
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.domElement.removeEventListener('click', onMouseClick);
      renderer.domElement.removeEventListener('wheel', onMouseWheel);
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [biometricData, organHealth, onOrganClick]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[750px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg relative"
      style={{ position: 'relative' }}
    >
      {/* Zoom Instructions */}
      <motion.div
        initial={{ opacity: 1, y: 10 }}
        animate={{ opacity: 0, y: -10 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-md rounded-lg px-4 py-2 border border-cyan-400/40 pointer-events-none"
      >
        <div className="text-cyan-300 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          Use mouse wheel to zoom in/out
        </div>
      </motion.div>
    </div>
  );
};

const DigitalTwinV2: React.FC<DigitalTwinV2Props> = ({
  athleteId,
  medicalMode = true,
  realTimeUpdates = true
}) => {
  // Enhanced state management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<AthleteType | undefined>(undefined);
  const [biometricHistory, setBiometricHistory] = useState<BiometricDataType[]>([]);
  const [geneticProfile, setGeneticProfile] = useState<GeneticProfile[]>([]);
  const [bodyComposition, setBodyComposition] = useState<BodyComposition[]>([]);

  // Medical-specific state
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'diagnostic'>('overview');
  const [realTimeData, setRealTimeData] = useState<boolean>(realTimeUpdates);
  const [alerts, setAlerts] = useState<{ id: string; type: 'critical' | 'warning' | 'info'; message: string; timestamp: string }[]>([]);
  const [scanMode, setScanMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Fetch comprehensive athlete data
  useEffect(() => {
    const fetchMedicalData = async () => {
      try {
        setLoading(true);
        setError(null);

        const numericAthleteId = typeof athleteId === 'string' ? parseInt(athleteId, 10) : athleteId;
        const athleteData = await dataService.getAthleteData(numericAthleteId);

        setAthlete(athleteData.athlete);
        setBiometricHistory(athleteData.biometricData);
        setGeneticProfile(athleteData.geneticProfile);
        setBodyComposition(athleteData.bodyComposition);

        // Simulate real-time alerts for medical scenarios
        if (medicalMode) {
          generateMedicalAlerts(athleteData);
        }

      } catch (err) {
        console.error('Failed to fetch medical data:', err);
        setError('Failed to load comprehensive medical data');
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchMedicalData();
    }
  }, [athleteId, medicalMode]);

  // Generate medical alerts based on data
  const generateMedicalAlerts = (data: any) => {
    const newAlerts = [];

    if (data.biometricData?.length > 0) {
      const latest = data.biometricData[data.biometricData.length - 1];

      if (latest.resting_hr > 80) {
        newAlerts.push({
          id: 'hr-alert',
          type: 'warning' as const,
          message: `Elevated resting heart rate detected: ${latest.resting_hr} BPM`,
          timestamp: new Date().toISOString()
        });
      }

      if (latest.spo2_night < 95) {
        newAlerts.push({
          id: 'oxygen-alert',
          type: 'critical' as const,
          message: `Low oxygen saturation: ${latest.spo2_night}%`,
          timestamp: new Date().toISOString()
        });
      }

      if (latest.hrv_night < 30) {
        newAlerts.push({
          id: 'hrv-alert',
          type: 'warning' as const,
          message: `Low HRV indicates elevated stress: ${latest.hrv_night}ms`,
          timestamp: new Date().toISOString()
        });
      }
    }

    setAlerts(newAlerts);
  };

  // Enhanced data processing with medical-grade calculations
  const processedData = useMemo(() => {
    const latestBiometric = biometricHistory.length > 0
      ? biometricHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;

    // Debug: Check what BP data we're getting from the API
    console.log('=== BLOOD PRESSURE DEBUG ===');
    console.log('Raw latestBiometric:', latestBiometric);
    console.log('BP Systolic from API:', latestBiometric?.blood_pressure_systolic);
    console.log('BP Diastolic from API:', latestBiometric?.blood_pressure_diastolic);
    console.log('Available BP fields in latestBiometric:', Object.keys(latestBiometric || {}));

    const biometricData: MedicalBiometricData = {
      heart_rate: Math.round(latestBiometric?.resting_hr || 68),
      hrv: Math.round(latestBiometric?.hrv_night || 45),
      blood_pressure_systolic: Math.round(latestBiometric?.blood_pressure_systolic || 0),
      blood_pressure_diastolic: Math.round(latestBiometric?.blood_pressure_diastolic || 0),
      temperature: Number((latestBiometric?.temp_trend_c || 36.6).toFixed(1)),
      oxygen_saturation: Math.round(latestBiometric?.spo2_night || 98),
      respiratory_rate: Math.round(latestBiometric?.resp_rate_night || 16),
      stress_level: latestBiometric?.training_load_pct ? Math.min(100, Math.round(latestBiometric.training_load_pct)) : 23,
      blood_glucose: 95, // Simulated
      cortisol_level: 12.5, // Simulated
      inflammation_markers: 2.1, // Simulated
      recovery_score: latestBiometric?.hrv_night ? Math.min(100, Math.round((latestBiometric.hrv_night / 100) * 100)) : 88,
      timestamp: new Date().toISOString()
    };

    console.log('Final BP values being used:', {
      systolic: biometricData.blood_pressure_systolic,
      diastolic: biometricData.blood_pressure_diastolic,
      systolic_raw: latestBiometric?.blood_pressure_systolic,
      diastolic_raw: latestBiometric?.blood_pressure_diastolic
    });

    const geneticsData: AdvancedGeneticProfile = {
      dna_health_score: 87,
      genetic_markers: {
        cardiovascular_risk: 'low',
        metabolic_efficiency: 'excellent',
        recovery_rate: 'fast',
        injury_predisposition: 'low',
        endurance_capacity: 'high',
        strength_potential: 'high'
      },
      nutrigenomics: {
        vitamin_d_metabolism: 'Efficient',
        caffeine_metabolism: 'Fast',
        carbohydrate_response: 'Balanced',
        protein_utilization: 'Excellent',
        fat_metabolism: 'Efficient'
      },
      pharmacogenomics: {
        pain_medication_response: 'Normal',
        anti_inflammatory_response: 'Rapid',
        cardiovascular_medication: 'Responsive'
      },
      disease_risk_factors: {
        diabetes_risk: 15,
        cardiovascular_disease_risk: 8,
        osteoporosis_risk: 12,
        cancer_predisposition: 5
      }
    };

    const bodyCompData: ComprehensiveBodyComposition = {
      skeletal_muscle_mass: 35.2,
      body_fat_percentage: 12.8,
      visceral_fat_level: 3,
      bone_density_score: 1.2,
      hydration_level: 78,
      segmental_analysis: {
        left_arm: { muscle: 8.5, fat: 12.2 },
        right_arm: { muscle: 8.7, fat: 11.8 },
        left_leg: { muscle: 12.1, fat: 14.5 },
        right_leg: { muscle: 12.3, fat: 14.2 },
        trunk: { muscle: 28.6, fat: 18.3 }
      },
      metabolic_rate: {
        bmr: 1850,
        tdee: 2850
      }
    };

    const sleepArch: SleepArchitecture = {
      duration_hours: latestBiometric?.sleep_duration_h || 7.8,
      quality_score: 85,
      sleep_stages: {
        deep_sleep_minutes: Math.round((latestBiometric?.deep_sleep_pct || 0) * (latestBiometric?.sleep_duration_h || 7.8) * 60 / 100),
        light_sleep_minutes: Math.round((latestBiometric?.light_sleep_pct || 0) * (latestBiometric?.sleep_duration_h || 7.8) * 60 / 100),
        rem_sleep_minutes: Math.round((latestBiometric?.rem_sleep_pct || 0) * (latestBiometric?.sleep_duration_h || 7.8) * 60 / 100),
        awake_minutes: Math.round((latestBiometric?.light_sleep_pct || 0) * (latestBiometric?.sleep_duration_h || 7.8) * 60 / 100)
      },
      sleep_efficiency: 92,
      recovery_score: latestBiometric?.hrv_night ? Math.round((latestBiometric.hrv_night / 100) * 100) : 88,
      sleep_debt: 0.5,
      circadian_rhythm_score: 87
    };

    const organHealth: OrganHealthMetrics[] = [
      {
        organ: 'Heart',
        health_score: latestBiometric?.resting_hr && latestBiometric.resting_hr < 70 ? 92 : latestBiometric?.resting_hr && latestBiometric.resting_hr < 80 ? 85 : 78,
        status: latestBiometric?.resting_hr && latestBiometric.resting_hr < 70 ? 'excellent' : latestBiometric?.resting_hr && latestBiometric.resting_hr < 80 ? 'good' : 'fair',
        biomarkers: [
          { name: 'Troponin', value: 0.02, unit: 'ng/mL', status: 'normal' },
          { name: 'BNP', value: 45, unit: 'pg/mL', status: 'normal' },
          { name: 'CRP', value: 1.2, unit: 'mg/L', status: 'normal' }
        ],
        issues: latestBiometric?.resting_hr && latestBiometric.resting_hr > 80 ? ['Elevated resting heart rate'] : [],
        recommendations: latestBiometric?.resting_hr && latestBiometric.resting_hr < 70 ? ['Maintain current activity level'] : ['Consider cardio training'],
        risk_factors: ['Family history of CVD', 'High-intensity training'],
        last_assessment: new Date().toISOString()
      },
      {
        organ: 'Lungs',
        health_score: latestBiometric?.spo2_night && latestBiometric.spo2_night > 95 ? 88 : 82,
        status: latestBiometric?.spo2_night && latestBiometric.spo2_night > 95 ? 'good' : 'fair',
        biomarkers: [
          { name: 'SpO2', value: latestBiometric?.spo2_night || 98, unit: '%', status: 'normal' },
          { name: 'FEV1', value: 4.2, unit: 'L', status: 'normal' },
          { name: 'FVC', value: 5.1, unit: 'L', status: 'normal' }
        ],
        issues: latestBiometric?.spo2_night && latestBiometric.spo2_night <= 95 ? ['Low oxygen saturation'] : [],
        recommendations: ['Continue cardio training'],
        risk_factors: ['Exercise-induced asthma', 'Environmental allergens'],
        last_assessment: new Date().toISOString()
      },
      {
        organ: 'Brain',
        health_score: latestBiometric?.hrv_night && latestBiometric.hrv_night > 40 ? 85 : 78,
        status: latestBiometric?.hrv_night && latestBiometric.hrv_night > 40 ? 'good' : 'fair',
        biomarkers: [
          { name: 'BDNF', value: 12.5, unit: 'ng/mL', status: 'normal' },
          { name: 'Tau Protein', value: 180, unit: 'pg/mL', status: 'normal' },
          { name: 'Amyloid-β', value: 850, unit: 'pg/mL', status: 'normal' }
        ],
        issues: latestBiometric?.hrv_night && latestBiometric.hrv_night <= 40 ? ['Low HRV indicates stress'] : [],
        recommendations: ['Regular cognitive exercises'],
        risk_factors: ['Concussion history', 'Sleep deprivation'],
        last_assessment: new Date().toISOString()
      },
      {
        organ: 'Liver',
        health_score: 90,
        status: 'excellent',
        biomarkers: [
          { name: 'ALT', value: 28, unit: 'U/L', status: 'normal' },
          { name: 'AST', value: 32, unit: 'U/L', status: 'normal' },
          { name: 'Bilirubin', value: 0.8, unit: 'mg/dL', status: 'normal' }
        ],
        issues: [],
        recommendations: ['Maintain healthy diet'],
        risk_factors: ['Previous supplement use'],
        last_assessment: new Date().toISOString()
      },
      {
        organ: 'Kidneys',
        health_score: 87,
        status: 'good',
        biomarkers: [
          { name: 'Creatinine', value: 0.9, unit: 'mg/dL', status: 'normal' },
          { name: 'BUN', value: 18, unit: 'mg/dL', status: 'normal' },
          { name: 'GFR', value: 95, unit: 'mL/min', status: 'normal' }
        ],
        issues: [],
        recommendations: ['Stay hydrated'],
        risk_factors: ['Dehydration risk'],
        last_assessment: new Date().toISOString()
      },
      {
        organ: 'Musculoskeletal',
        health_score: bodyComposition.length > 0 ? 83 : 80,
        status: 'good',
        biomarkers: [
          { name: 'CK', value: 145, unit: 'U/L', status: 'normal' },
          { name: 'Myoglobin', value: 35, unit: 'ng/mL', status: 'normal' },
          { name: 'Vitamin D', value: 42, unit: 'ng/mL', status: 'normal' }
        ],
        issues: [],
        recommendations: ['Continue posture exercises'],
        risk_factors: ['High-impact training'],
        last_assessment: new Date().toISOString()
      }
    ];

    return {
      biometricData,
      geneticsData,
      bodyCompData,
      sleepArch,
      organHealth
    };
  }, [biometricHistory, geneticProfile, bodyComposition]);

  // Medical utility functions
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-400 border-emerald-400';
      case 'good': return 'text-blue-400 border-blue-400';
      case 'fair': return 'text-yellow-400 border-yellow-400';
      case 'poor': return 'text-orange-400 border-orange-400';
      case 'critical': return 'text-red-400 border-red-400 critical-alert';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  // Loading state with medical theme
  if (loading) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center relative overflow-hidden">
        <style>{medicalStyles}</style>
        <div className="scan-line absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent"></div>
        <div className="text-center z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-cyan-400/30 border-t-cyan-400 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 animate-pulse"></div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Medical Analysis in Progress</h3>
          <p className="text-gray-300 text-lg">Scanning biometric data, genetic profile, and body composition...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error || !athlete) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 glass-morphism rounded-2xl">
          <div className="text-red-400 text-6xl mb-6">
            <Stethoscope className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Medical Data Unavailable</h3>
          <p className="text-gray-300 mb-6">{error || 'Athlete medical profile not found'}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 hologram-glow"
            >
              Retry Medical Scan
            </button>
            <button
              onClick={() => setViewMode('diagnostic')}
              className="w-full px-6 py-3 bg-slate-700/50 text-gray-300 rounded-lg hover:bg-slate-600/50 transition-colors"
            >
              Enter Diagnostic Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen medical-gradient p-4 relative overflow-hidden">
      <style>{medicalStyles}</style>

      {/* Neural Network Background */}
      <div className="neural-network absolute inset-0 opacity-30"></div>

      {/* Scan Lines Effect */}
      {scanMode && (
        <div className="scan-line absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none"></div>
      )}

      <div className="max-w-8xl mx-auto relative z-10">
        {/* Enhanced Medical Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-bold text-white mb-3 flex items-center gap-4">
                <div className="relative">
                  <Atom className="w-12 h-12 text-cyan-400 medical-pulse" />
                  <div className="absolute inset-0 w-12 h-12 border-2 border-cyan-400/30 rounded-full animate-ping"></div>
                </div>
                <div>
                  Medical Digital Twin
                  <span className="block text-2xl text-cyan-400 font-normal">Advanced Diagnostics</span>
                </div>
              </h1>
              <p className="text-xl text-gray-300">
                Comprehensive Health Analytics for {athlete.name}
              </p>
            </div>

            {/* Medical Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setRealTimeData(!realTimeData)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  realTimeData
                    ? 'bg-green-600/20 text-green-400 border border-green-400/50 hologram-glow'
                    : 'bg-slate-700/50 text-gray-400 border border-slate-600/50'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Real-time
              </button>

              <button
                onClick={() => setScanMode(!scanMode)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  scanMode
                    ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-400/50 hologram-glow'
                    : 'bg-slate-700/50 text-gray-400 border border-slate-600/50'
                }`}
              >
                <Scan className="w-4 h-4 inline mr-2" />
                Scan Mode
              </button>

              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  audioEnabled
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-400/50 hologram-glow'
                    : 'bg-slate-700/50 text-gray-400 border border-slate-600/50'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
              >
                <option value="overview">Overview</option>
                <option value="detailed">Detailed Analysis</option>
                <option value="diagnostic">Diagnostic Mode</option>
              </select>
            </div>
          </div>

          {/* Medical Alerts Bar */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-red-400/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Medical Alerts</h3>
              </div>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    alert.type === 'critical' ? 'bg-red-900/20 border-red-400/50' :
                    alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-400/50' :
                    'bg-blue-900/20 border-blue-400/50'
                  }`}>
                    {getAlertIcon(alert.type)}
                    <span className="text-gray-200 flex-1">{alert.message}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {viewMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 xl:grid-cols-4 gap-6"
            >
              {/* Primary Biometrics Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="xl:col-span-1 space-y-6"
              >
                {/* Critical Vital Signs */}
                <div className="glass-morphism rounded-xl p-6 hologram-glow">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400 medical-pulse" />
                    Critical Vitals
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <Heart className="w-8 h-8 text-red-400 mx-auto mb-2 medical-pulse" />
                      <div className="text-2xl font-bold text-white">{processedData.biometricData.heart_rate}</div>
                      <div className="text-xs text-gray-400">BPM</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <Gauge className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {processedData.biometricData.blood_pressure_systolic}/{processedData.biometricData.blood_pressure_diastolic}
                      </div>
                      <div className="text-xs text-gray-400">BP</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <Thermometer className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{processedData.biometricData.temperature}°</div>
                      <div className="text-xs text-gray-400">Temp</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <Droplets className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{processedData.biometricData.oxygen_saturation}%</div>
                      <div className="text-xs text-gray-400">SpO2</div>
                    </div>
                  </div>
                </div>

                {/* Genetic Health Score */}
                <div className="glass-morphism rounded-xl p-6 hologram-glow">
                  <div className="flex items-center gap-3 mb-4">
                    <Dna className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-xl font-semibold text-white">DNA Health Score</h3>
                  </div>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-3 ${getScoreColor(processedData.geneticsData.dna_health_score)}`}>
                      {processedData.geneticsData.dna_health_score}%
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-4 mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${processedData.geneticsData.dna_health_score}%` }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 h-4 rounded-full"
                      />
                    </div>
                    <p className="text-gray-300 text-sm mb-4">Overall Genetic Health Rating</p>

                    {/* Disease Risk Factors */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Diabetes Risk</span>
                        <span className="text-emerald-400">{processedData.geneticsData.disease_risk_factors.diabetes_risk}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">CVD Risk</span>
                        <span className="text-emerald-400">{processedData.geneticsData.disease_risk_factors.cardiovascular_disease_risk}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Composition Overview */}
                <div className="glass-morphism rounded-xl p-6 hologram-glow">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-green-400" />
                    Body Composition
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Muscle Mass</span>
                      <span className="text-white font-semibold">{processedData.bodyCompData.skeletal_muscle_mass}kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Body Fat</span>
                      <span className="text-white font-semibold">{processedData.bodyCompData.body_fat_percentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Hydration</span>
                      <span className="text-white font-semibold">{processedData.bodyCompData.hydration_level}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">BMR</span>
                      <span className="text-white font-semibold">{processedData.bodyCompData.metabolic_rate.bmr}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Professional 3D Human Model */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="xl:col-span-3"
              >
                <div className="glass-morphism rounded-xl p-4 min-h-[700px] relative overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-800/50">
                  {/* Professional 3D Human Body */}
                  <AnatomicalModel3D
                    biometricData={processedData.biometricData}
                    organHealth={processedData.organHealth}
                    onOrganClick={setSelectedOrgan}
                  />

                  {/* 3D Model Controls Overlay */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button
                      onClick={() => setRealTimeData(!realTimeData)}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        realTimeData
                          ? 'bg-green-600/20 text-green-400 border border-green-400/50 hologram-glow'
                          : 'bg-slate-700/50 text-gray-400 border border-slate-600/50'
                      }`}
                      title={realTimeData ? 'Stop Auto Rotation' : 'Start Auto Rotation'}
                    >
                      {realTimeData ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => setScanMode(!scanMode)}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        scanMode
                          ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-400/50 hologram-glow'
                          : 'bg-slate-700/50 text-gray-400 border border-slate-600/50'
                      }`}
                      title="Toggle Scan Mode"
                    >
                      <Scan className="w-4 h-4" />
                    </button>
                  </div>


                  {/* Professional Medical Grid Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-10">
                    <svg width="100%" height="100%" className="w-full h-full">
                      <defs>
                        <pattern id="medicalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ffff" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#medicalGrid)" />
                    </svg>
                  </div>

                  {/* Biometric Data Overlays */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 }}
                    className="absolute top-4 left-4 space-y-2"
                  >
                    {/* Heart Rate */}
                    <div className="bg-slate-800/90 backdrop-blur-md rounded-lg px-3 py-2 border border-red-400/40 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-400 medical-pulse" />
                        <div>
                          <div className="text-white font-semibold">{processedData.biometricData.heart_rate}</div>
                          <div className="text-xs text-gray-400">BPM</div>
                        </div>
                      </div>
                    </div>

                    {/* Oxygen Saturation */}
                    <div className="bg-slate-800/90 backdrop-blur-md rounded-lg px-3 py-2 border border-cyan-400/40 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-white font-semibold">{processedData.biometricData.oxygen_saturation}%</div>
                          <div className="text-xs text-gray-400">SpO2</div>
                        </div>
                      </div>
                    </div>

                    {/* HRV */}
                    <div className="bg-slate-800/90 backdrop-blur-md rounded-lg px-3 py-2 border border-purple-400/40 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="text-white font-semibold">{processedData.biometricData.hrv}</div>
                          <div className="text-xs text-gray-400">HRV</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Body Composition Overlays */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8 }}
                    className="absolute top-4 right-4 space-y-2"
                  >
                    {/* Muscle Mass */}
                    <div className="bg-slate-800/90 backdrop-blur-md rounded-lg px-3 py-2 border border-green-400/40 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-white font-semibold">{processedData.bodyCompData.skeletal_muscle_mass}kg</div>
                          <div className="text-xs text-gray-400">Muscle Mass</div>
                        </div>
                      </div>
                    </div>

                    {/* Body Fat */}
                    <div className="bg-slate-800/90 backdrop-blur-md rounded-lg px-3 py-2 border border-yellow-400/40 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-yellow-400" />
                        <div>
                          <div className="text-white font-semibold">{processedData.bodyCompData.body_fat_percentage}%</div>
                          <div className="text-xs text-gray-400">Body Fat</div>
                        </div>
                      </div>
                    </div>

                    {/* BMR */}
                    <div className="bg-slate-800/90 backdrop-blur-md rounded-lg px-3 py-2 border border-orange-400/40 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <div>
                          <div className="text-white font-semibold">{processedData.bodyCompData.metabolic_rate.bmr}</div>
                          <div className="text-xs text-gray-400">BMR (cal)</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Real-time Status Indicators */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2 }}
                    className="absolute bottom-4 right-4"
                  >
                    <div className="bg-slate-800/90 backdrop-blur-md rounded-lg px-4 py-3 border border-green-400/40">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div>
                          <div className="text-green-400 font-semibold text-sm">Real-time Monitoring</div>
                          <div className="text-gray-300 text-xs">Medical Digital Twin Active</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>


                </div>
              </motion.div>
            </motion.div>
          )}

          {viewMode === 'detailed' && (
            <motion.div
              key="detailed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Detailed Organ Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {processedData.organHealth.map((organ, index) => (
                  <motion.div
                    key={organ.organ}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`glass-morphism rounded-xl p-6 border-2 ${getHealthStatusColor(organ.status)} cursor-pointer hover:scale-105 transition-all duration-300`}
                    onClick={() => setSelectedOrgan(organ.organ)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{organ.organ}</h3>
                      <div className={`text-2xl font-bold ${getScoreColor(organ.health_score)}`}>
                        {organ.health_score}%
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Status</span>
                        <span className={`font-semibold capitalize ${getScoreColor(organ.health_score)}`}>
                          {organ.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-300">Key Biomarkers</h4>
                        {organ.biomarkers.slice(0, 2).map((biomarker, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-400">{biomarker.name}</span>
                            <span className={`font-medium ${
                              biomarker.status === 'normal' ? 'text-green-400' :
                              biomarker.status === 'elevated' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {biomarker.value} {biomarker.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {organ.issues.length > 0 && (
                        <div className="mt-3 p-2 bg-red-900/20 rounded-lg border border-red-400/30">
                          <div className="text-xs text-red-400 font-semibold">Issues Detected</div>
                          <div className="text-xs text-gray-300 mt-1">{organ.issues[0]}</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {viewMode === 'diagnostic' && (
            <motion.div
              key="diagnostic"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              {/* Advanced Diagnostic Panel */}
              <div className="glass-morphism rounded-xl p-8">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <Microscope className="w-8 h-8 text-cyan-400" />
                  Advanced Medical Diagnostics
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Genetic Analysis */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Dna className="w-6 h-6 text-cyan-400" />
                      Comprehensive Genetic Profile
                    </h3>

                    <div className="space-y-4">
                      {Object.entries(processedData.geneticsData.genetic_markers).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                          <span className="text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                          <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                            (value === 'excellent' || value === 'fast')
                              ? 'bg-emerald-900/50 text-emerald-400'
                              : (value === 'normal' || value === 'medium' || value === 'average')
                              ? 'bg-blue-900/50 text-blue-400'
                              : (value === 'poor' || value === 'slow')
                              ? 'bg-yellow-900/50 text-yellow-400'
                              : 'bg-emerald-900/50 text-emerald-400'
                          }`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pharmacogenomics */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-purple-400" />
                        Pharmacogenomics
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(processedData.geneticsData.pharmacogenomics).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-cyan-400 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Body Composition Analysis */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Ruler className="w-6 h-6 text-green-400" />
                      Advanced Body Composition
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <Weight className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{processedData.bodyCompData.skeletal_muscle_mass}</div>
                        <div className="text-sm text-gray-400">Muscle Mass (kg)</div>
                      </div>
                      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <Percent className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{processedData.bodyCompData.body_fat_percentage}</div>
                        <div className="text-sm text-gray-400">Body Fat (%)</div>
                      </div>
                      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <Droplets className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{processedData.bodyCompData.hydration_level}</div>
                        <div className="text-sm text-gray-400">Hydration (%)</div>
                      </div>
                      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <Zap className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{processedData.bodyCompData.metabolic_rate.bmr}</div>
                        <div className="text-sm text-gray-400">BMR (cal)</div>
                      </div>
                    </div>

                    {/* Segmental Analysis */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-white mb-3">Segmental Analysis</h4>
                      <div className="space-y-2">
                        {Object.entries(processedData.bodyCompData.segmental_analysis).map(([segment, data]) => (
                          <div key={segment} className="flex justify-between items-center text-sm p-2 bg-slate-800/30 rounded">
                            <span className="text-gray-400 capitalize">{segment.replace('_', ' ')}</span>
                            <div className="flex gap-4">
                              <span className="text-green-400">M: {data.muscle}kg</span>
                              <span className="text-yellow-400">F: {data.fat}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Organ Detail Modal */}
        {selectedOrgan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedOrgan(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-morphism rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const organ = processedData.organHealth.find(o => o.organ === selectedOrgan);
                if (!organ) return null;

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-white">{organ.organ} Analysis</h2>
                      <button
                        onClick={() => setSelectedOrgan(null)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-3">Health Metrics</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Health Score</span>
                            <span className={`font-bold ${getScoreColor(organ.health_score)}`}>
                              {organ.health_score}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Status</span>
                            <span className={`font-semibold capitalize ${getScoreColor(organ.health_score)}`}>
                              {organ.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Last Assessment</span>
                            <span className="text-gray-400 text-sm">
                              {new Date(organ.last_assessment).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-white mb-3">Biomarkers</h3>
                        <div className="space-y-2">
                          {organ.biomarkers.map((biomarker, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                              <span className="text-gray-300">{biomarker.name}</span>
                              <span className={`font-medium ${
                                biomarker.status === 'normal' ? 'text-green-400' :
                                biomarker.status === 'elevated' ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {biomarker.value} {biomarker.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {organ.issues.length > 0 && (
                      <div className="p-4 bg-red-900/20 rounded-lg border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Issues Detected</h3>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                          {organ.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-400/30">
                      <h3 className="text-lg font-semibold text-blue-400 mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {organ.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>

                    {organ.risk_factors.length > 0 && (
                      <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-2">Risk Factors</h3>
                        <div className="flex flex-wrap gap-2">
                          {organ.risk_factors.map((risk, idx) => (
                            <span key={idx} className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-sm">
                              {risk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DigitalTwinV2;