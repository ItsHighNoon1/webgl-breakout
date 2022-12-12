{ // Namespace hack

// Graphics parameters
let models = {};
let shaders = {};
let camera = {
    x: 0.0,
    y: 0.0,
    z: 2.0,
    rx: 0.0,
    ry: 0.0,
    fov: 1.5,
    zNear: 0.1,
    zFar: 10.0,
}

// Time parameters
let t = 0.0;
let lastTime;

// Input parameters
let keysDown = {};

// Game state
let bricks = [];
let paddle = {x: 0.0, y: -0.9, z: 9};

function loop() {
    // Calculate elapsed time
    let currTime = Date.now();
    let timeElapsed = currTime - lastTime;
    lastTime = currTime;
    if (timeElapsed) {
        t += timeElapsed / 1000.0;
    }
    timeElapsed /= 1000.0;

    // Move the paddle
    if (keysDown["a"]) {
        paddle.x -= timeElapsed;
    } else if (keysDown["d"]) {
        paddle.x += timeElapsed;
    }

    // Calculate view and projection matrices
    let viewMatrix = mat4.create();
    mat4.fromXRotation(viewMatrix, -camera.rx);
    mat4.rotate(viewMatrix, viewMatrix, -camera.ry, [0.0, 1.0, 0.0]);
    mat4.translate(viewMatrix, viewMatrix, [-camera.x, -camera.y, -camera.z]);
    let projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, camera.fov, screenWidth / screenHeight, camera.zNear, camera.zFar);
    
    // Draw the bricks
    startShader(shaders.brickShader);
    setShaderParam(shaders.brickShader.uniforms.paddleDepth, paddle.z);
    setShaderParam(shaders.brickShader.uniforms.viewMatrix, viewMatrix);
    setShaderParam(shaders.brickShader.uniforms.projectionMatrix, projectionMatrix);
    bricks.forEach(brick => {
        let modelMatrix = mat4.create();
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, [brick.x, brick.y, brick.z * 0.1]);
        mat4.scale(modelMatrix, modelMatrix, [0.14, 0.04, 0.09]);
        setShaderParam(shaders.brickShader.uniforms.brickDepth, brick.z);
        setShaderParam(shaders.brickShader.uniforms.modelMatrix, modelMatrix);
        draw(models.brick);
    });

    // Draw the paddle
    setShaderParam(shaders.brickShader.uniforms.brickDepth, paddle.z);
    let modelMatrix = mat4.create();
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [paddle.x, paddle.y, paddle.z * 0.1]);
    mat4.scale(modelMatrix, modelMatrix, [0.3, 0.05, 0.09]);
    setShaderParam(shaders.brickShader.uniforms.modelMatrix, modelMatrix);
    draw(models.brick);

    // Loop
    requestAnimationFrame(loop);
}

window.onload = function() {
    // Initialize noise
    //const noise = new perlinNoise3d();
    const noise = new Noise();
    console.log(noise);
    noise.noiseSeed(Date.now());

    // Create brick grid
    for (let i = 0; i <= 18; i++) {
        for (let j = 4; j <= 18; j++) {
            for (let k = 0; k < 10; k++) {
                // Cut holes with perlin noise
                if (noise.get(i * 0.15 * 2.0, j * 0.05 * 2.0, k * 0.1 * 2.0) > 0.45) {
                    bricks.push({x: (i - 9) * 0.15, y: j * 0.05, z: k});
                }
            }
        }
    }

    // Initialize WebGL
    initGL();

    // Create shaders
    shaders.brickShader = newShader(vBrickSource, fBrickSource);

    // Create model
    models.brick = newModel(meshes.cube, shaders.brickShader);

    requestAnimationFrame(loop);
}

document.onkeydown = function(e) {
    keysDown[e.key] = true;
    if (e.key == "w") {
        paddle.z--;
    } else if (e.key == "s") {
        paddle.z++;
    }
}

document.onkeyup = function(e) {
    delete keysDown[e.key];
}

let Noise;

