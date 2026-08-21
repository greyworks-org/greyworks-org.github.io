document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const homeStage = document.getElementById("landing-game");
  const contactStage = document.getElementById("contact-transmission");

  if (!homeStage && !contactStage) return;

  const shouldInitHome = Boolean(homeStage) && !reduceMotion;
  const shouldInitContact = Boolean(contactStage);

  if (homeStage && reduceMotion) {
    homeStage.classList.add("is-static");
  }

  if (!shouldInitHome && !shouldInitContact) {
    contactStage?.classList.add("is-static");
    return;
  }

  loadThree()
    .then(() => {
      if (shouldInitHome) initLandingGame(homeStage);
      if (shouldInitContact) initContactTransmission(contactStage, { reduceMotion });
    })
    .catch(() => {
      homeStage?.classList.add("is-static");
      contactStage?.classList.add("is-static");
    });
});

let threePromise;

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threePromise) return threePromise;

  threePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    script.onload = () => {
      if (window.THREE) resolve(window.THREE);
      else reject(new Error("THREE failed to load."));
    };
    script.onerror = () => reject(new Error("Unable to load THREE."));
    document.head.appendChild(script);
  });

  return threePromise;
}

function openMailtoDraft(draft) {
  const subject = draft.subject || `Greyworks enquiry from ${draft.name}`;

  const body = [
    "Hello Greyworks,",
    "",
    draft.message || "",
    "",
    "Contact details",
    `Name: ${draft.name}`,
    `Reply-To Email: ${draft.email}`,
    `Subject: ${draft.subject || "Not specified"}`,
    "",
    "Sent from greyworks.org/contact/"
  ]
    .join("\n")
    .slice(0, 1400);

  window.location.href =
    `mailto:contact@greyworks.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function initLandingGame(root) {
  const THREE = window.THREE;
  const canvasHost = root.querySelector("[data-canvas]");
  const scoreEl = root.querySelector("[data-score]");
  const overlay = root.querySelector("[data-overlay]");
  const popup = root.querySelector("[data-popup]");
  const popupEmoji = root.querySelector("[data-popup-emoji]");
  const popupMessage = root.querySelector("[data-popup-message]");

  const config = {
    gravity: 0.012,
    jumpForce: 0.34,
    platformCount: 34,
    shardCount: 72
  };

  let scene;
  let camera;
  let renderer;
  let glassMaterial;
  let player;
  let highestY = 0;
  let score = 0;
  let time = 0;
  let targetX = 0;
  let isDead = false;
  let canSkip = false;
  let popupTimeout;
  let visible = true;

  const platforms = [];
  const shards = [];
  const backgroundLights = [];

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x171a1e, 0.03);

  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
  camera.position.set(0, 5, 18);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  canvasHost.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xf6f4ef, 0.42));
  const dirLight = new THREE.DirectionalLight(0xf5f7fa, 0.85);
  dirLight.position.set(4, 10, 8);
  scene.add(dirLight);

  const lightColors = [0xc8d2dd, 0xa4afb8, 0xf0f2f4, 0x77808a];
  for (let index = 0; index < 5; index += 1) {
    const light = new THREE.PointLight(lightColors[index % lightColors.length], 1.2, 26);
    light.position.set((Math.random() - 0.5) * 18, Math.random() * 50, -8);
    light.userData.offsetY = Math.random() * 100;
    scene.add(light);
    backgroundLights.push(light);
  }

  glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf1f3f5,
    metalness: 0.18,
    roughness: 0.18,
    transmission: 0.82,
    transparent: true,
    opacity: 0.85,
    thickness: 0.6,
    side: THREE.DoubleSide
  });

  player = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 28, 28),
    new THREE.MeshStandardMaterial({
      color: 0xd8dde2,
      metalness: 1,
      roughness: 0.2,
      emissive: 0x111315
    })
  );
  player.position.set(0, 5, 0);
  player.userData.velocityY = 0;
  scene.add(player);

  const platformGeometry = new THREE.BoxGeometry(1, 0.24, 1.5);
  for (let index = 0; index < config.platformCount; index += 1) {
    const platform = new THREE.Mesh(platformGeometry, glassMaterial);
    resetPlatform(platform, index * 2.5);
    scene.add(platform);
    platforms.push(platform);
  }

  const shardGeometry = new THREE.TetrahedronGeometry(0.24);
  for (let index = 0; index < config.shardCount; index += 1) {
    const shard = new THREE.Mesh(shardGeometry, glassMaterial);
    shard.visible = false;
    shard.userData = { velocityX: 0, velocityY: 0, velocityZ: 0, spinX: 0, spinY: 0 };
    scene.add(shard);
    shards.push(shard);
  }

  const resize = () => {
    const width = Math.max(canvasHost.clientWidth, 1);
    const height = Math.max(canvasHost.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  resize();

  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(root);
  window.addEventListener("resize", resize);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.12 }
    );
    observer.observe(root);
  }

  const setTargetX = (clientX) => {
    const rect = canvasHost.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    targetX = relativeX * 2 - 1;
  };

  root.addEventListener("pointermove", (event) => {
    if (isDead) return;
    setTargetX(event.clientX);
  });

  root.addEventListener("pointerdown", (event) => {
    if (isDead && canSkip) {
      if (event.target.closest("a")) return;
      clearTimeout(popupTimeout);
      resetGame();
      return;
    }

    setTargetX(event.clientX);
  });

  function resetPlatform(platform, yPosition) {
    platform.visible = true;
    const width = 2.2 + Math.random() * 3.2;
    const spread = Math.min(10 + highestY * 0.05, 20);
    platform.scale.set(width, 1, 1);
    platform.position.set((Math.random() - 0.5) * spread, yPosition, 0);
    platform.rotation.z = (Math.random() - 0.5) * 0.08;
    platform.userData.broken = false;
    platform.userData.width = width;
  }

  function triggerShatter(x, y) {
    let activated = 0;
    for (const shard of shards) {
      if (shard.visible) continue;
      shard.visible = true;
      shard.position.set(x + (Math.random() - 0.5), y, (Math.random() - 0.5));
      shard.userData.velocityX = (Math.random() - 0.5) * 0.24;
      shard.userData.velocityY = Math.random() * 0.18 + 0.1;
      shard.userData.velocityZ = (Math.random() - 0.5) * 0.24;
      shard.userData.spinX = (Math.random() - 0.5) * 0.35;
      shard.userData.spinY = (Math.random() - 0.5) * 0.35;
      activated += 1;
      if (activated > 10) break;
    }
  }

  function showPopup() {
    if (score < 250) {
      popupEmoji.textContent = "🫠";
      popupMessage.innerHTML = "C'mon, you didn't even try yet!";
    } else if (score < 500) {
      popupEmoji.textContent = "😉";
      popupMessage.innerHTML = "Not bad, but we've seen better.";
    } else if (score < 1500) {
      popupEmoji.textContent = "😉";
      popupMessage.innerHTML = "Impressive, wanna check out our website as well?";
    } else {
      popupEmoji.textContent = "😔";
      popupMessage.innerHTML =
        "Hey man, stop it! If you need someone we are here for you :(<br><br><a href=\"/contact/\">let's talk</a>";
    }

    popup.classList.add("is-visible");
    popup.style.pointerEvents = "auto";
    overlay.style.opacity = "1";
    canSkip = true;

    popupTimeout = window.setTimeout(() => {
      if (canSkip) resetGame();
    }, 4000);
  }

  function gameOver() {
    if (isDead) return;
    isDead = true;
    canSkip = false;
    popup.classList.remove("is-visible");
    popup.style.pointerEvents = "none";
    overlay.style.transition = "opacity 0.6s ease-in-out";
    window.setTimeout(showPopup, 400);
  }

  function resetGame() {
    canSkip = false;
    popup.classList.remove("is-visible");
    popup.style.pointerEvents = "none";
    overlay.style.opacity = "0";

    highestY = 0;
    score = 0;
    scoreEl.textContent = "0000";
    player.position.set(0, 5, 0);
    player.userData.velocityY = 0;
    camera.position.y = 5;

    platforms.forEach((platform, index) => resetPlatform(platform, index * 2.5));
    shards.forEach((shard) => {
      shard.visible = false;
    });

    window.setTimeout(() => {
      isDead = false;
    }, 120);
  }

  function animate() {
    window.requestAnimationFrame(animate);

    if (document.hidden || !visible) return;

    time += 0.016;

    if (isDead) {
      backgroundLights.forEach((light, index) => {
        light.position.x += Math.sin(time + index) * 0.01;
      });
      renderer.render(scene, camera);
      return;
    }

    const horizontalBounds = 7.5 + camera.position.y * 0.04;
    player.position.x += ((targetX * horizontalBounds) - player.position.x) * 0.14;
    player.userData.velocityY -= config.gravity;
    player.position.y += player.userData.velocityY;

    if (player.position.y > highestY) {
      highestY = player.position.y;
      score = Math.floor(highestY * 10);
      scoreEl.textContent = score.toString().padStart(4, "0");
    }

    camera.position.y += (Math.max(5, highestY + 2) - camera.position.y) * 0.1;

    if (player.position.y < camera.position.y - 11) {
      gameOver();
      return;
    }

    platforms.forEach((platform) => {
      if (platform.position.y < camera.position.y - 14) {
        const maxY = Math.max(highestY, ...platforms.map((item) => item.position.y));
        resetPlatform(platform, maxY + 2 + Math.random() * 1.5);
      }

      if (!platform.userData.broken && player.userData.velocityY < 0) {
        const deltaX = player.position.x - platform.position.x;
        const deltaY = player.position.y - platform.position.y;
        if (
          Math.abs(deltaX) < platform.userData.width / 2 + 0.3 &&
          Math.abs(deltaY) < 0.48 &&
          deltaY > 0
        ) {
          player.userData.velocityY = config.jumpForce;
          platform.visible = false;
          platform.userData.broken = true;
          triggerShatter(platform.position.x, platform.position.y);
          player.material.emissiveIntensity = 0.9;
        }
      }

      if (!platform.userData.broken) {
        platform.position.y += Math.sin(time * 3 + platform.position.x) * 0.004;
      }
    });

    if (player.material.emissiveIntensity > 0) {
      player.material.emissiveIntensity -= 0.05;
    }

    shards.forEach((shard) => {
      if (!shard.visible) return;
      shard.userData.velocityY -= config.gravity * 1.5;
      shard.position.x += shard.userData.velocityX;
      shard.position.y += shard.userData.velocityY;
      shard.position.z += shard.userData.velocityZ;
      shard.rotation.x += shard.userData.spinX;
      shard.rotation.y += shard.userData.spinY;

      if (shard.position.y < camera.position.y - 15) {
        shard.visible = false;
      }
    });

    backgroundLights.forEach((light, index) => {
      light.position.y = camera.position.y * 0.8 + Math.sin(time * 0.45 + light.userData.offsetY) * 9;
      light.position.x += Math.sin(time + index) * 0.01;
    });

    renderer.render(scene, camera);
  }

  animate();
}

function initContactTransmission(root, { reduceMotion = false } = {}) {
  const THREE = window.THREE;
  const canvasHost = root.querySelector("[data-canvas]");
  const scale = root.querySelector(".transmission-scale");
  const scaleFill = root.querySelector("[data-scale-fill]");
  const scalePointer = root.querySelector("[data-scale-pointer]");
  const instructions = root.querySelector("[data-instructions]");
  const hiddenInput = root.querySelector("[data-hidden-input]");
  const setup = root.querySelector("[data-setup]");
  const setupForm = root.querySelector("[data-setup-form]");
  const setupError = root.querySelector("[data-setup-error]");
  const success = root.querySelector("[data-success]");
  const resetButton = root.querySelector("[data-reset]");
  const nameInput = setupForm.querySelector("[data-name]");
  const emailInput = setupForm.querySelector("[data-email]");
  const subjectInput = setupForm.querySelector("[data-subject]");

  const width = 5.1;
  const height = 7.83;
  const xSegments = 18;
  const ySegments = 32;
  const damping = 0.05;
  const timeStep = 0.018;

  let scene;
  let camera;
  let renderer;
  let geometry;
  let paperMesh;
  let canvas2D;
  let ctx;
  let texture;
  let tetherLines;
  let tetherGeometry;
  let time = 0;
  let paperScale = 1;
  let draggedParticle = null;
  let dragStartY = 0;
  let audioCtx = null;

  let particles = [];
  let constraints = [];
  const sparks = [];

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  const stageState = {
    appState: "SETUP",
    name: "",
    email: "",
    subject: "",
    message: ""
  };

  class Particle {
    constructor(x, y, z) {
      this.pos = new THREE.Vector3(x, y, z);
      this.prev = new THREE.Vector3(x, y, z);
      this.orig = new THREE.Vector3(x, y, z);
      this.acceleration = new THREE.Vector3(0, 0, 0);
      this.isPinned = false;
    }

    integrate(squaredTime) {
      if (this.isPinned) return;
      const next = new THREE.Vector3().subVectors(this.pos, this.prev);
      next.multiplyScalar(1 - damping).add(this.pos).addScaledVector(this.acceleration, squaredTime);
      this.prev.copy(this.pos);
      this.pos.copy(next);
      this.acceleration.set(0, 0, 0);
    }
  }

  function setPointerFromEvent(event) {
    const rect = canvasHost.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function setScale(percent) {
    scaleFill.style.height = `${percent * 100}%`;
    scalePointer.style.bottom = `${percent * 100}%`;
    scalePointer.setAttribute("data-percent", `${Math.floor(percent * 100)}%`);
  }

  function getDraft() {
    return {
      name: stageState.name,
      email: stageState.email,
      subject: stageState.subject,
      message: hiddenInput.value.trim()
    };
  }

  function focusComposer() {
    window.setTimeout(() => {
      hiddenInput.focus({ preventScroll: true });
    }, 40);
  }

  function getAudioContext() {
    if (audioCtx) return audioCtx;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioCtx = new AudioContextCtor();
    return audioCtx;
  }

  function playWooshSound() {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") context.resume();

    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const bufferSize = context.sampleRate * 0.5;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < bufferSize; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(100, context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, context.currentTime + 0.1);
    filter.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.4);

    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    noise.start();
    noise.stop(context.currentTime + 0.5);
  }

  function initPhysics() {
    particles = [];
    constraints = [];
    paperScale = 1;
    geometry = new THREE.PlaneGeometry(width, height, xSegments, ySegments);
    const positions = geometry.attributes.position;
    const cellX = width / xSegments;
    const cellY = height / ySegments;
    const indexFor = (u, v) => v * (xSegments + 1) + u;

    for (let index = 0; index < positions.count; index += 1) {
      particles.push(new Particle(positions.getX(index), positions.getY(index), positions.getZ(index)));
    }

    for (let u = 0; u <= xSegments; u += 1) {
      particles[indexFor(u, 0)].isPinned = true;
    }

    for (let v = 0; v <= ySegments; v += 1) {
      for (let u = 0; u <= xSegments; u += 1) {
        if (u < xSegments) constraints.push([indexFor(u, v), indexFor(u + 1, v), cellX]);
        if (v < ySegments) constraints.push([indexFor(u, v), indexFor(u, v + 1), cellY]);
        if (u < xSegments && v < ySegments) {
          const diagonal = Math.sqrt(cellX * cellX + cellY * cellY);
          constraints.push([indexFor(u, v), indexFor(u + 1, v + 1), diagonal]);
          constraints.push([indexFor(u + 1, v), indexFor(u, v + 1), diagonal]);
        }
      }
    }
  }

  function satisfyConstraints() {
    const diff = new THREE.Vector3();

    for (let index = 0; index < constraints.length; index += 1) {
      const [firstIndex, secondIndex, distance] = constraints[index];
      const first = particles[firstIndex];
      const second = particles[secondIndex];
      diff.subVectors(second.pos, first.pos);
      const current = diff.length();
      if (current === 0) continue;

      const correction = diff.multiplyScalar(1 - (distance * paperScale) / current);

      if (!first.isPinned && !second.isPinned) {
        first.pos.addScaledVector(correction, 0.5);
        second.pos.addScaledVector(correction, -0.5);
      } else if (!first.isPinned) {
        first.pos.add(correction);
      } else if (!second.isPinned) {
        second.pos.sub(correction);
      }
    }
  }

  function initCanvas() {
    canvas2D = document.createElement("canvas");
    canvas2D.width = 512;
    canvas2D.height = 1024;
    ctx = canvas2D.getContext("2d");
    texture = new THREE.CanvasTexture(canvas2D);
    texture.anisotropy = 16;
    updateCanvas();
  }

  function updateCanvas() {
    ctx.fillStyle = "#fcfcfc";
    ctx.fillRect(0, 0, 512, 1024);
    ctx.fillStyle = "#f0f0f0";

    for (let x = 0; x < 512; x += 20) ctx.fillRect(x, 0, 1, 1024);
    for (let y = 0; y < 1024; y += 20) ctx.fillRect(0, y, 512, 1);

    ctx.fillStyle = "#111";
    ctx.font = "bold 30px Courier New";
    ctx.fillText("GREYWORKS // CONTACT DRAFT", 40, 70);
    ctx.font = "20px Courier New";
    ctx.fillText(`NAME: ${stageState.name || "---"}`, 40, 120);
    ctx.fillText(`EMAIL: ${stageState.email || "---"}`, 40, 150);
    ctx.fillText(`SUBJECT: ${stageState.subject || "---"}`, 40, 180);
    ctx.fillText("-------------------------", 40, 210);
    const composedText = hiddenInput.value;
    const shouldShowPlaceholder = stageState.appState === "COMPOSE" && !composedText.trim();

    if (shouldShowPlaceholder) {
      const placeholder = "Type your message. Pull downward to charge.";
      const words = placeholder.split(" ");
      const lines = [];
      let line = "";

      ctx.fillStyle = "#5f6670";
      ctx.font = "600 26px Manrope";
      ctx.textAlign = "center";

      for (let index = 0; index < words.length; index += 1) {
        const word = words[index];
        const testLine = line ? `${line} ${word}` : word;

        if (ctx.measureText(testLine).width > 388) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }

      if (line) lines.push(line);

      let y = 316;
      lines.forEach((entry) => {
        ctx.fillText(entry, 256, y);
        y += 34;
      });

      ctx.textAlign = "left";
      ctx.fillStyle = "#111";
      ctx.font = "26px Courier New";
    } else {
      ctx.font = "26px Courier New";
      const characters = composedText.split("");
      let line = "";
      let y = 260;

      for (let index = 0; index < characters.length; index += 1) {
        const character = characters[index];
        if (character === "\n") {
          ctx.fillText(line, 40, y);
          line = "";
          y += 32;
          continue;
        }

        const testLine = line + character;
        if (ctx.measureText(testLine).width > 430) {
          ctx.fillText(line, 40, y);
          line = character;
          y += 32;
        } else {
          line = testLine;
        }
      }

      ctx.fillText(
        line + ((time * 60) % 60 > 30 && stageState.appState === "COMPOSE" ? "_" : ""),
        40,
        y
      );
    }

    texture.needsUpdate = true;
  }

  function clearDrag() {
    if (!draggedParticle) return;
    draggedParticle.isPinned = false;
    draggedParticle = null;
    dragStartY = 0;
    root.classList.remove("is-pulling");
  }

  function findDraggedParticle(point) {
    let candidate = null;
    let minDistance = Number.POSITIVE_INFINITY;

    particles.forEach((particle) => {
      const distance = particle.pos.distanceTo(point);
      if (distance < minDistance) {
        minDistance = distance;
        candidate = particle;
      }
    });

    if (!candidate) return null;
    if (candidate.orig.y >= height / 2 - 0.2) return null;
    return candidate;
  }

  function startDrafting() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value.trim();

    if (!name || !email || !subject) {
      setupError.textContent = "Complete all fields to initialize the link.";
      return;
    }

    if (!emailInput.checkValidity()) {
      setupError.textContent = "Enter a valid reply-to email.";
      return;
    }

    stageState.name = name;
    stageState.email = email;
    stageState.subject = subject;
    stageState.message = "";
    hiddenInput.value = "";
    setupError.textContent = "";
    stageState.appState = "COMPOSE";
    setup.classList.add("is-hidden");
    success.classList.remove("is-visible");
    resetButton.classList.remove("is-visible");
    root.classList.add("is-armed");
    scale.style.opacity = "1";
    instructions.style.opacity = "1";
    instructions.textContent = "Type your message. Pull downward to charge.";
    instructions.classList.remove("ready");
    scalePointer.style.transform = "translateY(50%)";
    camera.position.set(0, -0.45, 13.4);
    updateCanvas();
    focusComposer();
  }

  function triggerSend() {
    if (stageState.appState !== "COMPOSE") return;

    stageState.appState = "SENT";
    stageState.message = hiddenInput.value;
    clearDrag();
    hiddenInput.blur();
    root.classList.remove("is-armed");
    playWooshSound();
    openMailtoDraft(getDraft());

    particles.forEach((particle) => {
      particle.isPinned = false;
    });

    tetherLines.material.opacity = 0;
    sparks.forEach((spark) => {
      spark.visible = true;
      spark.position.set((Math.random() - 0.5) * 4, -5 + Math.random() * 2, 0);
      spark.userData.velocityY = -0.5 - Math.random() * 0.5;
      spark.userData.velocityX = (Math.random() - 0.5) * 0.2;
      spark.scale.set(1, 1, 1);
    });

    instructions.style.opacity = "0";
    scale.style.opacity = "0";
    scalePointer.style.transform = "translateY(50%)";

    window.setTimeout(() => {
      success.classList.add("is-visible");
      resetButton.classList.add("is-visible");
    }, reduceMotion ? 300 : 1000);
  }

  function resetApp() {
    stageState.appState = "SETUP";
    stageState.name = "";
    stageState.email = "";
    stageState.subject = "";
    stageState.message = "";
    hiddenInput.value = "";
    setupForm.reset();
    setupError.textContent = "";
    success.classList.remove("is-visible");
    resetButton.classList.remove("is-visible");
    setup.classList.remove("is-hidden");
    root.classList.remove("is-armed", "is-pulling");
    instructions.style.opacity = "1";
    instructions.textContent = "Type your message. Pull downward to charge.";
    instructions.classList.remove("ready");
    scale.style.opacity = "1";
    setScale(0);
    scalePointer.style.transform = "translateY(50%)";
    camera.position.set(0, -0.45, 15.8);
    paperScale = 1;
    clearDrag();
    initPhysics();
    paperMesh.geometry.dispose();
    paperMesh.geometry = geometry;
    sparks.forEach((spark) => {
      spark.visible = false;
      spark.scale.set(1, 1, 1);
    });
    updateCanvas();
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, -0.45, 15.8);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  canvasHost.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 8);
  scene.add(directionalLight);

  initPhysics();
  initCanvas();

  paperMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      roughness: 0.9
    })
  );
  scene.add(paperMesh);

  tetherGeometry = new THREE.BufferGeometry();
  tetherLines = new THREE.Line(
    tetherGeometry,
    new THREE.LineBasicMaterial({
      color: 0xf2f4f6,
      transparent: true,
      opacity: 0
    })
  );
  scene.add(tetherLines);

  for (let index = 0; index < 30; index += 1) {
    const spark = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.5, 0.05),
      new THREE.MeshBasicMaterial({
        color: 0xf2f4f6,
        transparent: true,
        opacity: 0.8
      })
    );
    spark.visible = false;
    spark.userData = { velocityY: 0, velocityX: 0 };
    scene.add(spark);
    sparks.push(spark);
  }

  const resize = () => {
    const widthPx = Math.max(canvasHost.clientWidth, 1);
    const heightPx = Math.max(canvasHost.clientHeight, 1);
    camera.aspect = widthPx / heightPx;
    camera.updateProjectionMatrix();
    renderer.setSize(widthPx, heightPx, false);
  };

  resize();

  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(root);
  window.addEventListener("resize", resize);

  setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startDrafting();
  });

  hiddenInput.addEventListener("input", () => {
    stageState.message = hiddenInput.value;
    updateCanvas();
  });

  resetButton.addEventListener("click", resetApp);

  root.addEventListener("pointerdown", (event) => {
    if (stageState.appState !== "COMPOSE") return;

    focusComposer();
    setPointerFromEvent(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(paperMesh);

    if (!hits.length) return;

    const candidate = findDraggedParticle(hits[0].point);
    if (!candidate) return;

    draggedParticle = candidate;
    dragStartY = draggedParticle.pos.y;
    draggedParticle.isPinned = true;
    dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), draggedParticle.pos);
    root.classList.add("is-pulling");

    if (event.cancelable) {
      event.preventDefault();
    }
  });

  window.addEventListener("pointermove", (event) => {
    if (!draggedParticle || stageState.appState !== "COMPOSE") return;

    setPointerFromEvent(event);
    raycaster.setFromCamera(pointer, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, target);

    if (target.distanceTo(draggedParticle.orig) < 12) {
      draggedParticle.pos.copy(target);
    }

    if (event.cancelable) {
      event.preventDefault();
    }
  });

  window.addEventListener("pointerup", () => {
    if (!draggedParticle || stageState.appState !== "COMPOSE") return;

    const stretch = Math.max(0, dragStartY - draggedParticle.pos.y);
    const tensionValue = Math.min(stretch / 6, 1);

    if (tensionValue >= 0.7) {
      triggerSend();
      return;
    }

    clearDrag();
  });

  function animate() {
    window.requestAnimationFrame(animate);
    time += timeStep;
    updateCanvas();

    const gravity = new THREE.Vector3(0, -2, 0);
    let tension = 0;

    if (stageState.appState === "COMPOSE" && draggedParticle) {
      const stretch = Math.max(0, dragStartY - draggedParticle.pos.y);
      tension = Math.min(stretch / 6, 1);
      tetherLines.material.opacity = tension * 0.8 + 0.2;
      tetherGeometry.setFromPoints([
        new THREE.Vector3(-width / 2, height / 2, 0),
        draggedParticle.pos.clone(),
        new THREE.Vector3(width / 2, height / 2, 0)
      ]);

      if (tension >= 0.7) {
        instructions.textContent = "RELEASE TO LAUNCH";
        instructions.classList.add("ready");
        scalePointer.style.transform = `translateY(50%) translateX(${(Math.random() - 0.5) * 2}px)`;
      } else {
        instructions.textContent = "Type your message. Pull downward to charge.";
        instructions.classList.remove("ready");
        scalePointer.style.transform = "translateY(50%)";
      }

      if (tension > 0.7 && !reduceMotion) {
        const shake = (tension - 0.7) * 0.3;
        camera.position.x = (Math.random() - 0.5) * shake;
        camera.position.y = -0.45 + (Math.random() - 0.5) * shake;
      }
    } else if (stageState.appState === "COMPOSE") {
      tetherLines.material.opacity = 0;
      camera.position.x += (0 - camera.position.x) * 0.2;
      camera.position.y += (-0.45 - camera.position.y) * 0.2;
      instructions.textContent = "Type your message. Pull downward to charge.";
      instructions.classList.remove("ready");
      scalePointer.style.transform = "translateY(50%)";
    } else {
      tetherLines.material.opacity = 0;
      scalePointer.style.transform = "translateY(50%)";
    }

    setScale(tension);

    if (stageState.appState === "SENT") {
      gravity.set(0, 35, 0);
      if (paperScale > 0.15) {
        paperScale -= 0.05;
        particles.forEach((particle) => {
          particle.acceleration.x += (Math.random() - 0.5) * 40;
          particle.acceleration.z += (Math.random() - 0.5) * 40;
          particle.acceleration.y += (Math.random() - 0.5) * 40;
        });
      }

      sparks.forEach((spark) => {
        if (!spark.visible) return;
        spark.position.y += spark.userData.velocityY;
        spark.position.x += spark.userData.velocityX;
        spark.scale.y *= 0.9;
        if (spark.position.y < -15) spark.visible = false;
      });
    }

    particles.forEach((particle) => {
      if (particle.isPinned) return;
      particle.acceleration.addScaledVector(gravity, 10);
      if (stageState.appState !== "SENT") {
        particle.acceleration.addScaledVector(
          new THREE.Vector3(Math.sin(particle.pos.y * 1.5 + time * 2) * 2, 0, 0),
          2
        );
      }
      particle.integrate(timeStep * timeStep);
    });

    for (let index = 0; index < 4; index += 1) {
      satisfyConstraints();
    }

    const positionAttribute = geometry.attributes.position;
    particles.forEach((particle, index) => {
      positionAttribute.setXYZ(index, particle.pos.x, particle.pos.y, particle.pos.z);
    });
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    renderer.render(scene, camera);
  }

  animate();
}
