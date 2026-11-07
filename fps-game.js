(() => {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ui = document.getElementById('ui');
    const $ = (id) => document.getElementById(id);
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });
    const mapCanvas = $('minimapCanvas');
    const mapCtx = mapCanvas.getContext('2d');

    const ARENA = 18;
    const PLAYER_RADIUS = 0.38;
    const MAGAZINE_SIZE = 25;
    const YAW_SENSITIVITY = 0.0023;
    const PITCH_SENSITIVITY = 0.0021;
    const keys = new Set();
    const obstacles = [];
    const enemies = [];
    const effects = [];
    const staticVertices = [];
    let dynamicVertices = [];
    let staticCount = 0;
    let phase = 'menu';
    let hasHadPointerLock = false;
    let pointerLocked = false;
    let showMap = true;
    let previousFrame = 0;
    let lastShot = 0;
    let reloadTimer = 0;
    let toastTimer = 0;
    let bannerTimer = 0;
    let waveTimer = 0;
    let sessionId = 0;
    let mouseDown = false;
    let dragAim = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const player = {
        x: 0, z: 10, yaw: 0, pitch: 0, health: 100,
        magazine: MAGAZINE_SIZE, reserve: 75, score: 0, kills: 0, wave: 1,
        shots: 0, hits: 0, jumpY: 0, jumpVelocity: 0, bob: 0,
        damageCooldown: 0, elapsed: 0
    };

    const COLLIDERS = [
        { x: -6.3, z: -4.1, w: 2.6, d: 2.1, h: 1.45, color: '#25303a' },
        { x: 5.1, z: -5.9, w: 2.4, d: 2.0, h: 1.2, color: '#27313b' },
        { x: -2.1, z: -10.1, w: 1.8, d: 1.8, h: 1.8, color: '#202a34' },
        { x: 7.7, z: 2.4, w: 2.7, d: 1.8, h: 1.35, color: '#2b3039' },
        { x: -7.2, z: 5.0, w: 2.1, d: 2.6, h: 1.6, color: '#2b3039' },
        { x: 1.8, z: 6.7, w: 2.0, d: 1.8, h: 1.15, color: '#26333a' },
        { x: 10.2, z: -11.0, w: 2.6, d: 2.0, h: 2.2, color: '#222d38' },
        { x: -10.7, z: -8.4, w: 1.8, d: 2.7, h: 1.5, color: '#2a2f39' },
        { x: -12.0, z: 1.2, w: 1.4, d: 1.4, h: 2.7, color: '#27323a' },
        { x: 12.4, z: 7.2, w: 1.6, d: 1.6, h: 2.5, color: '#27323a' }
    ];

    if (!gl) {
        $('statusLabel').textContent = 'WEBGL NOT AVAILABLE';
        $('startBtn').disabled = true;
        $('startBtn').querySelector('span').textContent = 'WEBGL REQUIRED';
        return;
    }

    const vertexSource = `
        attribute vec3 aPosition;
        attribute vec3 aColor;
        uniform mat4 uProjection;
        uniform mat4 uView;
        varying vec3 vColor;
        varying float vFog;
        void main() {
            vec4 eye = uView * vec4(aPosition, 1.0);
            gl_Position = uProjection * eye;
            vColor = aColor;
            vFog = clamp((length(eye.xyz) - 20.0) / 28.0, 0.0, 0.82);
        }
    `;
    const fragmentSource = `
        precision mediump float;
        varying vec3 vColor;
        varying float vFog;
        void main() {
            vec3 fog = vec3(0.028, 0.043, 0.063);
            gl_FragColor = vec4(mix(vColor, fog, vFog), 1.0);
        }
    `;

    function makeShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
    }

    function makeProgram() {
        const program = gl.createProgram();
        gl.attachShader(program, makeShader(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, makeShader(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        return program;
    }

    let program;
    try {
        program = makeProgram();
    } catch (error) {
        console.error('Could not initialize the arena renderer:', error);
        $('statusLabel').textContent = 'RENDERER INITIALIZATION FAILED';
        $('startBtn').disabled = true;
        $('startBtn').querySelector('span').textContent = 'RELOAD TO RETRY';
        return;
    }

    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const colorLocation = gl.getAttribLocation(program, 'aColor');
    const projectionLocation = gl.getUniformLocation(program, 'uProjection');
    const viewLocation = gl.getUniformLocation(program, 'uView');
    const staticBuffer = gl.createBuffer();
    const dynamicBuffer = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0.025, 0.039, 0.058, 1);

    function colorRgb(value) {
        if (Array.isArray(value)) return value;
        const hex = value.replace('#', '');
        const number = parseInt(hex, 16);
        return [(number >> 16 & 255) / 255, (number >> 8 & 255) / 255, (number & 255) / 255];
    }

    function pushTriangle(target, a, b, c, color, shade = 1) {
        const rgb = colorRgb(color);
        for (const point of [a, b, c]) target.push(point[0], point[1], point[2], rgb[0] * shade, rgb[1] * shade, rgb[2] * shade);
    }

    function transformLocal(point, center, rotation) {
        const c = Math.cos(rotation), s = Math.sin(rotation);
        return [center[0] + point[0] * c + point[2] * s, center[1] + point[1], center[2] - point[0] * s + point[2] * c];
    }

    function addBox(target, center, size, color, rotation = 0) {
        const [w, h, d] = size.map((part) => part / 2);
        const points = [
            [-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d],
            [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d]
        ].map((point) => transformLocal(point, center, rotation));
        const faces = [
            [0, 1, 2, 3, .72], [5, 4, 7, 6, 1.0], [4, 0, 3, 7, .82],
            [1, 5, 6, 2, .88], [3, 2, 6, 7, 1.13], [4, 5, 1, 0, .58]
        ];
        for (const [a, b, c, dIndex, shade] of faces) {
            pushTriangle(target, points[a], points[b], points[c], color, shade);
            pushTriangle(target, points[a], points[c], points[dIndex], color, shade);
        }
    }

    function addSphere(target, center, radius, color, segments = 8, rings = 5) {
        for (let ring = 0; ring < rings; ring++) {
            const a0 = Math.PI * ring / rings;
            const a1 = Math.PI * (ring + 1) / rings;
            for (let segment = 0; segment < segments; segment++) {
                const b0 = Math.PI * 2 * segment / segments;
                const b1 = Math.PI * 2 * (segment + 1) / segments;
                const point = (a, b) => [center[0] + radius * Math.sin(a) * Math.cos(b), center[1] + radius * Math.cos(a), center[2] + radius * Math.sin(a) * Math.sin(b)];
                const p00 = point(a0, b0), p01 = point(a0, b1), p10 = point(a1, b0), p11 = point(a1, b1);
                pushTriangle(target, p00, p10, p11, color, .92 + .12 * Math.cos(b0));
                pushTriangle(target, p00, p11, p01, color, .92 + .12 * Math.cos(b0));
            }
        }
    }

    function addStaticBox(center, size, color, rotation = 0) { addBox(staticVertices, center, size, color, rotation); }

    function buildArena() {
        addStaticBox([0, -.28, 0], [36, .56, 36], '#111a23');
        for (let i = -17; i <= 17; i += 2) {
            addStaticBox([i, .009, 0], [.018, .012, 35.5], i % 4 === 1 ? '#28434a' : '#202d39');
            addStaticBox([0, .009, i], [35.5, .012, .018], i % 4 === 1 ? '#28434a' : '#202d39');
        }
        for (let i = -16; i <= 16; i += 4) {
            addStaticBox([i, .015, -17.3], [.08, .025, .72], '#d07c62');
            addStaticBox([i, .015, 17.3], [.08, .025, .72], '#d07c62');
            addStaticBox([-17.3, .015, i], [.72, .025, .08], '#d07c62');
            addStaticBox([17.3, .015, i], [.72, .025, .08], '#d07c62');
        }

        // Low neon rings mark the arena's center lane.
        for (const side of [-1, 1]) {
            addStaticBox([0, .025, side * 3.8], [8.4, .035, .045], '#3d817a');
            addStaticBox([side * 4.2, .025, 0], [.045, .035, 7.6], '#3d817a');
        }
        addStaticBox([0, .025, 0], [1.1, .025, .08], '#c78165');
        addStaticBox([0, .025, 0], [.08, .025, 1.1], '#c78165');

        // Arena walls and inset light strips.
        addStaticBox([0, 1.35, -18], [36, 2.7, .5], '#202832');
        addStaticBox([0, 2.48, -17.72], [35.6, .045, .035], '#587973');
        addStaticBox([0, 1.35, 18], [36, 2.7, .5], '#202832');
        addStaticBox([0, 2.48, 17.72], [35.6, .045, .035], '#73584e');
        addStaticBox([-18, 1.35, 0], [.5, 2.7, 36], '#202832');
        addStaticBox([-17.72, 2.48, 0], [.035, .045, 35.6], '#587973');
        addStaticBox([18, 1.35, 0], [.5, 2.7, 36], '#202832');
        addStaticBox([17.72, 2.48, 0], [.035, .045, 35.6], '#73584e');

        for (const obstacle of COLLIDERS) {
            obstacles.push(obstacle);
            const center = [obstacle.x, obstacle.h / 2, obstacle.z];
            addStaticBox(center, [obstacle.w, obstacle.h, obstacle.d], obstacle.color);
            addStaticBox([obstacle.x, obstacle.h + .035, obstacle.z], [obstacle.w + .05, .07, obstacle.d + .05], '#45555d');
            addStaticBox([obstacle.x, .045, obstacle.z], [obstacle.w + .12, .09, obstacle.d + .12], '#303e47');
            if (obstacle.w > 2.3) addStaticBox([obstacle.x, obstacle.h - .18, obstacle.z - obstacle.d / 2 - .012], [obstacle.w * .6, .045, .025], '#d58b68');
        }

        // Corner pylons, elevated lights, and a distant low skyline make the room read at a glance.
        for (const x of [-15.8, 15.8]) for (const z of [-15.8, 15.8]) {
            addStaticBox([x, 2.0, z], [.68, 4, .68], '#27323c');
            addStaticBox([x, 3.25, z], [.82, .1, .82], '#de9474');
            addStaticBox([x, .12, z], [1.1, .24, 1.1], '#39434b');
        }
        for (let i = 0; i < 8; i++) {
            const x = -13.5 + i * 3.85;
            const height = 3.6 + (i % 3) * .7;
            addStaticBox([x, height / 2, -17.25], [1.35, height, .38], i % 2 ? '#263540' : '#28313c');
            addStaticBox([x, height - .28, -17.02], [.42, .06, .025], i % 2 ? '#5a9990' : '#ce8065');
            addStaticBox([x, height / 2, 17.25], [1.35, height, .38], i % 2 ? '#28313c' : '#263540');
        }

        staticCount = staticVertices.length / 6;
        gl.bindBuffer(gl.ARRAY_BUFFER, staticBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(staticVertices), gl.STATIC_DRAW);
        staticVertices.length = 0;
    }

    function perspective(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ]);
    }

    function lookAt(eye, direction) {
        let zx = -direction[0], zy = -direction[1], zz = -direction[2];
        const zl = Math.hypot(zx, zy, zz) || 1;
        zx /= zl; zy /= zl; zz /= zl;
        let xx = zz, xy = 0, xz = -zx;
        const xl = Math.hypot(xx, xy, xz) || 1;
        xx /= xl; xy /= xl; xz /= xl;
        const yx = zy * xz - zz * xy;
        const yy = zz * xx - zx * xz;
        const yz = zx * xy - zy * xx;
        return new Float32Array([
            xx, yx, zx, 0,
            xy, yy, zy, 0,
            xz, yz, zz, 0,
            -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
            -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
            -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1
        ]);
    }

    function forwardVector() {
        const horizontal = Math.cos(player.pitch);
        return [Math.sin(player.yaw) * horizontal, Math.sin(player.pitch), -Math.cos(player.yaw) * horizontal];
    }

    function syncHud() {
        $('healthValue').textContent = String(Math.ceil(player.health)).padStart(3, '0');
        $('healthFill').style.width = `${Math.max(0, player.health)}%`;
        $('healthFill').classList.toggle('low', player.health <= 30);
        $('ammoValue').innerHTML = `${String(player.magazine).padStart(2, '0')} <small>/ ${String(player.reserve).padStart(3, '0')}</small>`;
        $('killsValue').textContent = String(player.kills).padStart(2, '0');
        $('scoreValue').textContent = String(player.score).padStart(4, '0');
        $('waveValue').textContent = String(player.wave).padStart(2, '0');
    }

    function showToast(message, duration = 1350) {
        const toast = $('toast');
        toast.textContent = message;
        toast.classList.add('show');
        toastTimer = duration;
    }

    function showWaveBanner(title, subtext) {
        $('bannerWave').textContent = String(player.wave).padStart(2, '0');
        $('waveSubtext').textContent = subtext;
        $('waveBanner').querySelector('span').firstChild.textContent = title;
        $('waveBanner').classList.add('show');
        bannerTimer = 2200;
    }

    function spawnWave() {
        const count = Math.min(3 + player.wave, 10);
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i / count) + Math.random() * .45;
            const radius = 12 + Math.random() * 3;
            let x = Math.cos(angle) * radius;
            let z = Math.sin(angle) * radius;
            for (let attempt = 0; attempt < 5 && blockedAt(x, z, .65); attempt++) {
                x = (Math.random() * 2 - 1) * 14;
                z = (Math.random() * 2 - 1) * 14;
            }
            enemies.push({
                x, z, hp: 100, maxHp: 100, speed: 1.0 + Math.min(player.wave, 8) * .055 + Math.random() * .22,
                attackCooldown: .4 + Math.random() * .8, flash: 0, phase: Math.random() * Math.PI * 2, alive: true
            });
        }
        showWaveBanner('WAVE ', 'HOSTILES INBOUND');
        $('statusLabel').textContent = 'ARENA LIVE / HOSTILES ACTIVE';
        syncHud();
    }

    function resetRun() {
        sessionId++;
        clearTimeout(waveTimer);
        enemies.length = 0;
        effects.length = 0;
        player.x = 0; player.z = 10; player.yaw = 0; player.pitch = 0;
        player.health = 100; player.magazine = MAGAZINE_SIZE; player.reserve = 75;
        player.score = 0; player.kills = 0; player.wave = 1; player.shots = 0; player.hits = 0;
        player.jumpY = 0; player.jumpVelocity = 0; player.bob = 0; player.damageCooldown = 0; player.elapsed = 0;
        reloadTimer = 0;
        phase = 'playing';
        ui.classList.remove('menu-mode');
        $('startScreen').classList.add('hidden');
        $('pauseScreen').classList.add('hidden');
        $('gameOverScreen').classList.add('hidden');
        $('statusLabel').textContent = 'ARENA LIVE / ESTABLISHING UPLINK';
        syncHud();
        spawnWave();
        canvas.focus?.();
        requestLock();
    }

    function startRun() { resetRun(); }

    function pauseRun() {
        if (phase !== 'playing') return;
        phase = 'paused';
        mouseDown = false;
        $('pauseScreen').classList.remove('hidden');
        $('statusLabel').textContent = 'SIMULATION PAUSED';
        if (document.pointerLockElement === canvas) document.exitPointerLock();
    }

    function resumeRun() {
        if (phase !== 'paused') return;
        phase = 'playing';
        $('pauseScreen').classList.add('hidden');
        $('statusLabel').textContent = 'ARENA LIVE / HOSTILES ACTIVE';
        requestLock();
    }

    function requestLock() {
        if (!canvas.requestPointerLock) return;
        const result = canvas.requestPointerLock();
        if (result && typeof result.catch === 'function') {
            result.catch(() => showToast('MOUSE LOCK UNAVAILABLE  /  CLICK AND DRAG TO AIM', 3000));
        }
    }

    function returnToMenu() {
        phase = 'menu';
        clearTimeout(waveTimer);
        enemies.length = 0;
        ui.classList.add('menu-mode');
        $('pauseScreen').classList.add('hidden');
        $('gameOverScreen').classList.add('hidden');
        $('startScreen').classList.remove('hidden');
        $('statusLabel').textContent = 'SIMULATION STANDBY';
        if (document.pointerLockElement === canvas) document.exitPointerLock();
    }

    function gameOver() {
        if (phase !== 'playing') return;
        phase = 'gameover';
        $('statusLabel').textContent = 'CONNECTION TERMINATED';
        $('finalScore').textContent = String(player.score).padStart(4, '0');
        $('finalWave').textContent = String(player.wave).padStart(2, '0');
        $('finalKills').textContent = String(player.kills).padStart(2, '0');
        $('finalAccuracy').textContent = `${player.shots ? Math.round(player.hits / player.shots * 100) : 0}%`;
        $('gameOverScreen').classList.remove('hidden');
        if (document.pointerLockElement === canvas) document.exitPointerLock();
    }

    function blockedAt(x, z, radius = PLAYER_RADIUS) {
        if (x < -ARENA + radius || x > ARENA - radius || z < -ARENA + radius || z > ARENA - radius) return true;
        return obstacles.some((box) => x > box.x - box.w / 2 - radius && x < box.x + box.w / 2 + radius && z > box.z - box.d / 2 - radius && z < box.z + box.d / 2 + radius);
    }

    function canOccupy(x, z, radius = PLAYER_RADIUS) { return !blockedAt(x, z, radius); }

    function updatePlayer(dt) {
        const forward = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
        const side = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
        const magnitude = Math.hypot(forward, side) || 1;
        const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 8.1 : 5.45;
        const f = forward / magnitude, s = side / magnitude;
        const dx = (Math.sin(player.yaw) * f + Math.cos(player.yaw) * s) * speed * dt;
        const dz = (-Math.cos(player.yaw) * f + Math.sin(player.yaw) * s) * speed * dt;
        if (canOccupy(player.x + dx, player.z)) player.x += dx;
        if (canOccupy(player.x, player.z + dz)) player.z += dz;
        if (forward || side) player.bob += dt * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 13 : 9);

        if (player.jumpY > 0 || player.jumpVelocity > 0) {
            player.jumpVelocity -= 17 * dt;
            player.jumpY += player.jumpVelocity * dt;
            if (player.jumpY <= 0) { player.jumpY = 0; player.jumpVelocity = 0; }
        }
    }

    function updateEnemies(dt) {
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            enemy.flash = Math.max(0, enemy.flash - dt * 3.8);
            enemy.phase += dt * 4;
            const dx = player.x - enemy.x;
            const dz = player.z - enemy.z;
            const distance = Math.hypot(dx, dz) || .001;
            if (distance > 1.5) {
                const speed = enemy.speed * (distance < 2.5 ? .55 : 1);
                const nx = enemy.x + dx / distance * speed * dt;
                const nz = enemy.z + dz / distance * speed * dt;
                if (canOccupy(nx, enemy.z, .38)) enemy.x = nx;
                else if (canOccupy(enemy.x + dz / distance * speed * dt, enemy.z, .38)) enemy.x += dz / distance * speed * dt;
                if (canOccupy(enemy.x, nz, .38)) enemy.z = nz;
                else if (canOccupy(enemy.x, enemy.z - dx / distance * speed * dt, .38)) enemy.z -= dx / distance * speed * dt;
            }
            enemy.attackCooldown -= dt;
            if (distance < 1.75 && enemy.attackCooldown <= 0 && player.damageCooldown <= 0) {
                player.health = Math.max(0, player.health - (8 + Math.min(5, player.wave * .45)));
                player.damageCooldown = .62;
                enemy.attackCooldown = 1.05;
                $('damageFlash').classList.remove('active');
                void $('damageFlash').offsetWidth;
                $('damageFlash').classList.add('active');
                syncHud();
                if (player.health <= 0) gameOver();
            }
        }
        player.damageCooldown = Math.max(0, player.damageCooldown - dt);
        for (let i = enemies.length - 1; i >= 0; i--) if (!enemies[i].alive) enemies.splice(i, 1);
        if (phase === 'playing' && enemies.length === 0 && waveTimer === 0) {
            showToast('WAVE CLEARED  /  +10 VITALS', 1450);
            player.health = Math.min(100, player.health + 10);
            player.reserve = Math.min(120, player.reserve + 8);
            player.wave++;
            syncHud();
            const currentSession = sessionId;
            waveTimer = window.setTimeout(() => {
                waveTimer = 0;
                if (phase === 'playing' && currentSession === sessionId) spawnWave();
            }, 1850);
        }
    }

    function raySphereDistance(origin, direction, center, radius) {
        const ox = origin[0] - center[0], oy = origin[1] - center[1], oz = origin[2] - center[2];
        const b = ox * direction[0] + oy * direction[1] + oz * direction[2];
        const c = ox * ox + oy * oy + oz * oz - radius * radius;
        const discriminant = b * b - c;
        if (discriminant < 0) return Infinity;
        const near = -b - Math.sqrt(discriminant);
        return near > .12 ? near : (-b + Math.sqrt(discriminant) > .12 ? -b + Math.sqrt(discriminant) : Infinity);
    }

    function rayBoxDistance(origin, direction, box) {
        const min = [box.x - box.w / 2, 0, box.z - box.d / 2];
        const max = [box.x + box.w / 2, box.h, box.z + box.d / 2];
        let near = -Infinity, far = Infinity;
        for (let axis = 0; axis < 3; axis++) {
            if (Math.abs(direction[axis]) < 0.00001) {
                if (origin[axis] < min[axis] || origin[axis] > max[axis]) return Infinity;
                continue;
            }
            let a = (min[axis] - origin[axis]) / direction[axis];
            let b = (max[axis] - origin[axis]) / direction[axis];
            if (a > b) [a, b] = [b, a];
            near = Math.max(near, a);
            far = Math.min(far, b);
            if (near > far) return Infinity;
        }
        return far > .1 ? Math.max(near, 0) : Infinity;
    }

    function shoot() {
        if (phase !== 'playing' || reloadTimer > 0) return;
        const now = performance.now();
        if (now - lastShot < 108) return;
        lastShot = now;
        if (player.magazine <= 0) { showToast(player.reserve ? 'PRESS R TO RELOAD' : 'OUT OF AMMO'); return; }
        player.magazine--;
        player.shots++;
        syncHud();
        $('weapon').classList.remove('firing');
        $('crosshair').classList.remove('firing');
        $('muzzleFlash').classList.remove('active');
        void $('weapon').offsetWidth;
        $('weapon').classList.add('firing');
        $('crosshair').classList.add('firing');
        $('muzzleFlash').classList.add('active');
        window.setTimeout(() => {
            $('weapon').classList.remove('firing');
            $('crosshair').classList.remove('firing');
        }, 100);

        const direction = forwardVector();
        const origin = [player.x, 1.58 + player.jumpY, player.z];
        let target = null, bestHit = Infinity, headshot = false;
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const headDistance = raySphereDistance(origin, direction, [enemy.x, 1.6 + Math.sin(enemy.phase) * .04, enemy.z], .34);
            const bodyDistance = raySphereDistance(origin, direction, [enemy.x, .95 + Math.sin(enemy.phase) * .035, enemy.z], .56);
            const candidate = Math.min(headDistance, bodyDistance);
            if (candidate < bestHit) { bestHit = candidate; target = enemy; headshot = headDistance < bodyDistance; }
        }
        const nearestCover = obstacles.reduce((nearest, box) => Math.min(nearest, rayBoxDistance(origin, direction, box)), Infinity);
        const nearestWall = [
            rayBoxDistance(origin, direction, { x: 0, z: -18, w: 36, d: .5, h: 2.7 }),
            rayBoxDistance(origin, direction, { x: 0, z: 18, w: 36, d: .5, h: 2.7 }),
            rayBoxDistance(origin, direction, { x: -18, z: 0, w: .5, d: 36, h: 2.7 }),
            rayBoxDistance(origin, direction, { x: 18, z: 0, w: .5, d: 36, h: 2.7 })
        ].reduce((a, b) => Math.min(a, b), Infinity);

        if (target && bestHit < 40 && bestHit < nearestCover && bestHit < nearestWall) {
            target.hp -= headshot ? 100 : 34;
            target.flash = 1;
            player.hits++;
            const point = [origin[0] + direction[0] * bestHit, origin[1] + direction[1] * bestHit, origin[2] + direction[2] * bestHit];
            effects.push({ x: point[0], y: point[1], z: point[2], life: .15, color: '#ffd29f' });
            $('hitMarker').classList.remove('show');
            $('crosshair').classList.add('hit');
            void $('hitMarker').offsetWidth;
            $('hitMarker').classList.add('show');
            window.setTimeout(() => $('crosshair').classList.remove('hit'), 110);
            if (target.hp <= 0) {
                target.alive = false;
                player.kills++;
                player.score += headshot ? 175 : 100;
                showToast(headshot ? 'HOSTILE DOWN  /  HEADSHOT +175' : 'HOSTILE DOWN  /  +100', 900);
                syncHud();
            }
        }
    }

    function reload() {
        if (phase !== 'playing' || reloadTimer > 0 || player.magazine >= MAGAZINE_SIZE || player.reserve <= 0) return;
        reloadTimer = 1.35;
        $('weapon').classList.remove('reloading');
        void $('weapon').offsetWidth;
        $('weapon').classList.add('reloading');
        showToast('RELOADING SIDEARM', 950);
        window.setTimeout(() => $('weapon').classList.remove('reloading'), 1300);
    }

    function update(dt) {
        if (phase !== 'playing') return;
        player.elapsed += dt;
        if (reloadTimer > 0) {
            reloadTimer -= dt;
            if (reloadTimer <= 0) {
                const amount = Math.min(MAGAZINE_SIZE - player.magazine, player.reserve);
                player.magazine += amount;
                player.reserve -= amount;
                syncHud();
            }
        }
        updatePlayer(dt);
        updateEnemies(dt);
        for (let i = effects.length - 1; i >= 0; i--) {
            effects[i].life -= dt;
            if (effects[i].life <= 0) effects.splice(i, 1);
        }
        if (mouseDown) shoot();
    }

    function buildEnemyGeometry(enemy, target) {
        const facing = Math.atan2(player.x - enemy.x, player.z - enemy.z);
        const bob = Math.sin(enemy.phase) * .035;
        const body = enemy.flash > 0 ? '#ffd7b8' : '#a9544d';
        const shell = enemy.flash > 0 ? '#fff0d8' : '#37323a';
        const light = enemy.flash > 0 ? '#fff8d8' : '#ff9a70';
        addBox(target, [enemy.x, .98 + bob, enemy.z], [.67, .86, .44], body, facing);
        addBox(target, [enemy.x, 1.49 + bob, enemy.z], [.46, .43, .43], shell, facing);
        addSphere(target, [enemy.x + Math.sin(facing) * .222, 1.53 + bob, enemy.z - Math.cos(facing) * .222], .075, light, 7, 4);
        addBox(target, [enemy.x, .53 + bob, enemy.z], [.54, .16, .5], '#222b31', facing);
        const sideX = Math.cos(facing) * .49, sideZ = Math.sin(facing) * .49;
        addBox(target, [enemy.x - sideX, 1.05 + bob, enemy.z - sideZ], [.22, .6, .24], shell, facing);
        addBox(target, [enemy.x + sideX, 1.05 + bob, enemy.z + sideZ], [.22, .6, .24], shell, facing);
        addBox(target, [enemy.x, 1.13 + bob, enemy.z], [.76, .075, .49], light, facing);
        addBox(target, [enemy.x - Math.sin(facing) * .36, .2 + bob, enemy.z + Math.cos(facing) * .36], [.2, .4, .27], '#232d34', facing);
        addBox(target, [enemy.x + Math.sin(facing) * .36, .2 + bob, enemy.z - Math.cos(facing) * .36], [.2, .4, .27], '#232d34', facing);
    }

    function renderMinimap() {
        const w = mapCanvas.width, h = mapCanvas.height;
        const scale = w / (ARENA * 2);
        mapCtx.clearRect(0, 0, w, h);
        mapCtx.fillStyle = 'rgba(10, 17, 24, .94)';
        mapCtx.fillRect(0, 0, w, h);
        mapCtx.strokeStyle = 'rgba(124, 159, 165, .17)';
        mapCtx.lineWidth = 1;
        for (let i = -16; i <= 16; i += 4) {
            const px = w / 2 + i * scale;
            const py = h / 2 + i * scale;
            mapCtx.beginPath(); mapCtx.moveTo(px, 0); mapCtx.lineTo(px, h); mapCtx.stroke();
            mapCtx.beginPath(); mapCtx.moveTo(0, py); mapCtx.lineTo(w, py); mapCtx.stroke();
        }
        for (const box of obstacles) {
            mapCtx.fillStyle = 'rgba(116, 139, 147, .52)';
            mapCtx.fillRect(w / 2 + (box.x - box.w / 2) * scale, h / 2 + (box.z - box.d / 2) * scale, box.w * scale, box.d * scale);
        }
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const x = w / 2 + enemy.x * scale, y = h / 2 + enemy.z * scale;
            mapCtx.beginPath(); mapCtx.arc(x, y, 3, 0, Math.PI * 2); mapCtx.fillStyle = '#ff9670'; mapCtx.shadowColor = '#ff9670'; mapCtx.shadowBlur = 7; mapCtx.fill(); mapCtx.shadowBlur = 0;
        }
        const px = w / 2 + player.x * scale, py = h / 2 + player.z * scale;
        mapCtx.save(); mapCtx.translate(px, py); mapCtx.rotate(player.yaw);
        mapCtx.beginPath(); mapCtx.moveTo(0, -7); mapCtx.lineTo(5, 5); mapCtx.lineTo(0, 3); mapCtx.lineTo(-5, 5); mapCtx.closePath();
        mapCtx.fillStyle = '#8ce2cb'; mapCtx.shadowColor = '#8ce2cb'; mapCtx.shadowBlur = 8; mapCtx.fill(); mapCtx.restore();
    }

    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
        const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        gl.viewport(0, 0, width, height);
    }

    function bindAttributes(buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(colorLocation);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 24, 12);
    }

    function uploadDynamicGeometry(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, dynamicBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(colorLocation);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 24, 12);
    }

    function draw(now) {
        const dt = Math.min(.04, Math.max(0, (now - previousFrame) / 1000 || 0));
        previousFrame = now;
        if (phase === 'playing') update(dt);
        if (toastTimer > 0) { toastTimer -= dt * 1000; if (toastTimer <= 0) $('toast').classList.remove('show'); }
        if (bannerTimer > 0) { bannerTimer -= dt * 1000; if (bannerTimer <= 0) $('waveBanner').classList.remove('show'); }

        resize();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);
        const eyeBob = (phase === 'playing' ? Math.sin(player.bob) * .025 : 0);
        const eye = [player.x, 1.58 + player.jumpY + eyeBob, player.z];
        const direction = forwardVector();
        gl.uniformMatrix4fv(projectionLocation, false, perspective(73 * Math.PI / 180, canvas.width / canvas.height, .1, 85));
        gl.uniformMatrix4fv(viewLocation, false, lookAt(eye, direction));
        bindAttributes(staticBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, staticCount);

        dynamicVertices = [];
        for (const enemy of enemies) if (enemy.alive) buildEnemyGeometry(enemy, dynamicVertices);
        for (const effect of effects) addSphere(dynamicVertices, [effect.x, effect.y, effect.z], .06 + (1 - effect.life / .15) * .14, effect.color, 6, 3);
        if (dynamicVertices.length) {
            const data = new Float32Array(dynamicVertices);
            uploadDynamicGeometry(data);
            gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
        }
        renderMinimap();
        requestAnimationFrame(draw);
    }

    function applyPointerDelta(dx, dy) {
        player.yaw += dx * YAW_SENSITIVITY;
        player.pitch = Math.max(-1.15, Math.min(1.15, player.pitch - dy * PITCH_SENSITIVITY));
    }

    function onMouseMove(event) {
        if (pointerLocked) {
            applyPointerDelta(event.movementX || 0, event.movementY || 0);
        } else if (dragAim && phase === 'playing') {
            applyPointerDelta(event.clientX - lastPointerX, event.clientY - lastPointerY);
            lastPointerX = event.clientX; lastPointerY = event.clientY;
        }
    }

    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === canvas;
        if (pointerLocked) hasHadPointerLock = true;
        if (!pointerLocked && hasHadPointerLock && phase === 'playing') pauseRun();
    });
    document.addEventListener('pointerlockerror', () => showToast('MOUSE LOCK UNAVAILABLE  /  CLICK AND DRAG TO AIM', 3000));
    document.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', (event) => {
        if (event.button !== 0 || phase !== 'playing') return;
        mouseDown = true;
        dragAim = !pointerLocked;
        lastPointerX = event.clientX; lastPointerY = event.clientY;
        shoot();
    });
    window.addEventListener('mouseup', () => { mouseDown = false; dragAim = false; });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    window.addEventListener('blur', () => { mouseDown = false; dragAim = false; if (phase === 'playing' && pointerLocked) pauseRun(); });

    document.addEventListener('keydown', (event) => {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
        keys.add(event.code);
        if (event.repeat) return;
        if (event.code === 'Escape') {
            if (phase === 'playing' && !pointerLocked) pauseRun();
            return;
        }
        if (event.code === 'KeyR') reload();
        if (event.code === 'KeyM') toggleMap();
        if (event.code === 'Space' && phase === 'playing' && player.jumpY === 0) player.jumpVelocity = 6.2;
    });
    document.addEventListener('keyup', (event) => keys.delete(event.code));
    window.addEventListener('blur', () => keys.clear());

    function toggleMap() {
        showMap = !showMap;
        $('minimap').classList.toggle('hidden-map', !showMap);
        $('mapToggle').setAttribute('aria-pressed', String(showMap));
    }

    $('mapToggle').addEventListener('click', toggleMap);
    $('startBtn').addEventListener('click', startRun);
    $('resumeBtn').addEventListener('click', resumeRun);
    $('restartBtn').addEventListener('click', startRun);
    $('quitBtn').addEventListener('click', returnToMenu);
    $('playAgainBtn').addEventListener('click', startRun);
    $('mainMenuBtn').addEventListener('click', returnToMenu);

    buildArena();
    syncHud();
    ui.classList.add('menu-mode');
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
})();
