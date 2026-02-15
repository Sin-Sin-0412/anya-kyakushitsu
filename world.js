import * as THREE from "three";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import { scene, camera, renderer, glitchPass, rgbShiftPass } from "./main.js";

RectAreaLightUniformsLib.init();

let mixer;
let actions = {};
let fanMesh = null; 
let hemiLight, dirLight, pointLight, rimLight, rimLightHelper;
let tvCanvas, tvContext, tvTexture;
let rectLight;
const initialPos = { x: 4.5, y: 2.5, z: 3.76 };
let cameraTime = 0;

export function initWorld(onLoadComplete) {

  camera.lookAt(0, 2.5, 0);

  const lightColors = {
    hemisphereSky: 0x0d0e35,
    hemisphereGround: 0x845c3e,
    directional: 0xaaccff,
    point: 0xffccaa,
  };

  initTVNoise();

  scene.fog = new THREE.FogExp2(0x9f8067, 0.001);

  hemiLight = new THREE.HemisphereLight(
    lightColors.hemisphereSky,
    lightColors.hemisphereGround,
    0.8,
  );
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(lightColors.directional, 0.25);
  dirLight.position.set(-40, 16.68, -14.76);
  dirLight.castShadow = true;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.target.position.set(0, 3, -1); //* 光の向き

  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 10; 
  dirLight.shadow.radius = 8;
  dirLight.shadow.camera.updateProjectionMatrix();

  scene.add(dirLight);
  scene.add(dirLight.target);

  pointLight = new THREE.PointLight(lightColors.point, 1.4, 15);
  pointLight.position.set(0.18, 7.2, 0);
  pointLight.castShadow = true;
  pointLight.decay = 2;
  pointLight.shadow.bias = -0.005;
  scene.add(pointLight);

  rectLight = new THREE.RectAreaLight(0x81d8d5, 1.5, 1.5, 1.5);
  rectLight.position.set(-5, 7.5, 0);
  rectLight.lookAt(0, 0, 0);
  scene.add(rectLight);

  rimLight = new THREE.SpotLight(0xd1e9ff, 52.1);
  rimLight.position.set(-20, 10.16, -1.64);
  rimLight.angle = 0.895353906273091;
  rimLight.penumbra = 1;
  rimLight.decay = 2;
  rimLight.distance = 21;
  rimLight.target.position.set(0, 0, 0);
  rimLight.castShadow = true;
  scene.add(rimLight);
  scene.add(rimLight.target);

  const textureLoader = new THREE.TextureLoader();
  const bgTexture = textureLoader.load("image/forest.jpg");

  const bgGeometry = new THREE.PlaneGeometry(40, 20);

  const bgMaterial = new THREE.MeshBasicMaterial({
    map: bgTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.1,
  });

  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgMesh.position.set(-35, 10, -9);
  bgMesh.rotation.y = Math.PI / 2.5;

  bgMesh.castShadow = false;
  bgMesh.receiveShadow = false;

  bgTexture.mapping = THREE.EquirectangularReflectionMapping;

  scene.add(bgMesh);


  const loadingBar = document.getElementById('loading-bar');
  const loadingScreen = document.getElementById('loading-screen');
  const manager = new THREE.LoadingManager();

  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;
    if (loadingBar) {
      loadingBar.style.width = progress + '%';
    }
  };

  manager.onLoad = function () {
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 1000);
      }
    }, 500);
  };

  const loader = new GLTFLoader(manager);
  loader.load("model/lain.glb", (gltf) => {
    const model = gltf.scene;
    model.rotation.y = Math.PI;

    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        if (node.name.includes("shouji")) {
          node.material = node.material.clone();
          node.material.transparent = true;
          node.material.opacity = 0.7;
          node.material.side = THREE.DoubleSide; 
          node.material.depthWrite = false; 
        }

        if (node.name === "Shouji") {
          node.castShadow = false;
        } else {
          node.castShadow = true;
        }

        if (node.name.includes("monitor")) {
          node.material = new THREE.MeshBasicMaterial({
            map: tvTexture,
          });
        }

        if (node.isMesh && node.material) {
          if (node.name.includes("monitor")) {
            return; 
          }

          node.material.envMap = bgTexture;
          node.material.envMapIntensity = 0.05; 
          node.material.needsUpdate = true;
        }

        if (node.name.includes("tenban")) {
          node.material = node.material.clone();
          node.material.roughness = 0.91;
          node.material.metalness = 0.3;
        }

        if (node.name.includes("pot")) {
          node.material = node.material.clone();
          node.material.roughness = 0.6;
          node.material.metalness = 0.3;
          node.material.envMapIntensity = 0.05;
        }

        if (node.name.includes("cha")) {
          node.material = node.material.clone();
          node.material.roughness = 0.6;
          node.material.metalness = 0.5;
        }
      }
    });

    scene.add(model);

    fanMesh = model.getObjectByName("fan");

    mixer = new THREE.AnimationMixer(model);

    gltf.animations.forEach((clip) => {
      actions[clip.name] = mixer.clipAction(clip);
    });

    if (actions["breath"]) actions["breath"].play();
    if (actions["air"]) actions["air"].play();

    if (onLoadComplete) {
      onLoadComplete();
    }

    
  });
}

