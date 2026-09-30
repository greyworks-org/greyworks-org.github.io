(() => {
  const root = document.querySelector("[data-slingshot]");
  const form = document.getElementById("contact-form");
  const canvas = root?.querySelector("[data-slingshot-canvas]");
  const status = root?.querySelector("[data-slingshot-status]");
  if (!root || !form || !canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 560;
  let height = 120;
  let dpr = 1;
  let progress = 0;
  let startY = 0;
  let dragging = false;
  let sending = false;
  let resetFrame = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    // Track the real CSS box. Clamping the drawing width to a minimum used to
    // stretch the cord horizontally whenever the element was narrower.
    if (rect.width < 1) return;
    width = rect.width;
    height = rect.height || 120;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function setState(state, message) {
    root.dataset.state = state;
    if (status) status.textContent = message;
  }

  const READY_AT = 0.72;

  function draw() {
    if (!ctx) return;

    const centreX = width / 2;
    const armSpan = Math.min(width * 0.34, 132);
    const postTop = 22;
    const postFoot = postTop + 16;
    const restSag = 9;
    const travel = Math.max(height - postFoot - 46, 34);
    const pouchY = postTop + restSag + progress * travel;
    const armed = progress > READY_AT;
    const ink = armed ? "#ff7a59" : "#7a86a8";

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0d1527";
    ctx.fillRect(0, 0, width, height);

    // Frame: two uprights standing on a baseline, so the shape reads as a
    // sling at rest rather than as a slider track.
    ctx.strokeStyle = "rgba(238,242,255,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centreX - armSpan - 10, postFoot);
    ctx.lineTo(centreX + armSpan + 10, postFoot);
    ctx.stroke();

    ctx.strokeStyle = "#ff7a59";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(centreX + side * armSpan, postFoot);
      ctx.lineTo(centreX + side * armSpan, postTop);
      ctx.stroke();
    });

    // Band, drawn through the pouch so it curves as the cord is pulled.
    ctx.strokeStyle = ink;
    ctx.lineWidth = armed ? 2.4 : 1.8;
    ctx.beginPath();
    ctx.moveTo(centreX - armSpan, postTop);
    ctx.quadraticCurveTo(centreX - armSpan * 0.34, pouchY, centreX, pouchY);
    ctx.quadraticCurveTo(centreX + armSpan * 0.34, pouchY, centreX + armSpan, postTop);
    ctx.stroke();

    // The pouch carries a note, not a ball: it is a contact form.
    const noteW = 30;
    const noteH = 21;
    ctx.fillStyle = armed ? "#ff7a59" : "#eef2ff";
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(centreX - noteW / 2, pouchY - noteH / 2, noteW, noteH, 3);
      ctx.fill();
    } else {
      ctx.fillRect(centreX - noteW / 2, pouchY - noteH / 2, noteW, noteH);
    }
    ctx.strokeStyle = "#0a1020";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(centreX - noteW / 2 + 4, pouchY - noteH / 2 + 5);
    ctx.lineTo(centreX, pouchY + 1);
    ctx.lineTo(centreX + noteW / 2 - 4, pouchY - noteH / 2 + 5);
    ctx.stroke();

    ctx.fillStyle = armed ? "#ff7a59" : "#9aa6c6";
    ctx.font = "500 12px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(armed ? "RELEASE TO SEND" : "PULL DOWN TO SEND", centreX, height - 12);
  }

  function setProgress(next) {
    progress = Math.max(0, Math.min(next, 1));
    draw();
  }

  function returnHandle() {
    const from = progress;
    const start = performance.now();
    const duration = reduceMotion ? 0 : 180;
    cancelAnimationFrame(resetFrame);
    const animate = (now) => {
      const amount = duration ? Math.min((now - start) / duration, 1) : 1;
      setProgress(from * (1 - amount));
      if (amount < 1) resetFrame = requestAnimationFrame(animate);
    };
    resetFrame = requestAnimationFrame(animate);
  }

  function begin(event) {
    if (sending || root.dataset.state === "sent") return;
    dragging = true;
    startY = event.clientY;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture?.(event.pointerId);
    setState("ready", "Keep pulling, then release.");
    event.preventDefault();
  }

  function move(event) {
    if (!dragging) return;
    const stretch = Math.max(0, event.clientY - startY);
    setProgress(stretch / Math.max(height * 0.6, 56));
    event.preventDefault();
  }

  function release(event) {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("is-dragging");
    if (progress < READY_AT) {
      setState("idle", "Not quite. Pull a little further.");
      returnHandle();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      setState("error", "Fill the required fields before sending.");
      returnHandle();
      return;
    }

    sending = true;
    setState("sending", "Sending your note...");
    form.requestSubmit();
    event.preventDefault();
  }

  canvas.addEventListener("pointerdown", begin);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      setState("error", "Fill the required fields before sending.");
      return;
    }
    setState("sending", "Sending your note...");
    sending = true;
    form.requestSubmit();
  });

  window.addEventListener("greyworks:contact-result", (event) => {
    const ok = event.detail?.ok;
    sending = false;
    if (ok) {
      setProgress(0);
      setState("sent", "Sent. We will reply soon.");
    } else {
      setState("error", "The note stayed here. Check the message above and try again.");
      returnHandle();
    }
  });

  form.addEventListener("input", () => {
    if (root.dataset.state !== "sent") return;
    setProgress(0);
    setState("idle", "Ready for another note.");
  });

  new ResizeObserver(resize).observe(canvas);
  canvas.tabIndex = 0;
  resize();
})();
