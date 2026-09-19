"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

type FishState = {
  direction: THREE.Vector2;
  mesh: THREE.Mesh;
  phase: number;
  position: THREE.Vector2;
  scale: number;
  speed: number;
};

type BoatState = {
  baseY: number;
  bobAmount: number;
  geometries: THREE.BufferGeometry[];
  group: THREE.Group;
  materials: THREE.Material[];
  phase: number;
  textures: THREE.Texture[];
};

const hiddenPointer = new THREE.Vector2(10_000, 10_000);

function createFishGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.92, 0);
  shape.bezierCurveTo(0.56, 0.25, -0.28, 0.3, -0.66, 0);
  shape.lineTo(-1.04, 0.34);
  shape.lineTo(-0.92, 0);
  shape.lineTo(-1.04, -0.34);
  shape.lineTo(-0.66, 0);
  shape.bezierCurveTo(-0.28, -0.3, 0.56, -0.25, 0.92, 0);
  const geometry = new THREE.ShapeGeometry(shape, 5);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function createLightGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 246, 214, 1)");
    gradient.addColorStop(0.2, "rgba(255, 211, 145, 0.72)");
    gradient.addColorStop(1, "rgba(255, 188, 104, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBoat(scale: number, lightOpacity: number): BoatState {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.78, 0.2);
  hullShape.lineTo(1.48, 0.2);
  hullShape.bezierCurveTo(1.7, 0.16, 1.86, 0.04, 1.96, -0.12);
  hullShape.bezierCurveTo(1.62, -0.2, 1.34, -0.27, 1.08, -0.31);
  hullShape.lineTo(-1.28, -0.31);
  hullShape.bezierCurveTo(-1.5, -0.22, -1.67, -0.05, -1.78, 0.2);
  hullShape.closePath();
  const hullGeometry = new THREE.ExtrudeGeometry(hullShape, {
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.045,
    bevelThickness: 0.05,
    depth: 0.68,
  });
  hullGeometry.translate(0, 0, -0.34);
  const hullMaterial = new THREE.MeshBasicMaterial({ color: 0x101516 });
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  group.add(hull);
  geometries.push(hullGeometry);
  materials.push(hullMaterial);

  const deckGeometry = new THREE.BoxGeometry(2.9, 0.06, 0.64);
  const deckMaterial = new THREE.MeshBasicMaterial({ color: 0x1b2021 });
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.set(-0.08, 0.23, 0);
  group.add(deck);
  geometries.push(deckGeometry);
  materials.push(deckMaterial);

  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.68, 0);
  cabinShape.lineTo(0.5, 0);
  cabinShape.lineTo(0.3, 0.55);
  cabinShape.lineTo(-0.5, 0.55);
  cabinShape.closePath();
  const cabinGeometry = new THREE.ExtrudeGeometry(cabinShape, {
    bevelEnabled: false,
    depth: 0.56,
  });
  cabinGeometry.translate(0, 0, -0.28);
  const cabinMaterial = new THREE.MeshBasicMaterial({ color: 0x151a1b });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(-0.32, 0.26, 0);
  group.add(cabin);
  geometries.push(cabinGeometry);
  materials.push(cabinMaterial);

  const roofGeometry = new THREE.BoxGeometry(1.3, 0.07, 0.72);
  const roofMaterial = new THREE.MeshBasicMaterial({ color: 0x07090a });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.set(-0.4, 0.84, 0);
  group.add(roof);
  geometries.push(roofGeometry);
  materials.push(roofMaterial);

  const mastGeometry = new THREE.CylinderGeometry(0.024, 0.032, 1.36, 8);
  const mastMaterial = new THREE.MeshBasicMaterial({ color: 0x202627 });
  const mast = new THREE.Mesh(mastGeometry, mastMaterial);
  mast.position.set(0.58, 1.02, 0);
  group.add(mast);
  geometries.push(mastGeometry);
  materials.push(mastMaterial);

  const antennaGeometry = new THREE.CylinderGeometry(0.01, 0.014, 0.64, 6);
  const antenna = new THREE.Mesh(antennaGeometry, mastMaterial);
  antenna.position.set(-0.12, 1.18, 0);
  antenna.rotation.z = -0.13;
  group.add(antenna);
  geometries.push(antennaGeometry);

  const railGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1.42, 6);
  const railMaterial = new THREE.MeshBasicMaterial({ color: 0x333a3b });
  const rail = new THREE.Mesh(railGeometry, railMaterial);
  rail.position.set(1.05, 0.49, 0.3);
  rail.rotation.z = Math.PI / 2;
  group.add(rail);
  geometries.push(railGeometry);
  materials.push(railMaterial);

  const stanchionGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.25, 6);
  [-0.56, 0, 0.56].forEach((offset) => {
    const stanchion = new THREE.Mesh(stanchionGeometry, railMaterial);
    stanchion.position.set(1.05 + offset, 0.37, 0.3);
    group.add(stanchion);
  });
  geometries.push(stanchionGeometry);

  const windowGeometry = new THREE.PlaneGeometry(0.24, 0.19);
  const warmLightMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xffe1a8,
    depthWrite: false,
    opacity: lightOpacity,
    toneMapped: false,
    transparent: true,
  });
  [-0.58, -0.26].forEach((x) => {
    const windowLight = new THREE.Mesh(windowGeometry, warmLightMaterial);
    windowLight.position.set(x, 0.6, 0.286);
    group.add(windowLight);
  });
  geometries.push(windowGeometry);
  materials.push(warmLightMaterial);

  const mastLightGeometry = new THREE.SphereGeometry(0.088, 12, 10);
  const mastLightMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xffedbd,
    depthWrite: false,
    opacity: Math.min(lightOpacity + 0.12, 1),
    toneMapped: false,
    transparent: true,
  });
  const mastLight = new THREE.Mesh(mastLightGeometry, mastLightMaterial);
  mastLight.position.set(0.58, 1.73, 0.02);
  group.add(mastLight);
  geometries.push(mastLightGeometry);
  materials.push(mastLightMaterial);

  const glowTexture = createLightGlowTexture();
  const cabinGlowMaterial = new THREE.SpriteMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xffd69a,
    depthWrite: false,
    map: glowTexture,
    opacity: lightOpacity * 0.95,
    toneMapped: false,
    transparent: true,
  });
  const cabinGlow = new THREE.Sprite(cabinGlowMaterial);
  cabinGlow.position.set(-0.42, 0.6, 0.32);
  cabinGlow.scale.set(0.92, 0.42, 1);
  group.add(cabinGlow);
  const mastGlowMaterial = cabinGlowMaterial.clone();
  mastGlowMaterial.opacity = lightOpacity * 0.84;
  const mastGlow = new THREE.Sprite(mastGlowMaterial);
  mastGlow.position.copy(mastLight.position);
  mastGlow.scale.set(0.42, 0.42, 1);
  group.add(mastGlow);
  textures.push(glowTexture);
  materials.push(cabinGlowMaterial, mastGlowMaterial);

  const bowLightGeometry = new THREE.SphereGeometry(0.052, 10, 8);
  const bowLightMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: 0xff8f72,
    depthWrite: false,
    opacity: lightOpacity,
    toneMapped: false,
    transparent: true,
  });
  const bowLight = new THREE.Mesh(bowLightGeometry, bowLightMaterial);
  bowLight.position.set(1.58, 0.35, 0.3);
  group.add(bowLight);
  geometries.push(bowLightGeometry);
  materials.push(bowLightMaterial);

  group.scale.setScalar(scale);
  return {
    baseY: 0,
    bobAmount: 0.03,
    geometries,
    group,
    materials,
    phase: 0,
    textures,
  };
}

