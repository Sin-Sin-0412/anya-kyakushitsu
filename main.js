import * as THREE from "three";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { initWorld, updateWorld, initSmoke, initInteractions } from './world.js'; 
import { initScrollAnimations } from './animation.js';

export let scene, camera, renderer;
export let glitchPass, rgbShiftPass;
let composer;


function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(3.7, 2.5, 2.96);

  const canvas = document.querySelector("#canvas");

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  window.addEventListener("resize", onWindowResize);

  initPostProcessing();
  initWorld(() => {
  initSmoke();
  initInteractions();
  animate();
  adjustCamera(window.innerWidth, window.innerHeight);
  initScrollAnimations();
});
}


function initPostProcessing(){
  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  glitchPass = new GlitchPass();
  glitchPass.enabled = false;
  glitchPass.goWild = false;
  composer.addPass(glitchPass);

  rgbShiftPass = new ShaderPass(RGBShiftShader);
  rgbShiftPass.uniforms["amount"].value = 0.0;
  composer.addPass(rgbShiftPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.9, 
    0.1, 
    0.4 
  );
  composer.addPass(bloomPass);

  const bokehPass = new BokehPass(scene, camera,{
    focus: 4.8,      
    aperture: 0.001, 
    maxblur: 0.005  
  });
  composer.addPass(bokehPass);

  const filmPass = new FilmPass(
    0.4,    
    false, 
  );
  composer.addPass(filmPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

}

function adjustCamera(width, height) {
  const aspect = width / height;
  camera.aspect = aspect;

  if (aspect < 1) {
    camera.fov = 85; 
  } else {
    const minAspect = 1.77; 
    const maxAspect = 2.5; 

    if (aspect <= minAspect) {
      camera.fov = 75;
    } else if (aspect >= maxAspect) {
      camera.fov = 55;
    } else {
      const t = (aspect - minAspect) / (maxAspect - minAspect);
      camera.fov = 75 + (55 - 75) * t;
    }
  }
  camera.updateProjectionMatrix(); 
}

function onWindowResize(){
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);

  if(composer) composer.setSize(width, height);

  adjustCamera(width, height);
}

const clock = new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  updateWorld(delta);
  
  composer.render();
}

init();