let smokeParticles;
const smokeCount = 200;

export function initSmoke() {
  const loader = new THREE.TextureLoader();
  const smokeTexture = loader.load("image/circle.png");

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(smokeCount * 3);
  const velocities = []; //* 上昇速度を個別に持つための配列

  for (let i = 0; i < smokeCount; i++) {
    positions[i * 3 + 0] = -12 + (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = 1 + Math.random() * 2;
    positions[i * 3 + 2] = -2 + (Math.random() - 0.5) * 8;

    velocities.push(0.01 + Math.random() * 0.02); 
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 1.5,
    map: smokeTexture,
    transparent: true,
    opacity: 0.015,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0xaaaaaa,
  });

  smokeParticles = new THREE.Points(geometry, material);
  smokeParticles.userData.velocities = velocities;
  scene.add(smokeParticles);
}

function initTVNoise() {
  tvCanvas = document.createElement("canvas");
  tvCanvas.width = 384;
  tvCanvas.height = 384;
  tvContext = tvCanvas.getContext("2d");

  tvTexture = new THREE.CanvasTexture(tvCanvas);
  tvTexture.magFilter = THREE.NearestFilter;
  tvTexture.minFilter = THREE.NearestFilter;
  tvTexture.wrapS = THREE.RepeatWrapping;
  tvTexture.wrapT = THREE.RepeatWrapping;
  tvTexture.repeat.set(3, 3); 
}

function updateTVNoise() {
  if (!tvContext) return;

  const width = tvCanvas.width;
  const height = tvCanvas.height;
  const imageData = tvContext.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = 3 + Math.random() * 3;
    data[i] = value * 0.5;
    data[i + 1] = value * 0.9;
    data[i + 2] = value * 1.2;
    data[i + 3] = 255;
  }

  const timeOffset = Math.floor(Date.now() / 100) % 4;

  for (let y = 0; y < height; y++) {
    if ((y + timeOffset) % 4 === 0) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        data[index] *= 0.8; 
        data[index + 1] *= 0.8;
        data[index + 2] *= 0.8;
      }
    }
  }

  tvContext.putImageData(imageData, 0, 0);
  tvTexture.needsUpdate = true;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHoveringMonitor = false;

export function initInteractions() {
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    checkIntersect();
  });
}

function checkIntersect() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  const monitorHit = intersects.find((el) =>
    el.object.name.includes("monitor"),
  );

  if (monitorHit) {
    if (!isHoveringMonitor) {
      isHoveringMonitor = true;
      startGlitch();
    }
  } else {
    if (isHoveringMonitor) {
      isHoveringMonitor = false;
      stopGlitch();
    }
  }
}

function startGlitch() {
  glitchPass.enabled = true;
  glitchPass.goWild = true;

  gsap.to(renderer, {
    toneMappingExposure: 0.1,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
  });

  if (rgbShiftPass) {
    rgbShiftPass.uniforms["angle"].value = 0.9;

    gsap.to(rgbShiftPass.uniforms["amount"], {
      value: 0.1, 
      duration: 0.1, 
      repeat: 1, 
      yoyo: true,
      onComplete: () => {
        rgbShiftPass.uniforms["amount"].value = 0.0;
      },
    });
  }

  gsap.delayedCall(0.1, () => {
    glitchPass.goWild = false;
    if (!isHoveringMonitor) {
      glitchPass.enabled = false;
    }
  });
}

function stopGlitch() {
  glitchPass.enabled = false;
  glitchPass.goWild = false;

  gsap.killTweensOf(glitchPass);
}

export function updateWorld(delta) {

  if (mixer) {
    mixer.update(delta);
  }

  if (fanMesh) {
    fanMesh.rotation.x += delta * 20;
  }

  if (smokeParticles) {
    const positions = smokeParticles.geometry.attributes.position.array;
    const velocities = smokeParticles.userData.velocities;

    for (let i = 0; i < smokeCount; i++) {
      positions[i * 3 + 1] += velocities[i];

      if (positions[i * 3 + 1] > 0) {
        const windStrength = (positions[i * 3 + 1] - 2.5) * -0.005;
        positions[i * 3 + 2] += windStrength;
      }

      if (positions[i * 3 + 1] > 12) {
        positions[i * 3 + 1] = 1; //* 最後の数値で高さを調整する

        positions[i * 3 + 2] = -2 + (Math.random() - 0.5) * 8;
      }
    }
    smokeParticles.geometry.attributes.position.needsUpdate = true;
  }


  cameraTime += delta;
  const swayY = Math.sin(cameraTime * 0.8) * 0.02;
  const swayX = Math.cos(cameraTime * 0.4) * 0.01;

  camera.position.y = initialPos.y + swayY;
  camera.position.x = initialPos.x + swayX;

  updateTVNoise();
}
