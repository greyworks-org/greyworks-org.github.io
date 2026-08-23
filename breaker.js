(() => {
  const canvas = document.getElementById("breaker-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const title = document.querySelector("[data-game-title]");
  const status = document.querySelector("[data-game-status]");
  const scoreLabel = document.querySelector("[data-score]");
  const startButton = document.querySelector('[data-game-action="start"]');
  const pauseButton = document.querySelector('[data-game-action="pause"]');
  const restartButton = document.querySelector('[data-game-action="restart"]');
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const W = canvas.width;
  const H = canvas.height;
  const paddle = { x: W / 2 - 58, y: H - 38, width: 116, height: 10, speed: 9 };
  const ball = { x: W / 2, y: H - 60, radius: 7, vx: 4, vy: -4 };
  const brickRows = 5;
  const brickCols = 10;
  const bricks = [];
  let state = "READY";
  let score = 0;
  let lives = 3;
  let animationFrame = 0;
  let pointerTarget = null;

  function setMessage(nextTitle, nextStatus) {
    if (title) title.textContent = nextTitle;
    if (status) status.textContent = nextStatus;
  }

  function updateControls() {
    if (startButton) startButton.hidden = state === "PLAYING" || state === "PAUSED";
    if (pauseButton) {
      pauseButton.hidden = !["PLAYING", "PAUSED"].includes(state);
      pauseButton.textContent = state === "PAUSED" ? "Resume" : "Pause";
    }
    if (restartButton) restartButton.hidden = !["GAME_OVER", "WON"].includes(state);
  }

  function resetBricks() {
    bricks.length = 0;
    for (let row = 0; row < brickRows; row += 1) {
      for (let col = 0; col < brickCols; col += 1) {
        bricks.push({
          x: 34 + col * 89,
          y: 54 + row * 27,
          width: 72,
          height: 15,
          alive: true,
          hue: row % 2 === 0 ? "#6c47ff" : "#8b6dff"
        });
      }
    }
  }

  function resetRound() {
    paddle.x = W / 2 - paddle.width / 2;
    ball.x = W / 2;
    ball.y = H - 60;
    ball.vx = 4;
    ball.vy = -4;
  }

  function begin() {
    state = "READY";
    score = 0;
    lives = 3;
    resetBricks();
    resetRound();
    state = "PLAYING";
    setMessage("Playing.", "Keep the core alive. Three lives.");
    updateControls();
    if (!animationFrame) animationFrame = requestAnimationFrame(loop);
  }

  function pauseOrResume() {
    if (state === "PLAYING") {
      state = "PAUSED";
      setMessage("Paused.", "Resume when you are ready.");
    } else if (state === "PAUSED") {
      state = "PLAYING";
      setMessage("Playing.", "Keep the core alive. Three lives.");
      if (!animationFrame) animationFrame = requestAnimationFrame(loop);
    }
    updateControls();
  }

  function setPaddleFromPointer(clientX) {
    const rect = canvas.getBoundingClientRect();
    pointerTarget = ((clientX - rect.left) / rect.width) * W;
  }

  function movePaddle() {
    if (pointerTarget === null) return;
    paddle.x += (pointerTarget - (paddle.x + paddle.width / 2)) * 0.24;
    paddle.x = Math.max(0, Math.min(W - paddle.width, paddle.x));
  }

  function drawBackground() {
    ctx.fillStyle = "#14142a";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function draw() {
    drawBackground();
    bricks.forEach((brick) => {
      if (!brick.alive) return;
      ctx.fillStyle = brick.hue;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fillRect(brick.x, brick.y, brick.width, 2);
    });
    ctx.fillStyle = "#f0f0f3";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#a78bfa";
    ctx.shadowColor = reduceMotion ? "transparent" : "rgba(167,139,250,0.75)";
    ctx.shadowBlur = reduceMotion ? 0 : 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    if (scoreLabel) scoreLabel.textContent = `SCORE ${String(score).padStart(4, "0")} · LIVES ${lives}`;
  }

  function collide() {
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= W) ball.vx *= -1;
    if (ball.y - ball.radius <= 0) ball.vy *= -1;
    if (ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height && ball.x >= paddle.x && ball.x <= paddle.x + paddle.width && ball.vy > 0) {
      ball.vy = -Math.abs(ball.vy);
      ball.vx += (ball.x - (paddle.x + paddle.width / 2)) * 0.035;
    }
    bricks.forEach((brick) => {
      if (!brick.alive || ball.x + ball.radius < brick.x || ball.x - ball.radius > brick.x + brick.width || ball.y + ball.radius < brick.y || ball.y - ball.radius > brick.y + brick.height) return;
      brick.alive = false;
      ball.vy *= -1;
      score += 10;
    });
  }

  function update() {
    movePaddle();
    ball.x += ball.vx;
    ball.y += ball.vy;
    collide();
    if (ball.y - ball.radius > H) {
      lives -= 1;
      if (lives <= 0) {
        state = "GAME_OVER";
        setMessage("Game over.", "The core went dark. Start a new run.");
      } else {
        resetRound();
        setMessage("Careful.", `${lives} ${lives === 1 ? "life" : "lives"} left.`);
      }
      updateControls();
    }
    if (bricks.every((brick) => !brick.alive)) {
      state = "WON";
      setMessage("You won.", "Clean run. Replay when you want another pass.");
      updateControls();
    }
  }

  function loop() {
    animationFrame = 0;
    if (state === "PLAYING") update();
    draw();
    if (["PLAYING", "PAUSED"].includes(state)) animationFrame = requestAnimationFrame(loop);
  }

  startButton?.addEventListener("click", begin);
  restartButton?.addEventListener("click", begin);
  pauseButton?.addEventListener("click", pauseOrResume);
  canvas.addEventListener("mousemove", (event) => setPaddleFromPointer(event.clientX));
  canvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
    setPaddleFromPointer(event.touches[0].clientX);
  }, { passive: false });
  document.addEventListener("keydown", (event) => {
    if (event.key === " " && ["READY", "IDLE"].includes(state)) begin();
    if (event.key === "p" || event.key === "P") pauseOrResume();
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    pointerTarget = null;
    paddle.x += event.key === "ArrowLeft" ? -paddle.speed : paddle.speed;
    paddle.x = Math.max(0, Math.min(W - paddle.width, paddle.x));
  });

  resetBricks();
  draw();
  updateControls();
})();
