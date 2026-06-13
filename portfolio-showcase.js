/**
 * Greyworks Portfolio 3D Showcase
 * Rotating geometric shapes representing app/web surfaces.
 * Scroll-activated: only initializes when the section scrolls into view.
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    const stage = document.getElementById('portfolio-showcase');
    if (!stage) return;

    if (reduceMotion) {
      stage.classList.add('is-static');
      return;
    }

    // Lazy-init: wait until the showcase scrolls near the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          loadThree().then(() => initShowcase(stage)).catch(() => {
            stage.classList.add('is-static');
          });
        });
      },
      { threshold: 0.05, rootMargin: '200px 0px' }
    );

    observer.observe(stage);
  }

  let threeLoadPromise;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeLoadPromise) return threeLoadPromise;

    threeLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => {
        if (window.THREE) resolve(window.THREE);
        else reject(new Error('THREE failed to load.'));
      };
      script.onerror = () => reject(new Error('Unable to load THREE.'));
      document.head.appendChild(script);
    });

    return threeLoadPromise;
  }

  function initShowcase(stage) {
    const THREE = window.THREE;
    const canvasHost = stage.querySelector('[data-showcase-canvas]');
    if (!canvasHost) return;

    // ── Scene setup ──────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x171a1e, 0.018);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
    camera.position.set(0, 1.2, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    canvasHost.appendChild(renderer.domElement);

    // ── Lighting ─────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xf6f4ef, 0.4));
    const key = new THREE.DirectionalLight(0xf5f7fa, 0.9);
    key.position.set(5, 6, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d2dd, 0.5);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    // ── Floor / subtle base grid ─────────────────────────────
    const gridHelper = new THREE.PolarGridHelper(12, 32, 20, 64, 0x3a3f45, 0x2b3036);
    gridHelper.position.y = -4.5;
    scene.add(gridHelper);

    // ── Portfolio items: geometric shapes ────────────────────
    const items = [];
    const geometries = [
      { geo: new THREE.BoxGeometry(1.5, 0.9, 0.16), color: 0xe8e2d8, label: 'Websites' },
      { geo: new THREE.BoxGeometry(0.75, 1.4, 0.12), color: 0xd4cdc4, label: 'Mobile Apps' },
      { geo: new THREE.CylinderGeometry(0.55, 0.55, 1.5, 6), color: 0xbeb8b0, label: 'App Surfaces' },
      { geo: new THREE.SphereGeometry(0.6, 24, 24), color: 0xc8c2b8, label: 'Support Flows' },
      { geo: new THREE.TorusGeometry(0.58, 0.14, 16, 32), color: 0xdcd6cc, label: 'Store Pages' },
      { geo: new THREE.BoxGeometry(1.1, 0.55, 0.65), color: 0xa49e96, label: 'Landing Pages' },
      { geo: new THREE.ConeGeometry(0.52, 1.3, 5), color: 0x938d84, label: 'Product Polish' },
      { geo: new THREE.OctahedronGeometry(0.54), color: 0xbab4aa, label: 'Release Layer' },
    ];

    geometries.forEach((def, i) => {
      const angle = (i / geometries.length) * Math.PI * 2;
      const radius = 3.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 2.2;

      const material = new THREE.MeshPhysicalMaterial({
        color: def.color,
        metalness: 0.22,
        roughness: 0.24,
        clearcoat: 0.12,
        clearcoatRoughness: 0.2,
        transparent: true,
        opacity: 0.88,
      });

      const mesh = new THREE.Mesh(def.geo, material);
      mesh.position.set(x, y, z);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 0.5
      );
      mesh.userData = {
        baseX: x,
        baseY: y,
        baseZ: z,
        rotSpeed: 0.3 + Math.random() * 0.7,
        floatSpeed: 0.4 + Math.random() * 0.6,
        floatAmp: 0.15 + Math.random() * 0.35,
        floatOffset: Math.random() * Math.PI * 2,
        label: def.label,
      };
      scene.add(mesh);
      items.push(mesh);
    });

    // ── Subtle particle ring ─────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(4.6, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8a8480, transparent: true, opacity: 0.3 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.5;
    scene.add(ring);

    // ── Labels ────────────────────────────────────────────────
    const labelsContainer = stage.querySelector('[data-showcase-labels]');
    let labelElements = [];

    function createLabels() {
      if (!labelsContainer) return;
      labelsContainer.innerHTML = '';
      labelElements = [];
      geometries.forEach((def) => {
        const span = document.createElement('span');
        span.className = 'showcase-label';
        span.textContent = def.label;
        labelsContainer.appendChild(span);
        labelElements.push(span);
      });
      // Show labels after a short delay
      setTimeout(() => {
        labelElements.forEach((el, i) => {
          setTimeout(() => el.classList.add('is-visible'), i * 80);
        });
      }, 400);
    }
    createLabels();

    // ── Mouse interaction ─────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    stage.addEventListener('mouseleave', () => {
      targetMouseX = 0;
      targetMouseY = 0;
    });

    // Touch support
    stage.addEventListener('touchmove', (e) => {
      const rect = stage.getBoundingClientRect();
      const touch = e.touches[0];
      targetMouseX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseY = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }, { passive: true });

    stage.addEventListener('touchend', () => {
      targetMouseX = 0;
      targetMouseY = 0;
    });

    // ── Resize ────────────────────────────────────────────────
    function resize() {
      const rect = stage.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', resize);
    // Also observe the stage size changes
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => resize());
      ro.observe(stage);
    }
    resize();

    // ── Animation loop ────────────────────────────────────────
    let time = 0;
    let isVisible = false;

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.01 }
    );
    visibilityObserver.observe(stage);

    function animate() {
      requestAnimationFrame(animate);

      if (!isVisible) return;

      time += 0.008;

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Rotate items and float them
      items.forEach((mesh, i) => {
        const ud = mesh.userData;
        // Self rotation
        mesh.rotation.x += ud.rotSpeed * 0.004;
        mesh.rotation.y += ud.rotSpeed * 0.006;
        mesh.rotation.z += ud.rotSpeed * 0.002;

        // Float
        const floatY = Math.sin(time * ud.floatSpeed + ud.floatOffset) * ud.floatAmp;
        mesh.position.y = ud.baseY + floatY;

        // Subtle orbit with mouse parallax
        const orbitAngle = (i / items.length) * Math.PI * 2 + time * 0.15;
        const orbitRadius = 3.6 + mouseY * 0.6;
        mesh.position.x = Math.cos(orbitAngle) * orbitRadius;
        mesh.position.z = Math.sin(orbitAngle) * orbitRadius;
      });

      // Rotate ring
      ring.rotation.z += 0.001;
      ring.scale.setScalar(1 + Math.sin(time * 0.8) * 0.04);

      // Camera sway
      camera.position.x = mouseX * 1.4;
      camera.position.y = 1.2 + mouseY * 0.6;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    animate();
    console.log('[Portfolio 3D] Showcase initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