// I'm having a really difficult time putting this in its own file, sorry
{

    // Based on http://mrl.nyu.edu/~perlin/noise/
    // Adapting from runemadsen/rune.noise.js
    // Which was adapted from P5.js
    // Which was adapted from PApplet.java
    // which was adapted from toxi
    // which was adapted from the german demo group farbrausch as used in their demo "art": http://www.farb-rausch.de/fr010src.zip

    var PERLIN_YWRAPB = 4;
    var PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
    var PERLIN_ZWRAPB = 8;
    var PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
    var PERLIN_SIZE = 4095;

    var SINCOS_PRECISION = 0.5;
    var SINCOS_LENGTH = Math.floor(360 / SINCOS_PRECISION);
    var sinLUT = new Array(SINCOS_LENGTH);
    var cosLUT = new Array(SINCOS_LENGTH);
    var DEG_TO_RAD = Math.PI / 180.0;
    for (var i = 0; i < SINCOS_LENGTH; i++) {
        sinLUT[i] = Math.sin(i * DEG_TO_RAD * SINCOS_PRECISION);
        cosLUT[i] = Math.cos(i * DEG_TO_RAD * SINCOS_PRECISION);
    }

    var perlin_PI = SINCOS_LENGTH;
    perlin_PI >>= 1;

    Noise = function () {
        this.perlin_octaves = 4; // default to medium smooth
        this.perlin_amp_falloff = 0.5; // 50% reduction/octave
        this.perlin = null;
    }

    Noise.prototype = {

        noiseSeed: function (seed) {

            // Linear Congruential Generator
            // Variant of a Lehman Generator
            var lcg = (function () {
                // Set to values from http://en.wikipedia.org/wiki/Numerical_Recipes
                // m is basically chosen to be large (as it is the max period)
                // and for its relationships to a and c
                var m = 4294967296,
                    // a - 1 should be divisible by m's prime factors
                    a = 1664525,
                    // c and m should be co-prime
                    c = 1013904223,
                    seed, z;
                return {
                    setSeed: function (val) {
                        // pick a random seed if val is undefined or null
                        // the >>> 0 casts the seed to an unsigned 32-bit integer
                        z = seed = (val == null ? Math.random() * m : val) >>> 0;
                    },
                    getSeed: function () {
                        return seed;
                    },
                    rand: function () {
                        // define the recurrence relationship
                        z = (a * z + c) % m;
                        // return a float in [0, 1)
                        // if z = m then z / m = 0 therefore (z % m) / m < 1 always
                        return z / m;
                    }
                };
            }());

            lcg.setSeed(seed);
            this.perlin = new Array(PERLIN_SIZE + 1);
            for (var i = 0; i < PERLIN_SIZE + 1; i++) {
                this.perlin[i] = lcg.rand();
            }
            return this;
        },

        get: function (x, y, z) {
            y = y || 0;
            z = z || 0;

            if (this.perlin == null) {
                this.perlin = new Array(PERLIN_SIZE + 1);
                for (var i = 0; i < PERLIN_SIZE + 1; i++) {
                    this.perlin[i] = Math.random();
                }
            }

            if (x < 0) { x = -x; }
            if (y < 0) { y = -y; }
            if (z < 0) { z = -z; }

            var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
            var xf = x - xi;
            var yf = y - yi;
            var zf = z - zi;
            var rxf, ryf;

            var r = 0;
            var ampl = 0.5;

            var n1, n2, n3;

            var noise_fsc = function (i) {
                // using cosine lookup table
                return 0.5 * (1.0 - cosLUT[Math.floor(i * perlin_PI) % SINCOS_LENGTH]);
            };

            for (var o = 0; o < this.perlin_octaves; o++) {
                var of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

                rxf = noise_fsc(xf);
                ryf = noise_fsc(yf);

                n1 = this.perlin[of & PERLIN_SIZE];
                n1 += rxf * (this.perlin[(of + 1) & PERLIN_SIZE] - n1);
                n2 = this.perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
                n2 += rxf * (this.perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
                n1 += ryf * (n2 - n1);

                of += PERLIN_ZWRAP;
                n2 = this.perlin[of & PERLIN_SIZE];
                n2 += rxf * (this.perlin[(of + 1) & PERLIN_SIZE] - n2);
                n3 = this.perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
                n3 += rxf * (this.perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
                n2 += ryf * (n3 - n2);

                n1 += noise_fsc(zf) * (n2 - n1);

                r += n1 * ampl;
                ampl *= this.perlin_amp_falloff;
                xi <<= 1;
                xf *= 2;
                yi <<= 1;
                yf *= 2;
                zi <<= 1;
                zf *= 2;

                if (xf >= 1.0) { xi++; xf--; }
                if (yf >= 1.0) { yi++; yf--; }
                if (zf >= 1.0) { zi++; zf--; }
            }

            return r;
        }

    }

    //return Noise;

}

} // Namespace