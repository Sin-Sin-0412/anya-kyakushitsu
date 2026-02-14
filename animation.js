import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import ScrollTrigger from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js";
gsap.registerPlugin(ScrollTrigger);

let audioContext, audioBuffer, sourceNode, gainNode;

export function initScrollAnimations() {
  ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize"
  });

    window.addEventListener("resize", () => {
    ScrollTrigger.refresh();
  });

  let mm = gsap.matchMedia();
  
  const filterElement = document.querySelector("#mist-filter feDisplacementMap");
  const MIST_SCALE_MAX = 50;

  gsap.to("#turbulence", {
    duration: 5,
    attr: { seed: 100 },
    repeat: -1,
    ease: "none"
  });

  const updateMist = (progress) => {
    const currentScale = MIST_SCALE_MAX * (1 - progress);
    if (filterElement) filterElement.setAttribute("scale", currentScale);
  };

  const fadeIntoMist = (progress) => {
    const currentScale = 50 * progress;
    if (filterElement) filterElement.setAttribute("scale", currentScale);
  };


  mm.add("(min-width: 1025px)", () => {
    const menuItems = document.querySelectorAll(".menu-top ul li");
    const setActiveMenu = (index) => {
      menuItems.forEach((item, i) =>
        item.classList.toggle("is-active", i === index)
      );
    };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#ui-wrapper",
        start: "top top",
        end: "+=3000",
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true, 
        onLeaveBack: () => setActiveMenu(0),
      },
    });

    setActiveMenu(0);

    tl.to({}, { duration: 0.5 })
      .to(".s1", {
        opacity: 1,
        duration: 1,
        onUpdate: function () { updateMist(this.progress()); },
        onStart: () => setActiveMenu(1),
        onReverseComplete: () => setActiveMenu(0),
      })
      .to(".s1", {
        opacity: 0,
        duration: 1,
        onUpdate: function () { fadeIntoMist(this.progress()); },
        pointerEvents: "none",
      }, "+=0.3")
      .to(".s2", {
        opacity: 1,
        y: 0,
        duration: 1,
        onUpdate: function () { updateMist(this.progress()); },
        onStart: () => setActiveMenu(2),
        onReverseComplete: () => setActiveMenu(1),
      })
      .to(".s2", {
        opacity: 0,
        duration: 1,
        onUpdate: function () { fadeIntoMist(this.progress()); },
        pointerEvents: "none",
      }, "+=0.3")
      .to(".s3", {
        opacity: 1,
        duration: 1,
        onUpdate: function () { updateMist(this.progress()); },
        onStart: () => setActiveMenu(3),
        onReverseComplete: () => setActiveMenu(2),
      });
  });

  
  mm.add("(max-width: 1024px)", () => {
    if (filterElement) filterElement.setAttribute("scale", 0);

    const sections = [".s1", ".s2", ".s3"];

    sections.forEach((selector) => {
      gsap.fromTo(
        selector,
        { opacity: 0 },
        {
          opacity: 1,
          scrollTrigger: {
            trigger: selector,
            start: "top 70%", 
            end: "bottom center",
            scrub: 1,
          },
        }
      );
    });
  });

  window.scrollTo(0, 0);

  const toTop = document.querySelector(".toTop");
  if (toTop) {
    toTop.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  loadSound('audio/oto3.ogg');

  const soundBtn = document.getElementById('sound-control');
  if (soundBtn) {
    const soundText = soundBtn.querySelector('.sound-text');
    soundBtn.addEventListener('click', async () => {
      if (!sourceNode) {
        await playLoop();
        if (soundText) soundText.textContent = "OFF";
      } else {
        stopLoop();
        if (soundText) soundText.textContent = "ON";
      }
    });
  }
}

async function loadSound(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (e) { console.error("Sound load error", e); }
}

async function playLoop() {
  if (!audioBuffer) return;
  if (audioContext.state === 'suspended') await audioContext.resume();

  sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.loop = true;

  gainNode = audioContext.createGain();
  sourceNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 1.5); 
  sourceNode.start(0);
}

function stopLoop() {
  if (sourceNode && gainNode) {
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
    setTimeout(() => {
      if (sourceNode) {
        sourceNode.stop();
        sourceNode = null;
      }
    }, 1000);
  }
}