import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CheckCircle2, Star, X, Clock, ChefHat, Flame, Bike, PackageCheck, Sparkles } from 'lucide-react';

/**
 * Stage mapping helper:
 * 1: Placed (new, pending, placed)
 * 2: Acknowledged (seen, accepted, acknowledged)
 * 3: Kitchen / Preparing (preparing, cooking, in-kitchen)
 * 4: Ready / Out for Delivery (ready, out_for_delivery, serving)
 * 5: Delivered / Completed (completed, delivered, served)
 */
function getStageDetails(status, seen, isDelivery) {
  const rawStatus = (status || 'new').toLowerCase().trim();
  const normalizedStatus = rawStatus.replace(/[^a-z0-9_]/g, '');

  if (
    ['completed', 'delivered', 'done', 'paid', 'served'].includes(rawStatus) ||
    ['completed', 'delivered', 'done', 'paid', 'served'].includes(normalizedStatus)
  ) {
    return {
      stage: 5,
      title: 'Order Completed!',
      subtitle: isDelivery ? 'Delivered to your doorstep.' : 'Served fresh at your table. Enjoy your meal!',
      color: '#10B981',
      bgGradient: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)',
      accentColor: '#34D399',
      progressPercent: 100,
      badgeText: 'Completed'
    };
  }

  if (
    ['ready', 'out_for_delivery', 'out for delivery', 'on the way', 'serving', 'dispatched'].includes(rawStatus) ||
    ['ready', 'out_for_delivery', 'outfordelivery', 'ontheway', 'serving', 'dispatched'].includes(normalizedStatus)
  ) {
    return {
      stage: 4,
      title: isDelivery ? 'Out For Delivery' : 'Order Ready to Serve!',
      subtitle: isDelivery ? 'Delivery partner is on the way to your location.' : 'Freshly prepared and ready at your table.',
      color: '#059669',
      bgGradient: 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)',
      accentColor: '#6EE7B7',
      progressPercent: 85,
      badgeText: isDelivery ? 'On The Way' : 'Ready'
    };
  }

  if (
    ['preparing', 'cooking', 'in-kitchen', 'kitchen', 'in_kitchen', 'food_preparing', 'kitchen display system'].includes(rawStatus) ||
    ['preparing', 'cooking', 'inkitchen', 'kitchen', 'in_kitchen', 'foodpreparing'].includes(normalizedStatus)
  ) {
    return {
      stage: 3,
      title: 'Cooking In Kitchen',
      subtitle: 'Chef is crafting your order with fresh ingredients.',
      color: '#F59E0B',
      bgGradient: 'linear-gradient(135deg, #451A03 0%, #1E1B4B 100%)',
      accentColor: '#FBBF24',
      progressPercent: 55,
      badgeText: 'Preparing'
    };
  }

  if (
    seen ||
    ['accepted', 'acknowledged', 'seen', 'confirmed', 'processing'].includes(rawStatus) ||
    ['accepted', 'acknowledged', 'seen', 'confirmed', 'processing'].includes(normalizedStatus)
  ) {
    return {
      stage: 2,
      title: 'Order Acknowledged',
      subtitle: 'Kitchen staff has accepted your order request.',
      color: '#3B82F6',
      bgGradient: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
      accentColor: '#60A5FA',
      progressPercent: 35,
      badgeText: 'Accepted'
    };
  }

  return {
    stage: 1,
    title: 'Order Placed',
    subtitle: 'Sent to restaurant. Waiting for kitchen confirmation.',
    color: '#06B6D4',
    bgGradient: 'linear-gradient(135deg, #083344 0%, #0F172A 100%)',
    accentColor: '#22D3EE',
    progressPercent: 15,
    badgeText: 'Order Placed'
  };
}

