import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const STAGE_CONFIG = [
  { id: 'food', icon: '', label: 'Order Placed', hint: 'Plated Food & QR' },
  { id: 'cook', icon: '‍', label: 'Preparing', hint: 'Chef Cooking on Stove' },
  { id: 'ready', icon: '️', label: 'Food Ready', hint: 'Steaming Dish & Cloche' },
  { id: 'waiter', icon: '️', label: 'Call Waiter', hint: 'Steward & Service Bell' },
  { id: 'cash', icon: '', label: 'Pay Bill', hint: 'Cash, Coins & POS' }
];

export default function ThreeRestaurantScene({ activeStage = 'food', onStageChange }) {
  const mountRef = useRef(null);
  const activeStageRef = useRef(activeStage);

  useEffect(() => {
    activeStageRef.current = activeStage;
  }, [activeStage]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    let width = currentMount.clientWidth || 360;
    let height = currentMount.clientHeight || 320;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(4.8, 4.2, 5.8);
    camera.lookAt(0, 0.6, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    currentMount.appendChild(renderer.domElement);

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5ee, 1.4);
    scene.add(ambientLight);

    // Warm Sun Key Light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Warm Orange Accent (FoodyPay signature logo color)
    const flameLight = new THREE.PointLight(0xff5e14, 3.2, 12);
    flameLight.position.set(-2.5, 3, 2.5);
    scene.add(flameLight);

    // Vibrant Leaf Green Accent (FoodyPay signature logo leaves)
    const emeraldLight = new THREE.PointLight(0x22c55e, 2.4, 10);
    emeraldLight.position.set(3, 2.5, -2);
    scene.add(emeraldLight);

    // Soft Fill Light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.8);
    fillLight.position.set(-4, 3, -4);
    scene.add(fillLight);

    // 4. Main Scene Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Modern Pedestal / Restaurant Table Base
    const tableGeo = new THREE.CylinderGeometry(2.6, 2.8, 0.22, 48);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1c0f0d,
      roughness: 0.35,
      metalness: 0.15
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = 0;
    table.receiveShadow = true;
    rootGroup.add(table);

    // Glowing Neon Table Rim
    const rimGeo = new THREE.TorusGeometry(2.62, 0.04, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf92b02,
      emissive: 0xf92b02,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.1;
    rootGroup.add(rim);

    // =============================================================
    // MODEL 1: FOOD & DRINK & QR (STAGE 'food')
    // =============================================================
    const foodGroup = new THREE.Group();
    rootGroup.add(foodGroup);

    const burgerGroup = new THREE.Group();
    burgerGroup.position.set(0.4, 0.12, 0.2);
    foodGroup.add(burgerGroup);

    // Slate Ceramic Plate with Gold Lip
    const plateGeo = new THREE.CylinderGeometry(1.4, 1.25, 0.08, 40);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.1
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.04;
    plate.castShadow = true;
    plate.receiveShadow = true;
    burgerGroup.add(plate);

    const plateLipGeo = new THREE.TorusGeometry(1.38, 0.03, 16, 48);
    const plateLipMat = new THREE.MeshStandardMaterial({ color: 0xffb020, metalness: 0.8, roughness: 0.2 });
    const plateLip = new THREE.Mesh(plateLipGeo, plateLipMat);
    plateLip.rotation.x = Math.PI / 2;
    plateLip.position.y = 0.08;
    burgerGroup.add(plateLip);

    // Bottom Brioche Bun
    const bottomBunGeo = new THREE.CylinderGeometry(0.72, 0.65, 0.22, 32);
    const bunMat = new THREE.MeshStandardMaterial({
      color: 0xd9822b,
      roughness: 0.5,
      metalness: 0.05
    });
    const bottomBun = new THREE.Mesh(bottomBunGeo, bunMat);
    bottomBun.position.y = 0.19;
    bottomBun.castShadow = true;
    burgerGroup.add(bottomBun);

    // Juicy Grilled Patty
    const pattyGeo = new THREE.CylinderGeometry(0.76, 0.76, 0.2, 28);
    const pattyMat = new THREE.MeshStandardMaterial({
      color: 0x422018,
      roughness: 0.75,
      metalness: 0.1
    });
    const patty = new THREE.Mesh(pattyGeo, pattyMat);
    patty.position.y = 0.38;
    patty.castShadow = true;
    burgerGroup.add(patty);

    // Melted Cheddar Cheese with Drooping Corners
    const cheeseGeo = new THREE.BoxGeometry(1.08, 0.04, 1.08);
    const cheeseMat = new THREE.MeshStandardMaterial({
      color: 0xffb300,
      roughness: 0.3,
      metalness: 0.1
    });
    const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
    cheese.position.y = 0.49;
    cheese.rotation.y = Math.PI / 4;
    cheese.castShadow = true;
    burgerGroup.add(cheese);

    // Red Tomato Slices (2 Slices)
    const tomatoGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.06, 24);
    const tomatoMat = new THREE.MeshStandardMaterial({
      color: 0xd32f2f,
      roughness: 0.2,
      metalness: 0.15
    });
    const tomato1 = new THREE.Mesh(tomatoGeo, tomatoMat);
    tomato1.position.set(-0.2, 0.54, 0.1);
    tomato1.rotation.z = 0.08;
    tomato1.castShadow = true;
    burgerGroup.add(tomato1);

    const tomato2 = new THREE.Mesh(tomatoGeo, tomatoMat);
    tomato2.position.set(0.24, 0.54, -0.1);
    tomato2.rotation.z = -0.06;
    tomato2.castShadow = true;
    burgerGroup.add(tomato2);

    // Crispy Wavy Lettuce Leaf
    const lettuceGeo = new THREE.CylinderGeometry(0.82, 0.74, 0.06, 24);
    const lettuceMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.4,
      metalness: 0.05
    });
    const lettuce = new THREE.Mesh(lettuceGeo, lettuceMat);
    lettuce.position.y = 0.6;
    lettuce.castShadow = true;
    burgerGroup.add(lettuce);

    // Glossy Top Brioche Bun Dome
    const topBunGeo = new THREE.SphereGeometry(0.75, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const topBunMat = new THREE.MeshStandardMaterial({
      color: 0xde8833,
      roughness: 0.4,
      metalness: 0.1
    });
    const topBun = new THREE.Mesh(topBunGeo, topBunMat);
    topBun.position.y = 0.62;
    topBun.scale.set(1, 0.75, 1);
    topBun.castShadow = true;
    burgerGroup.add(topBun);

    // Natural Sesame Seeds on Top Bun
    const seedGeo = new THREE.SphereGeometry(0.024, 8, 8);
    const seedMat = new THREE.MeshStandardMaterial({ color: 0xfff8e7, roughness: 0.3 });
    seedGeo.scale(1.4, 0.5, 0.7);

    for (let i = 0; i < 28; i++) {
      const seed = new THREE.Mesh(seedGeo, seedMat);
      const u = Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(1 - u * 0.65);
      const r = 0.75;

      seed.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        0.62 + r * Math.cos(phi) * 0.75,
        r * Math.sin(phi) * Math.sin(theta)
      );
      seed.rotation.set(Math.random(), Math.random(), Math.random());
      burgerGroup.add(seed);
    }

    // -------------------------------------------------------------
    // REFRESHING ICED BEVERAGE / COLD BREW TUMBLER
    // -------------------------------------------------------------
    const drinkGroup = new THREE.Group();
    drinkGroup.position.set(-1.1, 0.12, 0.7);
    foodGroup.add(drinkGroup);

    // Frosted Glass Tumbler
    const glassGeo = new THREE.CylinderGeometry(0.36, 0.28, 0.95, 24);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.85,
      ior: 1.45
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 0.5;
    glass.castShadow = true;
    drinkGroup.add(glass);

    // Liquid inside (Iced Caramel Latte / Cold Brew)
    const liquidGeo = new THREE.CylinderGeometry(0.33, 0.26, 0.78, 24);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0x8d4925,
      roughness: 0.2,
      metalness: 0.1
    });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.y = 0.44;
    drinkGroup.add(liquid);

    // Floating Ice Cubes
    const iceGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      transmission: 0.9
    });
    const ice1 = new THREE.Mesh(iceGeo, iceMat);
    ice1.position.set(0.08, 0.82, 0.05);
    ice1.rotation.set(0.2, 0.4, 0.1);
    drinkGroup.add(ice1);

    const ice2 = new THREE.Mesh(iceGeo, iceMat);
    ice2.position.set(-0.06, 0.8, -0.06);
    ice2.rotation.set(0.5, 0.1, 0.3);
    drinkGroup.add(ice2);

    // Striped Paper Straw
    const strawGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.25, 12);
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xf92b02 });
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.position.set(0.04, 0.7, -0.02);
    straw.rotation.set(0.18, 0, 0.22);
    drinkGroup.add(straw);

    // -------------------------------------------------------------
    // FOODYPAY SMART POS TABLET & FLOATING QR BEACON
    // -------------------------------------------------------------
    const posGroup = new THREE.Group();
    posGroup.position.set(-1.0, 0.12, -0.85);
    foodGroup.add(posGroup);

    // Tablet Metal Dock
    const dockGeo = new THREE.BoxGeometry(0.7, 0.18, 0.45);
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x2a1410, roughness: 0.3 });
    const dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.y = 0.09;
    posGroup.add(dock);

    // Tablet Device Body
    const tabletGeo = new THREE.BoxGeometry(1.15, 0.82, 0.05);
    const tabletMat = new THREE.MeshStandardMaterial({ color: 0x140a08, roughness: 0.2, metalness: 0.8 });
    const tablet = new THREE.Mesh(tabletGeo, tabletMat);
    tablet.position.set(0, 0.58, 0.04);
    tablet.rotation.x = -0.32;
    tablet.castShadow = true;
    posGroup.add(tablet);

    // Glowing Tablet Screen (FoodyPay Live POS Dashboard)
    const screenGeo = new THREE.PlaneGeometry(1.05, 0.72);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x2fa84f });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.58, 0.07);
    screen.rotation.x = -0.32;
    posGroup.add(screen);

    // Floating 3D QR Code Holo-Pedestal
    const qrRingGeo = new THREE.TorusGeometry(0.34, 0.025, 16, 32);
    const qrRingMat = new THREE.MeshBasicMaterial({ color: 0xf92b02 });
    const qrRing = new THREE.Mesh(qrRingGeo, qrRingMat);
    qrRing.position.set(0, 1.35, 0);
    posGroup.add(qrRing);

    // Central Spinning QR Token
    const qrTokenGeo = new THREE.BoxGeometry(0.36, 0.36, 0.04);
    const qrTokenMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.3
    });
    const qrToken = new THREE.Mesh(qrTokenGeo, qrTokenMat);
    qrToken.position.set(0, 1.35, 0);
    posGroup.add(qrToken);

    // Tiny QR pattern detail on token
    const qrCoreGeo = new THREE.PlaneGeometry(0.24, 0.24);
    const qrCoreMat = new THREE.MeshBasicMaterial({ color: 0x170a08 });
    const qrCore = new THREE.Mesh(qrCoreGeo, qrCoreMat);
    qrCore.position.set(0, 0, 0.025);
    qrToken.add(qrCore);

    // Rising Warm Food Steam Particles
    const steamCount = 20;
    const steamGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xfff4e6, transparent: true, opacity: 0.4 });
    const steamParticles = [];

    for (let i = 0; i < steamCount; i++) {
      const p = new THREE.Mesh(steamGeo, steamMat.clone());
      p.position.set(
        0.4 + (Math.random() - 0.5) * 0.5,
        1.1 + Math.random() * 0.9,
        0.2 + (Math.random() - 0.5) * 0.5
      );
      p.userData = {
        speedY: 0.007 + Math.random() * 0.009,
        baseY: 1.05,
        maxY: 2.3,
        initialX: p.position.x
      };
      foodGroup.add(p);
      steamParticles.push(p);
    }

    // =============================================================
    // MODEL 2: CHEF / COOK PREPARING (STAGE 'cook')
    // =============================================================
    const cookGroup = new THREE.Group();
    cookGroup.scale.set(0.001, 0.001, 0.001);
    cookGroup.visible = false;
    rootGroup.add(cookGroup);

    // Kitchen Stainless Stove Base
    const stoveBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.3, 0.5, 32),
      new THREE.MeshStandardMaterial({ color: 0x718096, metalness: 0.85, roughness: 0.2 })
    );
    stoveBase.position.set(0, 0.35, 0.2);
    cookGroup.add(stoveBase);

    // Burner Grate
    const burnerGrate = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.04, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.4 })
    );
    burnerGrate.rotation.x = Math.PI / 2;
    burnerGrate.position.set(0, 0.61, 0.2);
    cookGroup.add(burnerGrate);

    // Glowing Flame Cones
    const flameMeshList = [];
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff5e14 });
    const flameInnerMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const fCone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 8), flameMat);
      fCone.position.set(Math.cos(angle) * 0.42, 0.72, 0.2 + Math.sin(angle) * 0.42);
      fCone.userData = { offset: i * 0.8 };
      cookGroup.add(fCone);
      flameMeshList.push(fCone);

      const fInner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 8), flameInnerMat);
      fInner.position.set(Math.cos(angle) * 0.42, 0.69, 0.2 + Math.sin(angle) * 0.42);
      cookGroup.add(fInner);
    }

    // Sizzling Wok / Frying Pan Group
    const panGroup = new THREE.Group();
    panGroup.position.set(0, 0.85, 0.2);
    cookGroup.add(panGroup);

    const wokBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.42, 0.28, 28),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.25 })
    );
    panGroup.add(wokBody);

    const wokHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.6 })
    );
    wokHandle.rotation.z = Math.PI / 3;
    wokHandle.position.set(-0.75, 0.1, 0);
    panGroup.add(wokHandle);

    // Sizzling Colorful Veggies in Pan
    const foodCubesColors = [0xfff8e7, 0x4caf50, 0xe53935, 0xffb300, 0xff7043];
    for (let i = 0; i < 18; i++) {
      const col = foodCubesColors[i % foodCubesColors.length];
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })
      );
      cube.position.set((Math.random() - 0.5) * 0.45, 0.06, (Math.random() - 0.5) * 0.45);
      cube.rotation.set(Math.random(), Math.random(), Math.random());
      panGroup.add(cube);
    }

    // 3D Chef Character
    const chefGroup = new THREE.Group();
    chefGroup.position.set(0, 0.12, -0.9);
    cookGroup.add(chefGroup);

    const chefJacket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.55, 1.05, 24),
      new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.3 })
    );
    chefJacket.position.y = 0.8;
    chefGroup.add(chefJacket);

    const neckerchief = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.07, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4 })
    );
    neckerchief.rotation.x = Math.PI / 2;
    neckerchief.position.y = 1.32;
    chefGroup.add(neckerchief);

    const buttonMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.3 });
    for (let r = 0; r < 3; r++) {
      [-0.12, 0.12].forEach((xOffset) => {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), buttonMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(xOffset, 0.7 + r * 0.2, 0.52);
        chefGroup.add(btn);
      });
    }

    const chefHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 24, 20),
      new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.6 })
    );
    chefHead.position.y = 1.68;
    chefGroup.add(chefHead);

    const chefNose = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf0c294, roughness: 0.5 })
    );
    chefNose.position.set(0, 1.65, 0.35);
    chefGroup.add(chefNose);

    const mustache = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.035, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x2b1d0c, roughness: 0.8 })
    );
    mustache.position.set(0, 1.56, 0.34);
    mustache.rotation.z = Math.PI;
    chefGroup.add(mustache);

    const hatBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.34, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    hatBase.position.y = 2.05;
    chefGroup.add(hatBase);

    const hatPuff = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    hatPuff.position.y = 2.38;
    hatPuff.scale.set(1.1, 0.8, 1.1);
    chefGroup.add(hatPuff);

    const spatula = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.7, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.5 })
    );
    spatula.position.set(0.42, 1.1, 0.5);
    spatula.rotation.set(0.5, 0, -0.4);
    cookGroup.add(spatula);

    // Sizzling Steam Particles (Cook)
    const cookSteamCount = 18;
    const cookSteamGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const cookSteamMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.45 });
    const cookSteamParticles = [];

    for (let i = 0; i < cookSteamCount; i++) {
      const p = new THREE.Mesh(cookSteamGeo, cookSteamMat.clone());
      p.position.set((Math.random() - 0.5) * 0.5, 1.1 + Math.random() * 0.8, 0.2 + (Math.random() - 0.5) * 0.5);
      p.userData = { speedY: 0.009 + Math.random() * 0.01, baseY: 1.05, maxY: 2.4, initialX: p.position.x };
      cookGroup.add(p);
      cookSteamParticles.push(p);
    }

    // =============================================================
    // MODEL 3: FOOD READY WITH CLOCHE (STAGE 'ready')
    // =============================================================
    const readyGroup = new THREE.Group();
    readyGroup.scale.set(0.001, 0.001, 0.001);
    readyGroup.visible = false;
    rootGroup.add(readyGroup);

    const royalPlatter = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.45, 0.1, 48),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.2 })
    );
    royalPlatter.position.set(0, 0.18, 0);
    readyGroup.add(royalPlatter);

    const royalRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.58, 0.04, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0xfff080, metalness: 0.9, roughness: 0.15 })
    );
    royalRim.rotation.x = Math.PI / 2;
    royalRim.position.set(0, 0.23, 0);
    readyGroup.add(royalRim);

    const riceMound = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 })
    );
    riceMound.position.set(0, 0.22, 0);
    riceMound.scale.set(1, 0.6, 1);
    readyGroup.add(riceMound);

    const mintGarnish = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.28, 8),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 })
    );
    mintGarnish.position.set(0, 0.72, 0);
    readyGroup.add(mintGarnish);

    const clocheGroup = new THREE.Group();
    clocheGroup.position.set(0, 1.45, 0);
    readyGroup.add(clocheGroup);

    const clocheDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.12 })
    );
    clocheDome.scale.set(1, 0.78, 1);
    clocheGroup.add(clocheDome);

    const clocheHandle = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.9, roughness: 0.15 })
    );
    clocheHandle.position.y = 0.95;
    clocheGroup.add(clocheHandle);

    const readySparkleGroup = new THREE.Group();
    readyGroup.add(readySparkleGroup);

    const starGeo = new THREE.OctahedronGeometry(0.08, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const s = new THREE.Mesh(starGeo, starMat);
      s.position.set(Math.cos(angle) * 1.3, 0.8 + Math.sin(i) * 0.2, Math.sin(angle) * 1.3);
      readySparkleGroup.add(s);
    }

    const readySteamParticles = [];
    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(steamGeo, steamMat.clone());
      p.position.set((Math.random() - 0.5) * 0.7, 0.6 + Math.random() * 0.9, (Math.random() - 0.5) * 0.7);
      p.userData = { speedY: 0.008 + Math.random() * 0.009, baseY: 0.55, maxY: 2.2, initialX: p.position.x };
      readyGroup.add(p);
      readySteamParticles.push(p);
    }

    // =============================================================
    // MODEL 4: WAITER / STEWARD CALL (STAGE 'waiter')
    // =============================================================
    const waiterGroup = new THREE.Group();
    waiterGroup.scale.set(0.001, 0.001, 0.001);
    waiterGroup.visible = false;
    rootGroup.add(waiterGroup);

    const waiterChar = new THREE.Group();
    waiterChar.position.set(0, 0.12, 0);
    waiterGroup.add(waiterChar);

    const shirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.52, 1.1, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    shirt.position.y = 0.85;
    waiterChar.add(shirt);

    const vest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.54, 0.85, 24),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
    );
    vest.position.y = 0.8;
    waiterChar.add(vest);

    for (let b = 0; b < 3; b++) {
      const gBtn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
      );
      gBtn.rotation.x = Math.PI / 2;
      gBtn.position.set(0, 0.65 + b * 0.18, 0.52);
      waiterChar.add(gBtn);
    }

    const bowTie = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.1, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 })
    );
    bowTie.position.set(0, 1.34, 0.46);
    waiterChar.add(bowTie);

    const waiterHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 20),
      new THREE.MeshStandardMaterial({ color: 0xffdfba, roughness: 0.6 })
    );
    waiterHead.position.y = 1.7;
    waiterChar.add(waiterHead);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 })
    );
    hair.position.set(0, 1.8, -0.02);
    waiterChar.add(hair);

    const salver = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.6, 0.05, 32),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 })
    );
    salver.position.set(-0.85, 1.15, 0.3);
    waiterChar.add(salver);

    const miniCloche = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
    );
    miniCloche.position.set(-0.85, 1.2, 0.3);
    waiterChar.add(miniCloche);

    const bellGroup = new THREE.Group();
    bellGroup.position.set(0.85, 1.15, 0.2);
    waiterChar.add(bellGroup);

    const bellDome = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 })
    );
    bellGroup.add(bellDome);

    const bellPlunger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.8 })
    );
    bellPlunger.position.y = 0.2;
    bellGroup.add(bellPlunger);

    const soundWaveGeo = new THREE.TorusGeometry(0.4, 0.02, 12, 32);
    const soundWaveMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 });
    const soundRing1 = new THREE.Mesh(soundWaveGeo, soundWaveMat);
    soundRing1.rotation.x = Math.PI / 2;
    soundRing1.position.y = 0.1;
    bellGroup.add(soundRing1);

    const beaconHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.03, 16, 36),
      new THREE.MeshBasicMaterial({ color: 0xff5e14 })
    );
    beaconHalo.rotation.x = Math.PI / 2;
    beaconHalo.position.y = 2.25;
    waiterChar.add(beaconHalo);

    // =============================================================
    // MODEL 5: CASH & POS SETTLEMENT (STAGE 'cash')
    // =============================================================
    const cashGroup = new THREE.Group();
    cashGroup.scale.set(0.001, 0.001, 0.001);
    cashGroup.visible = false;
    rootGroup.add(cashGroup);

    const bundleGeo = new THREE.BoxGeometry(1.1, 0.28, 0.55);
    const bundleMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5 });
    const cashBundle1 = new THREE.Mesh(bundleGeo, bundleMat);
    cashBundle1.position.set(-0.6, 0.25, 0.35);
    cashBundle1.rotation.y = 0.2;
    cashGroup.add(cashBundle1);

    const cashBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.3, 0.57),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })
    );
    cashBand.position.set(-0.6, 0.25, 0.35);
    cashBand.rotation.y = 0.2;
    cashGroup.add(cashBand);

    const cashBundle2 = cashBundle1.clone();
    cashBundle2.position.set(-0.55, 0.52, 0.38);
    cashBundle2.rotation.y = -0.15;
    cashGroup.add(cashBundle2);

    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.18 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

    const createCoinStack = (x, z, height, isSilver = false) => {
      const stack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, height, 24),
        isSilver ? silverMat : coinMat
      );
      stack.position.set(x, 0.12 + height / 2, z);
      cashGroup.add(stack);
    };

    createCoinStack(0.3, 0.65, 0.45);
    createCoinStack(0.75, 0.55, 0.65);
    createCoinStack(0.6, 0.95, 0.35, true);
    createCoinStack(-0.1, 0.9, 0.5);

    const floatNoteGeo = new THREE.PlaneGeometry(0.85, 0.42);
    const floatNoteMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.4, side: THREE.DoubleSide });
    const floatNote1 = new THREE.Mesh(floatNoteGeo, floatNoteMat);
    floatNote1.position.set(-0.8, 1.25, -0.1);
    floatNote1.rotation.set(0.4, 0.3, 0.2);
    cashGroup.add(floatNote1);

    const floatNote2 = new THREE.Mesh(floatNoteGeo, floatNoteMat);
    floatNote2.position.set(0.9, 1.35, 0.1);
    floatNote2.rotation.set(-0.3, 0.5, -0.2);
    cashGroup.add(floatNote2);

    const posDevice = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.35, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.6 })
    );
    posDevice.position.set(0, 0.3, -0.45);
    posDevice.rotation.x = -0.25;
    cashGroup.add(posDevice);

    const posOledScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.52),
      new THREE.MeshBasicMaterial({ color: 0x00e676 })
    );
    posOledScreen.rotation.x = -Math.PI / 2 - 0.25;
    posOledScreen.position.set(0, 0.52, -0.65);
    cashGroup.add(posOledScreen);

    const receiptPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, side: THREE.DoubleSide })
    );
    receiptPaper.rotation.x = -0.6;
    receiptPaper.position.set(0, 0.9, -0.85);
    cashGroup.add(receiptPaper);

    const successOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    successOrb.position.set(0, 1.7, -0.4);
    cashGroup.add(successOrb);

    // -------------------------------------------------------------
    // INTERACTIVE MOUSE ROTATION / DRAG CONTROLS
    // -------------------------------------------------------------
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotationY += deltaX * 0.008;
      targetRotationX = Math.max(-0.25, Math.min(0.35, targetRotationX + deltaY * 0.005));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support for mobile devices
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      targetRotationY += deltaX * 0.008;
      targetRotationX = Math.max(-0.25, Math.min(0.35, targetRotationX + deltaY * 0.005));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      isDragging = false;
    };
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // -------------------------------------------------------------
    // ANIMATION & RENDER LOOP
    // -------------------------------------------------------------
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = (performance.now() - startTime) / 1000;

      // Auto-rotation when not dragging
      if (!isDragging) {
        targetRotationY += 0.005;
      }

      // Smooth interpolation for inertia rotation
      rootGroup.rotation.y += (targetRotationY - rootGroup.rotation.y) * 0.08;
      rootGroup.rotation.x += (targetRotationX - rootGroup.rotation.x) * 0.08;

      const currentStageVal = activeStageRef.current || 'food';

      // 1. Smooth Transition Scaling
      const targetFoodScale = currentStageVal === 'food' ? 1 : 0.0001;
      const targetCookScale = currentStageVal === 'cook' ? 1 : 0.0001;
      const targetReadyScale = currentStageVal === 'ready' ? 1 : 0.0001;
      const targetWaiterScale = currentStageVal === 'waiter' ? 1 : 0.0001;
      const targetCashScale = currentStageVal === 'cash' ? 1 : 0.0001;

      foodGroup.scale.lerp(new THREE.Vector3(targetFoodScale, targetFoodScale, targetFoodScale), 0.14);
      cookGroup.scale.lerp(new THREE.Vector3(targetCookScale, targetCookScale, targetCookScale), 0.14);
      readyGroup.scale.lerp(new THREE.Vector3(targetReadyScale, targetReadyScale, targetReadyScale), 0.14);
      waiterGroup.scale.lerp(new THREE.Vector3(targetWaiterScale, targetWaiterScale, targetWaiterScale), 0.14);
      cashGroup.scale.lerp(new THREE.Vector3(targetCashScale, targetCashScale, targetCashScale), 0.14);

      foodGroup.visible = foodGroup.scale.x > 0.01;
      cookGroup.visible = cookGroup.scale.x > 0.01;
      readyGroup.visible = readyGroup.scale.x > 0.01;
      waiterGroup.visible = waiterGroup.scale.x > 0.01;
      cashGroup.visible = cashGroup.scale.x > 0.01;

      // 2. Animate Food Stage
      if (foodGroup.visible) {
        qrToken.rotation.y = t * 2.2;
        qrRing.rotation.z = -t * 1.5;
        qrRing.position.y = 1.35 + Math.sin(t * 3) * 0.05;
        qrToken.position.y = 1.35 + Math.sin(t * 3) * 0.05;

        steamParticles.forEach((p) => {
          p.position.y += p.userData.speedY;
          p.position.x = p.userData.initialX + Math.sin(t * 2 + p.position.y * 3) * 0.06;
          const progress = (p.position.y - p.userData.baseY) / (p.userData.maxY - p.userData.baseY);
          p.material.opacity = Math.max(0, (1 - progress) * 0.38);
          if (p.position.y > p.userData.maxY) p.position.y = p.userData.baseY;
        });
      }

      // 3. Animate Cook Stage
      if (cookGroup.visible) {
        panGroup.rotation.z = Math.sin(t * 4.5) * 0.08;
        panGroup.position.y = 0.85 + Math.sin(t * 9) * 0.03;
        spatula.rotation.z = -0.4 + Math.sin(t * 5) * 0.15;

        flameMeshList.forEach((f) => {
          f.scale.y = 1 + Math.sin(t * 14 + f.userData.offset) * 0.3;
        });

        cookSteamParticles.forEach((p) => {
          p.position.y += p.userData.speedY;
          p.position.x = p.userData.initialX + Math.sin(t * 3 + p.position.y * 4) * 0.06;
          const progress = (p.position.y - p.userData.baseY) / (p.userData.maxY - p.userData.baseY);
          p.material.opacity = Math.max(0, (1 - progress) * 0.42);
          if (p.position.y > p.userData.maxY) p.position.y = p.userData.baseY;
        });
      }

      // 4. Animate Ready Stage
      if (readyGroup.visible) {
        clocheGroup.position.y = 1.45 + Math.sin(t * 2.5) * 0.06;
        readySparkleGroup.rotation.y = t * 1.8;

        readySteamParticles.forEach((p) => {
          p.position.y += p.userData.speedY;
          p.position.x = p.userData.initialX + Math.sin(t * 2.5 + p.position.y * 3) * 0.06;
          const progress = (p.position.y - p.userData.baseY) / (p.userData.maxY - p.userData.baseY);
          p.material.opacity = Math.max(0, (1 - progress) * 0.4);
          if (p.position.y > p.userData.maxY) p.position.y = p.userData.baseY;
        });
      }

      // 5. Animate Waiter Stage
      if (waiterGroup.visible) {
        salver.position.y = 1.15 + Math.sin(t * 3) * 0.03;
        miniCloche.position.y = 1.2 + Math.sin(t * 3) * 0.03;
        bellGroup.rotation.z = Math.sin(t * 10) * 0.12;

        const waveScale = 1 + ((t * 2.2) % 1) * 1.6;
        soundRing1.scale.set(waveScale, waveScale, waveScale);
        soundWaveMat.opacity = Math.max(0, 0.7 * (1 - ((t * 2.2) % 1)));
        beaconHalo.rotation.z = t * 2;
      }

      // 6. Animate Cash Stage
      if (cashGroup.visible) {
        floatNote1.position.y = 1.25 + Math.sin(t * 2.5) * 0.08;
        floatNote1.rotation.z = 0.2 + Math.sin(t * 2) * 0.1;
        floatNote2.position.y = 1.35 + Math.cos(t * 2.8) * 0.08;
        floatNote2.rotation.z = -0.2 + Math.cos(t * 2) * 0.1;
        successOrb.position.y = 1.7 + Math.sin(t * 3) * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------
    // RESPONSIVE RESIZE
    // -------------------------------------------------------------
    const handleResize = () => {
      if (!currentMount) return;
      width = currentMount.clientWidth;
      height = currentMount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);

      if (currentMount && dom) {
        currentMount.removeChild(dom);
      }
      renderer.dispose();
    };
  }, []);

  const activeMeta = STAGE_CONFIG.find((s) => s.id === activeStage) || STAGE_CONFIG[0];

  return (
    <div className="three-scene-wrapper upgraded-3d">
      {/* 5-STAGE INTERACTIVE CONTROL PILL BAR */}
      <div className="three-scene-stage-bar">
        {STAGE_CONFIG.map((st) => {
          const isActive = activeStage === st.id;
          return (
            <button
              key={st.id}
              type="button"
              className={`stage-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => onStageChange && onStageChange(st.id)}
              title={st.hint}
            >
              <span className="pill-icon">{st.icon}</span>
              <span className="pill-label">{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3D WEBGL CANVAS */}
      <div className="three-scene-canvas" ref={mountRef} />

      {/* FOOTER BADGE & TELEMETRY */}
      <div className="three-scene-badge">
        <span className="live-3d-dot" />
        <span>3D Stage: <b>{activeMeta.icon} {activeMeta.hint}</b> •  Drag to rotate 360°</span>
      </div>
    </div>
  );
}
