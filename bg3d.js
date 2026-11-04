/* ============================================================
   3D Pokémon Background · Three.js
   Floating Pokéballs, elemental sparks & interactive parallax
   ============================================================ */

(function init3DBackground() {
  if (typeof THREE === "undefined") {
    console.warn("Three.js not loaded, skipping 3D background");
    return;
  }

  const canvas = document.getElementById("bg3d");
  if (!canvas) return;

  // Reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scene & Camera
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04060c, 0.0045);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 32);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0x242d45, 1.4);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
  dirLight1.position.set(20, 30, 25);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 1.0);
  dirLight2.position.set(-25, -20, 15);
  scene.add(dirLight2);

  const rimLight = new THREE.PointLight(0xffcb47, 2.2, 80);
  rimLight.position.set(0, 15, 10);
  scene.add(rimLight);

  // Helper: Build a 3D Pokéball
  function createPokeball({
    radius = 2.2,
    topColor = 0xee2c2c,
    topRoughness = 0.28,
    bottomColor = 0xf5f7fc,
    hasAccent = false,
    accentColor = 0x3b82f6
  } = {}) {
    const group = new THREE.Group();

    // Top Hemisphere
    const topGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const topMat = new THREE.MeshStandardMaterial({
      color: topColor,
      roughness: topRoughness,
      metalness: 0.25,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    group.add(topMesh);

    // Optional Accent details (like Great Ball stripes or Ultra Ball marks)
    if (hasAccent) {
      const accentGeo = new THREE.TorusGeometry(radius * 0.98, radius * 0.08, 12, 32, Math.PI);
      accentGeo.rotateX(Math.PI / 2.3);
      const accentMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.3,
        metalness: 0.5,
      });
      const accentMesh = new THREE.Mesh(accentGeo, accentMat);
      accentMesh.position.y = radius * 0.25;
      group.add(accentMesh);
    }

    // Bottom Hemisphere
    const bottomGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottomMat = new THREE.MeshStandardMaterial({
      color: bottomColor,
      roughness: 0.3,
      metalness: 0.15,
    });
    const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
    group.add(bottomMesh);

    // Black Belt Band
    const bandGeo = new THREE.CylinderGeometry(radius * 1.01, radius * 1.01, radius * 0.16, 36);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x14171f,
      roughness: 0.45,
      metalness: 0.2,
    });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    group.add(bandMesh);

    // Outer Button Ring (Black)
    const ringGeo = new THREE.CylinderGeometry(radius * 0.36, radius * 0.36, radius * 0.18, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, bandMat);
    ringMesh.position.z = radius * 0.93;
    group.add(ringMesh);

    // Button White Ring
    const btnGeo = new THREE.CylinderGeometry(radius * 0.26, radius * 0.26, radius * 0.2, 32);
    btnGeo.rotateX(Math.PI / 2);
    const btnMesh = new THREE.Mesh(btnGeo, bottomMat);
    btnMesh.position.z = radius * 0.94;
    group.add(btnMesh);

    // Button Center (Glowing Core)
    const coreGeo = new THREE.CylinderGeometry(radius * 0.14, radius * 0.14, radius * 0.23, 32);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x60a5fa,
      emissiveIntensity: 0.65,
      roughness: 0.1,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.z = radius * 0.95;
    group.add(coreMesh);

    return { group, coreMat };
  }

  // Collection of Pokéballs in 3D Space
  const pokeballs = [];

  // 1. Classic Pokéball (Hero, top right foreground)
  const pb1 = createPokeball({ radius: 3.2, topColor: 0xee2c2c });
  pb1.group.position.set(16, 6, 2);
  pb1.group.rotation.set(0.3, -0.6, 0.15);
  scene.add(pb1.group);
  pokeballs.push({
    mesh: pb1.group,
    core: pb1.coreMat,
    basePos: { x: 16, y: 6, z: 2 },
    rotSpeed: { x: 0.003, y: 0.006, z: 0.002 },
    bobSpeed: 0.0014,
    bobAmp: 0.9,
    phase: 0,
  });

  // 2. Great Ball (Top left middleground)
  const pb2 = createPokeball({
    radius: 2.2,
    topColor: 0x2563eb,
    hasAccent: true,
    accentColor: 0xef4444
  });
  pb2.group.position.set(-18, 9, -6);
  pb2.group.rotation.set(-0.2, 0.8, -0.2);
  scene.add(pb2.group);
  pokeballs.push({
    mesh: pb2.group,
    core: pb2.coreMat,
    basePos: { x: -18, y: 9, z: -6 },
    rotSpeed: { x: -0.004, y: 0.005, z: 0.001 },
    bobSpeed: 0.0018,
    bobAmp: 0.7,
    phase: 1.8,
  });

  // 3. Ultra Ball (Bottom left background)
  const pb3 = createPokeball({
    radius: 2.6,
    topColor: 0x1f2937,
    hasAccent: true,
    accentColor: 0xfacc15
  });
  pb3.group.position.set(-14, -10, -8);
  pb3.group.rotation.set(0.4, 0.5, 0.3);
  scene.add(pb3.group);
  pokeballs.push({
    mesh: pb3.group,
    core: pb3.coreMat,
    basePos: { x: -14, y: -10, z: -8 },
    rotSpeed: { x: 0.002, y: -0.005, z: 0.003 },
    bobSpeed: 0.0012,
    bobAmp: 0.8,
    phase: 3.2,
  });

  // 4. Distant Mystery Ball (Bottom right deep background)
  const pb4 = createPokeball({
    radius: 1.8,
    topColor: 0x9333ea,
    hasAccent: true,
    accentColor: 0xec4899
  });
  pb4.group.position.set(19, -8, -12);
  pb4.group.rotation.set(-0.3, -0.4, 0.2);
  scene.add(pb4.group);
  pokeballs.push({
    mesh: pb4.group,
    core: pb4.coreMat,
    basePos: { x: 19, y: -8, z: -12 },
    rotSpeed: { x: 0.004, y: 0.004, z: -0.002 },
    bobSpeed: 0.0016,
    bobAmp: 0.6,
    phase: 4.5,
  });

  // Elemental Energy Particles Field (Gold, Cyan, Fire, Grass, Psychic)
  const particleCount = 450;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const palette = [
    new THREE.Color(0xffcb47), // Electric / Gold
    new THREE.Color(0x38bdf8), // Water / Cyan
    new THREE.Color(0xf87171), // Fire / Coral
    new THREE.Color(0x4ade80), // Grass / Emerald
    new THREE.Color(0xc084fc), // Psychic / Lavender
  ];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 35;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Circular spark texture
  const sparkCanvas = document.createElement("canvas");
  sparkCanvas.width = 32;
  sparkCanvas.height = 32;
  const ctx = sparkCanvas.getContext("2d");
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.2)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);

  const sparkTexture = new THREE.CanvasTexture(sparkCanvas);
  const particleMat = new THREE.PointsMaterial({
    size: 0.65,
    map: sparkTexture,
    transparent: true,
    opacity: 0.75,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // Stadium subtle energy ring in the center
  const ringGeo = new THREE.RingGeometry(18, 18.3, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const arenaRing = new THREE.Mesh(ringGeo, ringMat);
  arenaRing.rotation.x = Math.PI / 2.3;
  arenaRing.position.y = -8;
  scene.add(arenaRing);

  // Mouse Parallax & Scroll Interaction
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  window.addEventListener("mousemove", (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 4;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 4;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 3;
      targetMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 3;
    }
  }, { passive: true });

  // Handle Resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // Animation Loop
  let isRunning = true;
  document.addEventListener("visibilitychange", () => {
    isRunning = !document.hidden;
    if (isRunning) requestAnimationFrame(animate);
  });

  let clock = new THREE.Clock();

  function animate() {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    // Smooth camera parallax
    currentMouseX += (targetMouseX - currentMouseX) * 0.04;
    currentMouseY += (targetMouseY - currentMouseY) * 0.04;
    camera.position.x = currentMouseX;
    camera.position.y = -currentMouseY;
    camera.lookAt(0, 0, 0);

    // Animate Pokéballs
    if (!prefersReducedMotion) {
      pokeballs.forEach((pb) => {
        pb.mesh.rotation.x += pb.rotSpeed.x;
        pb.mesh.rotation.y += pb.rotSpeed.y;
        pb.mesh.rotation.z += pb.rotSpeed.z;

        // Floating Sine Bob
        pb.mesh.position.y = pb.basePos.y + Math.sin(elapsed * 1000 * pb.bobSpeed + pb.phase) * pb.bobAmp;

        // Subtle core button pulse
        if (pb.core) {
          pb.core.emissiveIntensity = 0.5 + Math.sin(elapsed * 3 + pb.phase) * 0.25;
        }
      });

      // Drift Particles
      particleSystem.rotation.y = elapsed * 0.025;
      particleSystem.rotation.x = Math.sin(elapsed * 0.015) * 0.08;

      // Arena ring slow spin
      arenaRing.rotation.z = elapsed * 0.04;
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();

