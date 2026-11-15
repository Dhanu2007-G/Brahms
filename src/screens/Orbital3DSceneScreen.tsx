/**
 * AstraPulse — Interactive 3D Orbital Habitat & EVA Bio-Telemetry Scene (/3d)
 * Built with Three.js (Composite multi-part PBR groups, RoomEnvironment IBL, ACESFilmicToneMapping, InstancedMesh starfield, Raycasting & Camera Presets)
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import {
  Box,
  Camera,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { StatusChip } from '../components/StatusChip';
import { useMission } from '../context/MissionContext';

type CameraPreset = 'overview' | 'centrifuge' | 'eva_twin' | 'comms_solar';

interface SubSystemReadout {
  id: string;
  title: string;
  category: string;
  telemetry: string;
  description: string;
}

const SUBSYSTEM_READOUTS: Record<string, SubSystemReadout> = {
  core_hull: {
    id: 'core_hull',
    title: 'ARES-01 Pressurized Command & Medical Bay',
    category: 'Primary Habitat Hull',
    telemetry: '101.3 kPa • 21.0% O₂ • 3.1 mmHg CO₂',
    description:
      'Multi-layer Micrometeoroid & Orbital Debris (MMOD) Whipple shield + polyethylene storm shelter housing the Crew Core medical station.',
  },
  centrifuge_ring: {
    id: 'centrifuge_ring',
    title: 'Short-Radius Artificial Gravity Centrifuge Ring',
    category: 'Gravity Countermeasure',
    telemetry: '4.2 RPM • 0.38g Rim Equivalent',
    description:
      'Mitigates cephalad fluid shift, neuro-ocular syndrome (SANS), and trabecular bone loss during 180-day deep-space transit.',
  },
  solar_arrays: {
    id: 'solar_arrays',
    title: 'Roll-Out Solar Array (ROSA) Photovoltaic Wings',
    category: 'Power & Thermal',
    telemetry: '142.8 kW Output • 98.4% Bus Efficiency',
    description:
      'Dual articulated solar wings powering ECLSS life support, solid-state circadian lighting, and Hall-effect ion thrusters.',
  },
  eva_astronaut: {
    id: 'eva_astronaut',
    title: 'Extravehicular Mobility Unit (xEMU) Digital Twin',
    category: 'Crew Bio-Telemetry',
    telemetry: 'PLSS Nominal • Suit ΔP 29.6 kPa',
    description:
      'Composite 9-part articulated EVA astronaut twin with live biometric status beacon linked to the active crew member.',
  },
  comms_dish: {
    id: 'comms_dish',
    title: 'Deep-Space Optical & Ka-Band High-Gain Dish',
    category: 'Store-and-Forward Link',
    telemetry: 'OWLT Delay Tracked • 128 Mbps Downlink',
    description:
      'Transmits store-and-forward medical telemetry bundles and encrypted journal grants to NASA Flight Surgeons on Earth.',
  },
  thruster_module: {
    id: 'thruster_module',
    title: 'Xenon Hall-Effect Propulsion & Radiation Shield Aft Bay',
    category: 'Propulsion & Shielding',
    telemetry: 'Isp 2,950s • Water-Wall Mass Shield Active',
    description:
      'High-efficiency deep-space propulsion surrounded by potable water storage tanks acting as secondary Galactic Cosmic Ray shielding.',
  },
};

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  overview: {
    pos: [11, 6.5, 13],
    target: [0, 0.2, 0],
    label: 'Orbital Overview',
  },
  centrifuge: {
    pos: [0.5, 3.2, 7.8],
    target: [0, 0.2, 0],
    label: 'Centrifuge Ring',
  },
  eva_twin: {
    pos: [6.4, 2.2, 5.2],
    target: [4.2, 1.1, 2.2],
    label: 'EVA Bio-Twin',
  },
  comms_solar: {
    pos: [-9.5, 4.8, 8.5],
    target: [-2.0, 0.5, 0],
    label: 'Solar & Ka-Band Dish',
  },
};

export const Orbital3DSceneScreen: React.FC = () => {
  const {
    activeCrew,
    overallTier,
    environmentMode,
    selectedMissionDay,
    evaluations,
    navigate,
  } = useMission();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPreset>('overview');
  const [centrifugeRpm, setCentrifugeRpm] = useState<number>(4.2);
  const [showShieldDome, setShowShieldDome] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [fullscreenCanvas, setFullscreenCanvas] = useState<boolean>(false);
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubSystemReadout>(
    SUBSYSTEM_READOUTS.core_hull
  );

  // Refs accessed inside requestAnimationFrame loop to avoid stale closures
  const presetRef = useRef<CameraPreset>('overview');
  const userDraggingRef = useRef<boolean>(false);
  const rpmRef = useRef<number>(4.2);
  const shieldRef = useRef<boolean>(false);
  const autoRotateRef = useRef<boolean>(true);
  const tierColorRef = useRef<number>(0x2dd4bf);

  useEffect(() => {
    presetRef.current = activePreset;
  }, [activePreset]);

  useEffect(() => {
    rpmRef.current = centrifugeRpm;
  }, [centrifugeRpm]);

  useEffect(() => {
    shieldRef.current = showShieldDome;
  }, [showShieldDome]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const colorHex =
      overallTier === 'review_required'
        ? 0xff5c93
        : overallTier === 'watch'
          ? 0xffb547
          : overallTier === 'nominal'
            ? 0x2dd4bf
            : 0x3de0ff;
    tierColorRef.current = colorHex;
  }, [overallTier]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 600;

    // 1. Renderer + Software WebGL detection per Three.js skill
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererInfo = dbg
      ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
      : '';
    const isSoftwareGl =
      /SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(
        String(rendererInfo)
      );

    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const syncPixel = new Uint8Array(4);
    const afterDraw = isSoftwareGl
      ? () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, syncPixel)
      : () => {};

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Scene, Fog & IBL Environment (RoomEnvironment + PMREMGenerator)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060c);
    scene.fog = new THREE.FogExp2(0x04060c, 0.014);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // 3. Camera & Damped OrbitControls
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    camera.position.set(11, 6.5, 13);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 35;
    controls.minDistance = 3.5;

    const onStartDrag = () => {
      userDraggingRef.current = true;
    };
    controls.addEventListener('start', onStartDrag);

    // 4. Studio Orbital Lighting (Warm Key + Cool Hemisphere Fill + Rim Accent)
    const keyLight = new THREE.DirectionalLight(0xfff2e0, 2.8);
    keyLight.position.set(14, 18, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 45;
    const d = 12;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xc8dcff, 0x1a1e2e, 0.65);
    scene.add(hemiLight);

    const rimLight = new THREE.PointLight(0x3de0ff, 3.5, 25, 1.8);
    rimLight.position.set(-8, -4, -7);
    scene.add(rimLight);

    // 5. PBR Material Palette (Varied roughness & metalness)
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xdce4f2,
      metalness: 0.55,
      roughness: 0.35,
    });
    const darkAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x1e2638,
      metalness: 0.82,
      roughness: 0.28,
    });
    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: 0xf5b041,
      metalness: 0.88,
      roughness: 0.22,
    });
    const solarCellMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c2448,
      metalness: 0.35,
      roughness: 0.16,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    const glassCupolaMat = new THREE.MeshPhysicalMaterial({
      color: 0x7ce8ff,
      metalness: 0.1,
      roughness: 0.08,
      transmission: 0.75,
      transparent: true,
      opacity: 0.85,
      ior: 1.48,
    });
    const thrusterGlowMat = new THREE.MeshStandardMaterial({
      color: 0x3de0ff,
      emissive: 0x3de0ff,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    const pickableObjects: THREE.Object3D[] = [];
    const tagSubsystem = (obj: THREE.Object3D, subsystemId: string) => {
      obj.userData.subsystemId = subsystemId;
      obj.traverse((child) => {
        child.userData.subsystemId = subsystemId;
      });
      pickableObjects.push(obj);
    };

    // 6. Composite Model 1: ARES-01 Deep-Space Habitat & Spacecraft (10+ parts)
    const stationGroup = new THREE.Group();
    scene.add(stationGroup);

    // Part A: Central pressurized cylindrical spine
    const coreHull = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 7.2, 32),
      hullMat
    );
    coreHull.rotation.z = Math.PI / 2;
    coreHull.castShadow = true;
    coreHull.receiveShadow = true;
    tagSubsystem(coreHull, 'core_hull');
    stationGroup.add(coreHull);

    // Part B: Forward docking node & observation cupola
    const forwardNode = new THREE.Mesh(
      new THREE.SphereGeometry(1.28, 32, 24),
      darkAlloyMat
    );
    forwardNode.position.set(3.8, 0, 0);
    tagSubsystem(forwardNode, 'core_hull');
    stationGroup.add(forwardNode);

    const cupolaDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      glassCupolaMat
    );
    cupolaDome.rotation.z = -Math.PI / 2;
    cupolaDome.position.set(4.65, 0, 0);
    tagSubsystem(cupolaDome, 'core_hull');
    stationGroup.add(cupolaDome);

    // Part C: Gold MLI thermal blanket bands along hull
    for (const xOffset of [-2.1, 0, 2.1]) {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(1.19, 1.19, 0.42, 32),
        goldFoilMat
      );
      band.rotation.z = Math.PI / 2;
      band.position.set(xOffset, 0, 0);
      tagSubsystem(band, 'core_hull');
      stationGroup.add(band);
    }

    // Part D: Rotating Artificial-Gravity Centrifuge Ring + 4 Radial Spokes + 4 Hab Pods
    const centrifugeGroup = new THREE.Group();
    centrifugeGroup.position.set(0, 0, 0);
    stationGroup.add(centrifugeGroup);

    const torusRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.65, 0.36, 20, 64),
      hullMat
    );
    torusRing.rotation.y = Math.PI / 2;
    torusRing.castShadow = true;
    centrifugeGroup.add(torusRing);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 3.5, 12),
        darkAlloyMat
      );
      spoke.position.set(
        0,
        Math.cos(angle) * 1.75,
        Math.sin(angle) * 1.75
      );
      spoke.rotation.x = angle;
      centrifugeGroup.add(spoke);

      // Crew sleep/exercise module pod on the centrifuge rim
      const pod = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.68, 0.68),
        goldFoilMat
      );
      pod.position.set(
        0,
        Math.cos(angle) * 3.65,
        Math.sin(angle) * 3.65
      );
      pod.rotation.x = angle;
      centrifugeGroup.add(pod);
    }
    tagSubsystem(centrifugeGroup, 'centrifuge_ring');

    // Part E: Twin Articulated Solar Array Wings (ROSA)
    const solarGroup = new THREE.Group();
    stationGroup.add(solarGroup);
    for (const zDir of [-1, 1]) {
      const boom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 6.2, 10),
        darkAlloyMat
      );
      boom.rotation.x = Math.PI / 2;
      boom.position.set(-1.6, 0, zDir * 3.8);
      solarGroup.add(boom);

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.05, 5.2),
        solarCellMat
      );
      panel.position.set(-1.6, 0, zDir * 4.2);
      panel.castShadow = true;
      solarGroup.add(panel);
    }
    tagSubsystem(solarGroup, 'solar_arrays');

    // Part F: High-Gain Deep-Space Ka-Band Parabolic Dish Antenna
    const dishGroup = new THREE.Group();
    dishGroup.position.set(2.2, 1.55, 0);
    const dishMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.9, 10),
      darkAlloyMat
    );
    dishGroup.add(dishMast);
    const dishBowl = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 0.4, 24, 1, true),
      hullMat
    );
    dishBowl.position.set(0, 0.55, 0);
    dishBowl.rotation.z = -0.45;
    dishGroup.add(dishBowl);
    tagSubsystem(dishGroup, 'comms_dish');
    stationGroup.add(dishGroup);

    // Part G: Aft Hall-Effect Ion Thruster Cluster & Water-Wall Shield Module
    const thrusterGroup = new THREE.Group();
    thrusterGroup.position.set(-4.0, 0, 0);
    const aftBell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 1.1, 1.1, 24),
      darkAlloyMat
    );
    aftBell.rotation.z = Math.PI / 2;
    thrusterGroup.add(aftBell);

    const ionPlume = new THREE.Mesh(
      new THREE.ConeGeometry(0.62, 1.6, 24),
      thrusterGlowMat
    );
    ionPlume.rotation.z = Math.PI / 2;
    ionPlume.position.set(-1.1, 0, 0);
    thrusterGroup.add(ionPlume);
    tagSubsystem(thrusterGroup, 'thruster_module');
    stationGroup.add(thrusterGroup);

    // Part H: Optional Radiation Magnetosphere / Water-Wall Shield Overlay Dome
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x3de0ff,
      transparent: true,
      opacity: 0.16,
      roughness: 0.15,
      metalness: 0.1,
      wireframe: true,
    });
    const shieldDome = new THREE.Mesh(
      new THREE.IcosahedronGeometry(6.8, 2),
      shieldMat
    );
    shieldDome.visible = false;
    stationGroup.add(shieldDome);

    // 7. Composite Model 2: Astronaut EVA Bio-Telemetry Digital Twin (9 parts)
    const evaGroup = new THREE.Group();
    evaGroup.position.set(4.2, 1.1, 2.2);
    evaGroup.rotation.y = -0.6;
    scene.add(evaGroup);

    const suitWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf4f7ff,
      roughness: 0.42,
      metalness: 0.18,
    });
    const visorGoldMat = new THREE.MeshStandardMaterial({
      color: 0xffc65c,
      roughness: 0.12,
      metalness: 0.92,
    });
    const beaconMat = new THREE.MeshStandardMaterial({
      color: tierColorRef.current,
      emissive: tierColorRef.current,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });

    // Torso (HUT)
    const evaTorso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.42, 12, 16),
      suitWhiteMat
    );
    evaGroup.add(evaTorso);

    // Helmet + Gold Visor
    const evaHelmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 16),
      suitWhiteMat
    );
    evaHelmet.position.set(0, 0.52, 0);
    evaGroup.add(evaHelmet);

    const evaVisor = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 20, 16),
      visorGoldMat
    );
    evaVisor.position.set(0, 0.52, 0.08);
    evaGroup.add(evaVisor);

    // PLSS Life-Support Backpack
    const evaBackpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.56, 0.26),
      hullMat
    );
    evaBackpack.position.set(0, 0.06, -0.26);
    evaGroup.add(evaBackpack);

    // Chest Biometric Status Core Beacon (pulses with crew member's tier)
    const chestBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 16),
      beaconMat
    );
    chestBeacon.position.set(0, 0.12, 0.27);
    evaGroup.add(chestBeacon);

    // Articulated Arms & Legs (4 limbs)
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.08, 0.34, 8, 12),
        suitWhiteMat
      );
      arm.position.set(side * 0.36, 0.08, 0.08);
      arm.rotation.z = side * 0.35;
      arm.rotation.x = -0.4;
      evaGroup.add(arm);

      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.095, 0.4, 8, 12),
        suitWhiteMat
      );
      leg.position.set(side * 0.15, -0.52, 0);
      leg.rotation.x = side * 0.15;
      evaGroup.add(leg);
    }

    // Tether line connecting EVA Astronaut to Forward Airlock
    const tetherCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(3.9, 0.2, 0.3),
      new THREE.Vector3(4.1, 0.8, 1.2),
      new THREE.Vector3(4.2, 1.1, 2.0),
    ]);
    const tetherGeo = new THREE.TubeGeometry(tetherCurve, 20, 0.018, 8, false);
    const tetherMesh = new THREE.Mesh(tetherGeo, goldFoilMat);
    scene.add(tetherMesh);

    tagSubsystem(evaGroup, 'eva_astronaut');

    // 8. InstancedMesh Orbital Starfield (320 stars in a single draw call)
    const starCount = 320;
    const starGeo = new THREE.OctahedronGeometry(0.08, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xdbeafe });
    const starField = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const r = 28 + (i % 35);
      const theta = (i * 137.5 * Math.PI) / 180;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      const s = 0.5 + (i % 5) * 0.25;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      starField.setMatrixAt(i, dummy.matrix);
    }
    starField.instanceMatrix.needsUpdate = true;
    scene.add(starField);

    // 9. Raycasting for Interactive Subsystem Inspection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickableObjects, true);
      if (hits.length > 0) {
        const subId = hits[0].object.userData?.subsystemId;
        if (subId && SUBSYSTEM_READOUTS[subId]) {
          setSelectedSubsystem(SUBSYSTEM_READOUTS[subId]);
        }
      }
    };
    renderer.domElement.addEventListener('click', handlePointerDown);

    // 10. Animation Loop with Delta-Time Clamping & Camera Lerp
    const clock = new THREE.Clock();
    const desiredCamPos = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Rotate centrifuge ring based on user RPM slider
      const radPerSec = (rpmRef.current * 2 * Math.PI) / 60;
      centrifugeGroup.rotation.x += radPerSec * dt;

      // Gentle station orbital drift & EVA astronaut microgravity bobbing
      if (autoRotateRef.current) {
        stationGroup.rotation.y += dt * 0.08;
      }
      evaGroup.position.y = 1.1 + Math.sin(elapsed * 1.5) * 0.14;
      evaGroup.rotation.z = Math.sin(elapsed * 0.9) * 0.06;

      // Update EVA biometric beacon color and pulse
      beaconMat.color.setHex(tierColorRef.current);
      beaconMat.emissive.setHex(tierColorRef.current);
      beaconMat.emissiveIntensity = 1.4 + Math.sin(elapsed * 3.2) * 0.7;

      // Toggle radiation shield overlay dome
      shieldDome.visible = shieldRef.current;
      if (shieldRef.current) {
        shieldDome.rotation.y -= dt * 0.15;
      }

      // Smoothly interpolate camera to selected preset unless user is actively dragging
      if (!userDraggingRef.current) {
        const preset = CAMERA_PRESETS[presetRef.current];
        desiredCamPos.set(...preset.pos);
        desiredTarget.set(...preset.target);
        camera.position.lerp(desiredCamPos, 0.06);
        controls.target.lerp(desiredTarget, 0.06);
      }

      controls.update();
      renderer.render(scene, camera);
      afterDraw();
    };
    animate();

    // 11. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onStartDrag);
      renderer.domElement.removeEventListener('click', handlePointerDown);
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [fullscreenCanvas]);

  const selectPreset = (preset: CameraPreset) => {
    userDraggingRef.current = false;
    setActivePreset(preset);
  };

  return (
    <div
      className={
        fullscreenCanvas
          ? 'fixed inset-0 z-50 bg-[#04060C] flex flex-col'
          : 'relative w-full h-[calc(100vh-125px)] min-h-[580px] rounded-2xl overflow-hidden border border-white/15 bg-[#04060C] flex flex-col'
      }
    >
      {/* Full-Bleed Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Top-Left Minimal Solid Pill Header (No backdrop-filter over WebGL per Three.js skill) */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto rounded-2xl bg-[#0A0F1C]/95 border border-white/15 px-4 py-3 shadow-2xl max-w-md space-y-1">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-[#3DE0FF]" />
            <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#3DE0FF] font-bold">
              3D ORBITAL HABITAT & EVA DIGITAL TWIN • WEBGL PBR
            </span>
          </div>
          <h1 className="text-base font-display font-bold text-[#F2F6FF]">
            ARES-01 Centrifuge Craft & {activeCrew.name} EVA Bio-Link
          </h1>
          <p className="text-xs text-[#A9B4CC]">
            Drag to orbit • Scroll to zoom • Click any 3D module or the EVA
            astronaut to inspect live telemetry.
          </p>
        </div>

        {/* Top-Right Selected Subsystem Telemetry Card */}
        <div className="pointer-events-auto rounded-2xl bg-[#0A0F1C]/95 border border-white/15 p-3.5 shadow-2xl max-w-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono-tabular uppercase tracking-wider px-2 py-0.5 rounded bg-[#3DE0FF]/15 text-[#3DE0FF] font-bold">
              {selectedSubsystem.category}
            </span>
            <StatusChip tier={overallTier} compact />
          </div>
          <div className="text-xs font-display font-bold text-[#F2F6FF]">
            {selectedSubsystem.title}
          </div>
          <div className="text-xs font-mono-tabular text-[#2DD4BF] font-semibold">
            {selectedSubsystem.telemetry}
          </div>
          <p className="text-[11px] text-[#A9B4CC] leading-relaxed">
            {selectedSubsystem.description}
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] font-mono-tabular text-[#7C89A6] border-t border-white/10">
            <span>
              HR: {evaluations?.heart_rate?.latestValue ?? 64} bpm
            </span>
            <span>
              SpO₂: {evaluations?.spo2_pct?.latestValue ?? 98}%
            </span>
            <span>MD-{selectedMissionDay}</span>
          </div>
        </div>
      </div>

      {/* Bottom Collapsible Control Dock (Solid dark background, zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-col items-center">
        <div className="pointer-events-auto w-full max-w-4xl rounded-2xl bg-[#0A0F1C]/95 border border-white/20 shadow-2xl overflow-hidden">
          <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#3DE0FF]" />
              <span className="text-xs font-display font-bold text-[#F2F6FF]">
                3D Orbital Telemetry Controls & Camera Presets
              </span>
              <span className="text-[11px] font-mono-tabular text-[#7C89A6]">
                Env: {environmentMode.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/copilot')}
                className="px-2.5 py-1 rounded-lg bg-[#8B7CFF]/20 border border-[#8B7CFF]/50 text-[#8B7CFF] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Open AI Copilot Studio
              </button>
              <button
                type="button"
                onClick={() => setFullscreenCanvas((f) => !f)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A9B4CC] hover:text-white cursor-pointer"
                title="Toggle Fullscreen 3D Viewport"
              >
                {fullscreenCanvas ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setDockCollapsed((c) => !c)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A9B4CC] hover:text-white cursor-pointer"
                title="Collapse/Expand Control Dock"
              >
                {dockCollapsed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {!dockCollapsed && (
            <div className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              {/* Camera Preset Buttons */}
              <div className="lg:col-span-7 flex flex-wrap items-center gap-1.5">
                {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((key) => {
                  const active = activePreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectPreset(key)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition cursor-pointer ${
                        active
                          ? 'bg-[#3DE0FF] text-[#04060C] border-[#3DE0FF] font-bold'
                          : 'bg-white/5 text-[#A9B4CC] border-white/10 hover:text-white'
                      }`}
                    >
                      {CAMERA_PRESETS[key].label}
                    </button>
                  );
                })}
              </div>

              {/* Centrifuge Artificial Gravity RPM Slider */}
              <div className="lg:col-span-2 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#A9B4CC]">Spin:</span>
                  <span className="font-mono-tabular text-[#3DE0FF] font-bold">
                    {centrifugeRpm.toFixed(1)} RPM
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={0.2}
                  value={centrifugeRpm}
                  onChange={(e) => setCentrifugeRpm(Number(e.target.value))}
                  aria-label="Centrifuge Ring RPM"
                  className="w-full accent-[#3DE0FF] cursor-pointer"
                />
              </div>

              {/* Shield Dome & Auto-Orbit Toggles */}
              <div className="lg:col-span-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShieldDome((s) => !s)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 cursor-pointer ${
                    showShieldDome
                      ? 'bg-[#2DD4BF]/20 border-[#2DD4BF] text-[#2DD4BF]'
                      : 'bg-white/5 border-white/10 text-[#A9B4CC]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>GCR Shield</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRotate((r) => !r)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 cursor-pointer ${
                    autoRotate
                      ? 'bg-[#3DE0FF]/20 border-[#3DE0FF] text-[#3DE0FF]'
                      : 'bg-white/5 border-white/10 text-[#A9B4CC]'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Orbit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