export default function ActiveOrderStatus3DCard({ order, onRatingClick, onDismiss }) {
  const mountRef = useRef(null);
  const isDelivery = order?.table === 'Delivery' || order?.type === 'Home Delivery';
  const stageInfo = getStageDetails(order?.status, order?.seen, isDelivery);
  const [estimatedMins, setEstimatedMins] = useState(15);

  useEffect(() => {
    // Random countdown logic for preparation UI
    const timer = setInterval(() => {
      setEstimatedMins((prev) => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Three.js 3D Interactive Model Canvas
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 220;
    const height = container.clientHeight || 180;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const pointLight = new THREE.PointLight(THREE.Color.NAMES[stageInfo.accentColor] || 0x38bdf8, 3, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // 3. Build 3D Objects based on Stage
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Common Base Glow Disc
    const baseGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.15, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8,
      emissive: new THREE.Color(stageInfo.color),
      emissiveIntensity: 0.25
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.6;
    stageGroup.add(baseMesh);

    // Orbit Ring
    const ringGeo = new THREE.TorusGeometry(2.5, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(stageInfo.accentColor), transparent: true, opacity: 0.6 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    ringMesh.position.y = -1.5;
    stageGroup.add(ringMesh);

    // Stage Specific 3D Models
    let activeCoreMesh = null;
    let particleSystem = null;

    if (stageInfo.stage === 1) {
      // Stage 1: Placed Hologram Tag (Hexagon / Floating Crystal)
      const geo = new THREE.IcosahedronGeometry(1.3, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: true,
        emissive: 0x0891b2,
        emissiveIntensity: 0.6
      });
      activeCoreMesh = new THREE.Mesh(geo, mat);
      stageGroup.add(activeCoreMesh);

      // Core Crystal inside
      const innerGeo = new THREE.OctahedronGeometry(0.7, 0);
      const innerMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x67e8f9, emissiveIntensity: 0.9 });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      activeCoreMesh.add(innerMesh);

    } else if (stageInfo.stage === 2) {
      // Stage 2: Acknowledged Badge Shield (Torus Knot Shield)
      const geo = new THREE.TorusKnotGeometry(0.95, 0.28, 100, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.15,
        metalness: 0.85,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.4
      });
      activeCoreMesh = new THREE.Mesh(geo, mat);
      stageGroup.add(activeCoreMesh);

    } else if (stageInfo.stage === 3) {
      // Stage 3: Kitchen / Wok Fire Pan
      const wokGeo = new THREE.SphereGeometry(1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const wokMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.4,
        metalness: 0.9,
        side: THREE.DoubleSide
      });
      const wokMesh = new THREE.Mesh(wokGeo, wokMat);
      wokMesh.rotation.x = Math.PI;
      wokMesh.position.y = -0.3;
      stageGroup.add(wokMesh);

      // Wok Handle
      const handleGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 16);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.rotation.z = Math.PI / 3;
      handleMesh.position.set(-1.2, -0.4, 0);
      stageGroup.add(handleMesh);

      // Flames Inside
      const flameGeo = new THREE.ConeGeometry(0.7, 1.4, 16);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });
      activeCoreMesh = new THREE.Mesh(flameGeo, flameMat);
      activeCoreMesh.position.y = 0.2;
      stageGroup.add(activeCoreMesh);

    } else if (stageInfo.stage === 4) {
      // Stage 4: Cloche Food Dome / Ready
      const domeGeo = new THREE.SphereGeometry(1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0x059669,
        emissiveIntensity: 0.2
      });
      activeCoreMesh = new THREE.Mesh(domeGeo, domeMat);
      activeCoreMesh.position.y = -0.2;
      stageGroup.add(activeCoreMesh);

      // Dome Knob
      const knobGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const knobMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
      const knobMesh = new THREE.Mesh(knobGeo, knobMat);
      knobMesh.position.y = 1.45;
      activeCoreMesh.add(knobMesh);

    } else {
      // Stage 5: Completed Trophy Star
      const starGeo = new THREE.DodecahedronGeometry(1.2, 0);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x047857,
        emissiveIntensity: 0.5
      });
      activeCoreMesh = new THREE.Mesh(starGeo, starMat);
      stageGroup.add(activeCoreMesh);
    }

    // Particle Swarm
    const particleCount = 45;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 4.5;
      positions[i + 1] = (Math.random() - 0.5) * 4.5;
      positions[i + 2] = (Math.random() - 0.5) * 4.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.08,
      color: new THREE.Color(stageInfo.accentColor),
      transparent: true,
      opacity: 0.7
    });
    particleSystem = new THREE.Points(pGeo, pMat);
    stageGroup.add(particleSystem);

    // 4. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotation & Float
      stageGroup.rotation.y = elapsedTime * 0.45;
      ringMesh.rotation.z = -elapsedTime * 0.6;

      if (activeCoreMesh) {
        activeCoreMesh.position.y = Math.sin(elapsedTime * 2) * 0.12 + (stageInfo.stage === 3 ? 0.2 : (stageInfo.stage === 4 ? -0.2 : 0));
        activeCoreMesh.rotation.x = elapsedTime * 0.3;
        activeCoreMesh.rotation.z = elapsedTime * 0.2;
      }

      if (particleSystem) {
        particleSystem.rotation.y = -elapsedTime * 0.2;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 220;
      const h = container.clientHeight || 180;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [stageInfo]);

  return (
    <div
      style={{
        background: stageInfo.bgGradient,
        borderRadius: '20px',
        border: `1px solid ${stageInfo.color}55`,
        padding: '20px',
        marginBottom: '20px',
        boxShadow: `0 12px 32px rgba(0,0,0,0.35), 0 0 20px ${stageInfo.color}33`,
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFFFF'
      }}
    >
      {/* Background Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-20%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${stageInfo.color}44 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '20px', zIndex: 2, position: 'relative' }}>
        
        {/* Left Interactive 3D Model Canvas */}
        <div style={{ flex: '0 0 190px', width: '190px', height: '170px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${stageInfo.accentColor}66`,
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: stageInfo.accentColor,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
          >
            <Sparkles size={11} color={stageInfo.accentColor} /> 3D Live Simulation
          </div>
        </div>

        {/* Right Active Order Status Details & Progress Stepper */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  backgroundColor: `${stageInfo.color}33`,
                  border: `1px solid ${stageInfo.accentColor}`,
                  color: stageInfo.accentColor,
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {stageInfo.badgeText}
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
                Order #{order?.id || 'ACTIVE'}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onRatingClick && (
                <button
                  onClick={onRatingClick}
                  style={{
                    backgroundColor: 'rgba(254, 243, 199, 0.15)',
                    border: '1px solid #F59E0B',
                    color: '#FBBF24',
                    padding: '5px 12px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backdropFilter: 'blur(4px)',
                    transition: 'transform 0.2s'
                  }}
                >
                  <Star size={13} fill="#F59E0B" /> Rate Food
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8',
                    cursor: 'pointer'
                  }}
                  title="Dismiss Tracker"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Title & Subtitle */}
          <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
            {stageInfo.title}
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#CBD5E1', lineHeight: '1.4' }}>
            {stageInfo.subtitle}
          </p>

          {/* Time & Location Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Clock size={13} color={stageInfo.accentColor} />
              <span style={{ fontSize: '11.5px', color: '#E2E8F0', fontWeight: 600 }}>
                Est. Time: <strong style={{ color: stageInfo.accentColor }}>~{estimatedMins} Mins</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {isDelivery ? <Bike size={13} color="#38BDF8" /> : <ChefHat size={13} color="#38BDF8" />}
              <span style={{ fontSize: '11.5px', color: '#E2E8F0', fontWeight: 600 }}>
                {isDelivery ? 'Home Delivery' : `Table: ${order?.table || 'Dine-In'}`}
              </span>
            </div>
          </div>

          {/* 5-Stage Animated Responsive Progress Bar */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>
              <span style={{ color: stageInfo.stage >= 1 ? stageInfo.accentColor : '#64748B' }}>1. Placed</span>
              <span style={{ color: stageInfo.stage >= 2 ? stageInfo.accentColor : '#64748B' }}>2. Accepted</span>
              <span style={{ color: stageInfo.stage >= 3 ? stageInfo.accentColor : '#64748B' }}>3. Kitchen</span>
              <span style={{ color: stageInfo.stage >= 4 ? stageInfo.accentColor : '#64748B' }}>4. {isDelivery ? 'Delivery' : 'Served'}</span>
              <span style={{ color: stageInfo.stage >= 5 ? '#34D399' : '#64748B' }}>5. Done</span>
            </div>

            {/* Glowing Progress Track */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '7px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  width: `${stageInfo.progressPercent}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${stageInfo.color} 0%, ${stageInfo.accentColor} 100%)`,
                  borderRadius: '10px',
                  boxShadow: `0 0 12px ${stageInfo.accentColor}`,
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