function addPointerRipple(material: THREE.ShaderMaterial) {
  material.uniforms.uPointerPosition = { value: hiddenPointer.clone() };
  material.uniforms.uPointerStrength = { value: 0 };
  material.uniforms.uPointerTime = { value: 0 };

  material.fragmentShader = material.fragmentShader
    .replace(
      "uniform vec3 waterColor;",
      `uniform vec3 waterColor;
      uniform vec2 uPointerPosition;
      uniform float uPointerStrength;
      uniform float uPointerTime;`,
    )
    .replace(
      "vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );",
      `vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );
      vec2 pointerDelta = worldPosition.xz - uPointerPosition;
      float pointerDistance = length( pointerDelta );
      float pointerRing = sin( pointerDistance * 5.4 - uPointerTime * 5.0 );
      pointerRing *= exp( -pointerDistance * 0.36 ) * uPointerStrength;
      vec2 pointerDirection = normalize( pointerDelta + vec2( 0.0001 ) );
      surfaceNormal.xz += pointerDirection * pointerRing * 0.78;
      surfaceNormal = normalize( surfaceNormal );`,
    )
    .replace(
      "vec3 outgoingLight = albedo;",
      `float diagonalProgress = clamp( ( worldPosition.z + 48.0 ) / 60.0, 0.0, 1.0 );
      float moonPathCenter = mix( -10.5, 9.0, diagonalProgress );
      float moonPathWidth = mix( 2.8, 9.5, diagonalProgress );
      float moonPath = 1.0 - smoothstep(
        moonPathWidth,
        moonPathWidth * 1.7,
        abs( worldPosition.x - moonPathCenter )
      );
      float movingShimmer = pow(
        0.5 + 0.5 * sin(
          worldPosition.x * 1.35 + worldPosition.z * 0.42 - time * 1.15 + noise.x * 5.0
        ),
        4.0
      );
      float moonShimmer = moonPath * (
        0.014 + movingShimmer * 0.052 + length( specularLight ) * 0.16
      );
      vec3 outgoingLight = albedo * ( 0.78 + moonPath * 0.22 ) + sunColor * moonShimmer;`,
    );
  material.needsUpdate = true;
}

