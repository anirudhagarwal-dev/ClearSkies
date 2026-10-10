import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RefreshCw, Eye, Sparkles, Activity } from 'lucide-react';
import { CpcbCategoryType } from '../types';

interface AirGlobe3DProps {
  aqiValue: number;
  aqiCategory: CpcbCategoryType;
  stationName: string;
  dominantPollutant: string;
}

export const AirGlobe3D: React.FC<AirGlobe3DProps> = ({
  aqiValue,
  aqiCategory,
  stationName,
  dominantPollutant
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [particleCount, setParticleCount] = useState(350);

  // Map category to color hex & particle speed
  const getCategoryTheme = (category: CpcbCategoryType) => {
    switch (category) {
      case 'GOOD':
        return { color: '#10b981', glow: '#34d399', speed: 0.003, haze: 0.15, label: 'Clean Atmosphere' };
      case 'SATISFACTORY':
        return { color: '#84cc16', glow: '#a3e635', speed: 0.004, haze: 0.25, label: 'Satisfactory Air' };
      case 'MODERATE':
        return { color: '#eab308', glow: '#fde047', speed: 0.006, haze: 0.45, label: 'Moderate Smog' };
      case 'POOR':
        return { color: '#f97316', glow: '#fb923c', speed: 0.009, haze: 0.65, label: 'Dense Particulates' };
      case 'VERY_POOR':
        return { color: '#ef4444', glow: '#f87171', speed: 0.013, haze: 0.85, label: 'Toxic Haze Alert' };
      case 'SEVERE':
        return { color: '#d946ef', glow: '#f0abfc', speed: 0.018, haze: 1.0, label: 'Hazardous Emergency' };
      default:
        return { color: '#06b6d4', glow: '#38bdf8', speed: 0.005, haze: 0.3, label: 'Monitoring...' };
    }
  };

  const theme = getCategoryTheme(aqiCategory);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Central Atmospheric Globe (Wireframe Sphere + Inner Solid)
    const primaryColor = new THREE.Color(theme.color);
    const glowColor = new THREE.Color(theme.glow);

    // Outer Wireframe latitude rings
    const globeGeo = new THREE.SphereGeometry(1.4, 24, 24);
    const globeMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);

    // Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const innerMat = new THREE.MeshPhongMaterial({
      color: primaryColor,
      emissive: primaryColor,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.4,
      shininess: 90
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(primaryColor, 3, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 5. Floating Particle Cloud (PM2.5 / PM10 simulation)
    const particleGeometry = new THREE.BufferGeometry();
    const count = 350;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 1.5 + Math.random() * 0.9;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 2.2;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      radii[i] = radius;
      angles[i] = angle;
      speeds[i] = (0.2 + Math.random() * 0.8) * theme.speed;
      scales[i] = Math.random() * 0.04 + 0.015;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Material
    const pMaterial = new THREE.PointsMaterial({
      color: glowColor,
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeometry, pMaterial);
    scene.add(particleSystem);

    // Orbit Ring Visualizer
    const ringGeo = new THREE.RingGeometry(1.8, 1.83, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    scene.add(ringMesh);

    // Mouse drag interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globeMesh.rotation.y += deltaX * 0.008;
      globeMesh.rotation.x += deltaY * 0.008;
      innerMesh.rotation.y += deltaX * 0.008;
      ringMesh.rotation.z += deltaX * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 6. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto rotation
      globeMesh.rotation.y += theme.speed * 1.2;
      innerMesh.rotation.y += theme.speed * 0.8;
      ringMesh.rotation.z += theme.speed * 0.5;

      // Move floating particles
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        angles[i] += speeds[i];
        posArray[i * 3] = Math.cos(angles[i]) * radii[i];
        posArray[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [aqiCategory, theme]);

  return (
    <div 
      className="relative w-full h-full min-h-[340px] rounded-2xl overflow-hidden glass-panel border border-white/10 p-4 flex flex-col justify-between transition-all duration-500 hover:border-cyan-500/40 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `radial-gradient(circle at 50% 50%, ${theme.color}15 0%, rgba(15, 23, 42, 0.85) 80%)`
      }}
    >
      {/* Dynamic Background Ambient Aura */}
      <div 
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-40 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: theme.color }}
      />
      <div 
        className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl opacity-30 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: theme.glow }}
      />

      {/* Top Header info */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Interactive 3D Atmosphere Model
            </h4>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" /> Realtime Particle Dispersion
            </p>
          </div>
        </div>

        <div 
          className="px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5"
          style={{
            borderColor: `${theme.color}60`,
            backgroundColor: `${theme.color}20`,
            color: theme.glow
          }}
        >
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.color }} />
          {theme.label}
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
        title="Drag to rotate 3D atmospheric model"
      />

      {/* Bottom Floating Stats Overlay */}
      <div className="relative z-10 mt-auto flex items-center justify-between bg-slate-950/70 backdrop-blur-md rounded-xl p-3 border border-white/10">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Current Station AQI</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black" style={{ color: theme.glow }}>
              {aqiValue}
            </span>
            <span className="text-xs font-medium text-slate-300">
              Primary: <strong className="text-cyan-400">{dominantPollutant}</strong>
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
            <Eye className="w-3 h-3 text-slate-400" /> Interactive 3D Orbit
          </span>
          <span className="text-[11px] text-slate-300 font-mono">
            Drag to Rotate • 350 Particles
          </span>
        </div>
      </div>
    </div>
  );
};
