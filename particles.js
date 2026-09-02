/* 青岩 · 门户粒子光效 v4
 * 背景图之上，绿蓝交替的粒子沿多条倾斜的椭圆轨道环绕转动（类吸积盘视角），
 * 粒子小而细腻（600 颗），绿蓝色相拉开（118–138 对 210–226）保证对比度，
 * 近处粒子更大更亮、远处更小更暗，配合透明拖尾与中心辉光。
 * 画布本身透明（destination-out 渐隐实现拖尾），不遮挡背景图。
 * 无依赖；页面不可见时暂停；prefers-reduced-motion 时只画静态一帧。
 */
(function () {
  "use strict";

  var canvas = document.getElementById("bg");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, DPR = 1;
  var particles = [];
  var stars = [];
  var sprites = {};          // 色相 → 预渲染光点
  var rafId = 0;
  var running = true;
  var t = 0;                 // 全局时间（秒）

  // 轨道组：radius 相对于屏幕短边；tilt = 纵向压扁比；speed 角速度（弧度/秒）
  var RINGS = [
    { radius: 0.24, tilt: 0.42, speed: 0.16, count: 160, drift: 0.020 },
    { radius: 0.38, tilt: 0.36, speed: -0.11, count: 200, drift: -0.014 },
    { radius: 0.54, tilt: 0.30, speed: 0.075, count: 240, drift: 0.010 }
  ];

  // 绿蓝交替：粒子按序号偶数取绿、奇数取蓝；两组色相拉开距离提高对比度
  var GREENS = [118, 128, 138];
  var BLUES = [210, 218, 226];
  var HUES = GREENS.concat(BLUES);

  function pickHue(i) {
    return i % 2 === 0
      ? GREENS[(Math.random() * GREENS.length) | 0]
      : BLUES[(Math.random() * BLUES.length) | 0];
  }

  function makeSprite(hue) {
    var s = document.createElement("canvas");
    s.width = s.height = 64;
    var g = s.getContext("2d");
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "hsla(" + hue + ", 95%, 88%, 1)");
    grad.addColorStop(0.25, "hsla(" + hue + ", 95%, 65%, 0.85)");
    grad.addColorStop(0.6, "hsla(" + hue + ", 95%, 55%, 0.22)");
    grad.addColorStop(1, "hsla(" + hue + ", 95%, 50%, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return s;
  }

  function buildParticles() {
    particles = [];
    var small = Math.min(W, H) < 700;
    RINGS.forEach(function (ring, ri) {
      var count = small ? Math.round(ring.count * 0.6) : ring.count;
      for (var i = 0; i < count; i++) {
        particles.push({
          ring: ri,
          radius: ring.radius * (0.92 + Math.random() * 0.16), // 半径微散，避免死板圆环
          theta: Math.random() * Math.PI * 2,
          speed: ring.speed * (0.85 + Math.random() * 0.3),
          size: 0.8 + Math.random() * 1.4,
          twinkle: Math.random() * Math.PI * 2,
          hue: pickHue(particles.length)
        });
      }
    });
    // 背景静态星尘（背景图自带细节，数量从简）
    stars = [];
    var starCount = small ? 24 : 56;
    for (var j = 0; j < starCount; j++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        size: 0.6 + Math.random() * 1.4,
        twinkle: Math.random() * Math.PI * 2,
        twSpeed: 0.4 + Math.random() * 1.2,
        hue: pickHue(j)
      });
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildParticles();
    if (reduceMotion) drawFrame(0, true);
  }

  function drawFrame(dt, staticFrame) {
    t += dt;

    // 透明画布上做拖尾：用 destination-out 逐渐擦淡上一帧；静态帧直接全清
    if (staticFrame) {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.fillRect(0, 0, W, H);
    }

    var cx = W / 2;
    var cy = H / 2;
    var minDim = Math.min(W, H);

    // 中心柔和辉光（呼吸；叠加在背景图之上，保持克制）
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.34);
    var glowA = 0.06 + 0.025 * Math.sin(t * 0.8);
    glow.addColorStop(0, "rgba(40, 130, 255, " + glowA.toFixed(3) + ")");
    glow.addColorStop(0.55, "rgba(30, 100, 220, " + (glowA * 0.35).toFixed(3) + ")");
    glow.addColorStop(1, "rgba(0, 0, 40, 0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = glow;
    ctx.fillRect(cx - minDim * 0.34, cy - minDim * 0.34, minDim * 0.68, minDim * 0.68);

    // 星尘
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      var a = 0.10 + 0.16 * (0.5 + 0.5 * Math.sin(t * st.twSpeed + st.twinkle));
      var sp = sprites[st.hue];
      var ss = st.size * 4;
      ctx.globalAlpha = a;
      ctx.drawImage(sp, st.x * W - ss / 2, st.y * H - ss / 2, ss, ss);
    }

    // 轨道粒子：近（下缘）大而亮，远（上缘）小而暗
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var ring = RINGS[p.ring];
      if (!staticFrame) p.theta += p.speed * dt;
      var plane = ring.drift * t; // 轨道面缓慢进动
      var cosP = Math.cos(plane), sinP = Math.sin(plane);
      var ox = Math.cos(p.theta) * p.radius * minDim;
      var oy = Math.sin(p.theta) * p.radius * minDim * ring.tilt;
      var x = cx + ox * cosP - oy * sinP;
      var y = cy + ox * sinP + oy * cosP;

      var depth = 0.5 + 0.5 * Math.sin(p.theta);          // 0 远 → 1 近
      var tw = 0.72 + 0.28 * Math.sin(t * 2.1 + p.twinkle);
      var alpha = (0.22 + 0.78 * depth) * tw;
      var size = p.size * (0.55 + 1.15 * depth) * (minDim / 900 + 0.55);

      ctx.globalAlpha = alpha;
      var sprite = sprites[p.hue];
      var d = size * 4.0;
      ctx.drawImage(sprite, x - d / 2, y - d / 2, d, d);
    }

    ctx.globalAlpha = 1;
  }

  function loop(now) {
    if (!running) return;
    if (!last) last = now;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    drawFrame(dt, false);
    rafId = requestAnimationFrame(loop);
  }
  var last = 0;

  HUES.forEach(function (h) { sprites[h] = makeSprite(h); });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(rafId);
    } else if (!reduceMotion) {
      running = true;
      last = 0;
      rafId = requestAnimationFrame(loop);
    }
  });

  resize();
  if (!reduceMotion) rafId = requestAnimationFrame(loop);
})();