export default function ElectronicOcean() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compactViewport = window.innerWidth < 700;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020508);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 240);
    camera.position.set(0, compactViewport ? 5.2 : 4.3, compactViewport ? 11.5 : 10.5);
    camera.lookAt(0, 0, compactViewport ? -14 : -17);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, reducedMotion ? 1 : compactViewport ? 1.25 : 1.75),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.76;
    container.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const moonTexture = textureLoader.load("/moon_1024.jpg");
    moonTexture.colorSpace = THREE.SRGBColorSpace;
    moonTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const moonGeometry = new THREE.SphereGeometry(compactViewport ? 1.34 : 1.55, 40, 28);
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xeaf2f5,
      map: moonTexture,
      toneMapped: false,
    });
    const moonHighlightMaterial = new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: 0xf6fbff,
      depthWrite: false,
      map: moonTexture,
      opacity: 0.56,
      toneMapped: false,
      transparent: true,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(compactViewport ? -3.3 : -10.5, compactViewport ? 10.7 : 10.4, -46);
    moon.rotation.y = -0.32;
    scene.add(moon);
    const moonHighlight = new THREE.Mesh(moonGeometry, moonHighlightMaterial);
    moonHighlight.position.copy(moon.position);
    moonHighlight.rotation.copy(moon.rotation);
    moonHighlight.scale.setScalar(1.003);
    scene.add(moonHighlight);

    const farBoat = createBoat(compactViewport ? 0.44 : 0.58, 1);
    farBoat.baseY = 0.18;
    farBoat.bobAmount = 0.018;
    farBoat.phase = 1.4;
    farBoat.group.position.set(compactViewport ? 8 : 22, farBoat.baseY, -44);
    farBoat.group.rotation.y = 0.1;

    const nearBoat = createBoat(compactViewport ? 0.92 : 1.3, 1);
    nearBoat.baseY = 0.3;
    nearBoat.bobAmount = 0.04;
    nearBoat.phase = 3.1;
    nearBoat.group.position.set(compactViewport ? 3 : 8, nearBoat.baseY, -23);
    nearBoat.group.rotation.y = -0.04;

    const boats = [farBoat, nearBoat];
    scene.add(farBoat.group, nearBoat.group);

    const waterGeometry = new THREE.PlaneGeometry(140, 140);
    const rippleGeometry = new THREE.PlaneGeometry(140, 140);
    const rippleMaterial = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fragmentShader: `
        uniform vec2 uPointerPosition;
        uniform float uPointerStrength;
        uniform float uPointerTime;
        varying vec2 vWorldPosition;

        void main() {
          float distanceToPointer = distance(vWorldPosition, uPointerPosition);
          float rings = 0.5 + 0.5 * cos(distanceToPointer * 6.5 - uPointerTime * 4.8);
          float secondaryRings = 0.5 + 0.5 * cos(distanceToPointer * 3.4 - uPointerTime * 3.1);
          rings = pow(rings, 4.5);
          secondaryRings = pow(secondaryRings, 8.0);
          float envelope = exp(-distanceToPointer * 0.46) * uPointerStrength;
          float centerGlint = exp(-distanceToPointer * 6.5) * uPointerStrength;
          float alpha = (rings * 0.62 + secondaryRings * 0.2) * envelope + centerGlint * 0.28;
          gl_FragColor = vec4(vec3(0.64, 0.78, 0.86), alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uPointerPosition: { value: hiddenPointer.clone() },
        uPointerStrength: { value: 0 },
        uPointerTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vWorldPosition;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
    });
    const rippleSurface = new THREE.Mesh(rippleGeometry, rippleMaterial);
    rippleSurface.rotation.x = -Math.PI / 2;
    rippleSurface.position.y = 0.025;
    rippleSurface.renderOrder = 2;
    scene.add(rippleSurface);

    const fishGeometry = createFishGeometry();
    const fishMaterial = new THREE.MeshBasicMaterial({
      color: 0x858a88,
      depthWrite: false,
      opacity: compactViewport ? 0.14 : 0.19,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const fish: FishState[] = [];
    const fishCount = reducedMotion ? 0 : compactViewport ? 3 : 6;

    for (let index = 0; index < fishCount; index += 1) {
      const mesh = new THREE.Mesh(fishGeometry, fishMaterial);
      const scale = 0.62 + Math.random() * 0.42;
      mesh.scale.setScalar(scale);
      mesh.position.y = 0.035;
      mesh.renderOrder = 3;
      scene.add(mesh);
      fish.push({
        direction: new THREE.Vector2(0.94, ((index % 3) - 1) * 0.16).normalize(),
        mesh,
        phase: index * 0.91,
        position: new THREE.Vector2((index - (fishCount - 1) / 2) * 3.5, -7 - (index % 4) * 5.2),
        scale,
        speed: 0.52 + (index % 4) * 0.09,
      });
    }

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const pointerWorld = hiddenPointer.clone();
    const pointerTarget = hiddenPointer.clone();
    const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    let pointerStrength = 0;
    let pointerStrengthTarget = 0;
    let frameId = 0;
    let isVisible = true;
    let disposed = false;
    let lastFrameTime = performance.now();
    let elapsed = 0;
    let hasPointerHit = false;
    let water: Water | null = null;
    let waterMaterial: THREE.ShaderMaterial | null = null;

    const normalTexture = textureLoader.load("/waternormals.jpg", (texture) => {
      if (disposed) return;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.NoColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

      const reflectionResolution = compactViewport ? 512 : 1024;
      const moonDirection = new THREE.Vector3(-0.2, 0.22, -1).normalize();
      water = new Water(waterGeometry, {
        alpha: 1,
        distortionScale: compactViewport ? 1.9 : 2.55,
        fog: false,
        sunColor: 0xdce8ed,
        sunDirection: moonDirection,
        textureHeight: reflectionResolution,
        textureWidth: reflectionResolution,
        waterColor: 0x02070b,
        waterNormals: texture,
      });
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0;
      water.renderOrder = 1;
      waterMaterial = water.material as THREE.ShaderMaterial;
      waterMaterial.uniforms.size.value = compactViewport ? 1.45 : 1.68;
      addPointerRipple(waterMaterial);
      scene.add(water);
      renderer.render(scene, camera);
    });

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const withinCanvas =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!withinCanvas) {
        pointerStrengthTarget = 0;
        return;
      }

      pointerNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(waterPlane, intersection)) {
        pointerTarget.set(intersection.x, intersection.z);
        if (!hasPointerHit) {
          pointerWorld.copy(pointerTarget);
          pointerStrength = 0.9;
          hasPointerHit = true;
        }
        pointerStrengthTarget = 1;
      }
    };

    const onPointerLeave = () => {
      pointerStrengthTarget = 0;
    };

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !reducedMotion) {
        lastFrameTime = performance.now();
        frameId = window.requestAnimationFrame(render);
      }
    };

    const updateFish = (delta: number) => {
      fish.forEach((item) => {
        const toPointer = item.position.clone().sub(pointerWorld);
        const pointerDistance = toPointer.length();
        if (pointerStrength > 0.04 && pointerDistance < 5.6) {
          const avoidance = toPointer.normalize().multiplyScalar((5.6 - pointerDistance) * delta * 1.75);
          item.direction.add(avoidance).normalize();
        } else {
          const wander = Math.sin(elapsed * 0.34 + item.phase) * delta * 0.18;
          item.direction.rotateAround(new THREE.Vector2(0, 0), wander).normalize();
        }

        item.position.addScaledVector(item.direction, item.speed * delta);
        if (item.position.x > 19) item.position.x = -19;
        if (item.position.x < -19) item.position.x = 19;
        if (item.position.y > 4) item.position.y = -34;
        if (item.position.y < -34) item.position.y = 4;

        item.mesh.position.set(item.position.x, 0.035, item.position.y);
        item.mesh.rotation.y = Math.atan2(-item.direction.y, item.direction.x);
        item.mesh.scale.set(
          item.scale,
          item.scale,
          item.scale * (1 + Math.sin(elapsed * 3.4 + item.phase) * 0.08),
        );
      });
    };

    const updateBoats = () => {
      boats.forEach((boat, index) => {
        boat.group.position.y = boat.baseY + Math.sin(elapsed * 0.72 + boat.phase) * boat.bobAmount;
        boat.group.rotation.x = Math.sin(elapsed * 0.48 + boat.phase) * (index === 0 ? 0.006 : 0.01);
        boat.group.rotation.z = Math.sin(elapsed * 0.58 + boat.phase) * (index === 0 ? 0.012 : 0.018);
      });
    };

    const render = (frameTime = performance.now()) => {
      if (!isVisible) return;
      const delta = Math.min((frameTime - lastFrameTime) / 1000, 0.05);
      lastFrameTime = frameTime;
      elapsed += delta;
      pointerWorld.lerp(pointerTarget, 0.13);
      pointerStrength = THREE.MathUtils.lerp(pointerStrength, pointerStrengthTarget, 0.1);
      pointerStrengthTarget *= 0.994;

      if (waterMaterial) {
        waterMaterial.uniforms.time.value += delta * 0.78;
        waterMaterial.uniforms.uPointerPosition.value.copy(pointerWorld);
        waterMaterial.uniforms.uPointerStrength.value = pointerStrength;
        waterMaterial.uniforms.uPointerTime.value = elapsed;
      }
      rippleMaterial.uniforms.uPointerPosition.value.copy(pointerWorld);
      rippleMaterial.uniforms.uPointerStrength.value = pointerStrength;
      rippleMaterial.uniforms.uPointerTime.value = elapsed;

      updateFish(delta);
      updateBoats();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    resize();
    renderer.render(scene, camera);
    if (!reducedMotion) frameId = window.requestAnimationFrame(render);

    window.addEventListener("resize", resize);
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      fish.forEach((item) => scene.remove(item.mesh));
      boats.forEach((boat) => {
        scene.remove(boat.group);
        boat.geometries.forEach((geometry) => geometry.dispose());
        boat.materials.forEach((material) => material.dispose());
        boat.textures.forEach((texture) => texture.dispose());
      });
      if (water) scene.remove(water);
      scene.remove(moon);
      scene.remove(moonHighlight);
      scene.remove(rippleSurface);
      waterGeometry.dispose();
      rippleGeometry.dispose();
      rippleMaterial.dispose();
      fishGeometry.dispose();
      fishMaterial.dispose();
      moonGeometry.dispose();
      moonMaterial.dispose();
      moonHighlightMaterial.dispose();
      moonTexture.dispose();
      waterMaterial?.dispose();
      normalTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="electronic-ocean" ref={containerRef} aria-hidden="true" />;
}
