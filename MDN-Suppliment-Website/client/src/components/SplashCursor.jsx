'use client';
import { useEffect, useRef } from 'react';

export default function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  CAPTURE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0, g: 0, b: 0 },
  TRANSPARENT = true,
  RAINBOW_MODE = false,
  COLOR = '#A855F7'
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function pointerPrototype() {
      this.id = -1;
      this.texcoordX = 0;
      this.texcoordY = 0;
      this.prevTexcoordX = 0;
      this.prevTexcoordY = 0;
      this.deltaX = 0;
      this.deltaY = 0;
      this.down = false;
      this.moved = false;
      this.color = [0, 0, 0];
    }

    let config = {
      SIM_RESOLUTION,
      DYE_RESOLUTION,
      CAPTURE_RESOLUTION,
      DENSITY_DISSIPATION,
      VELOCITY_DISSIPATION,
      PRESSURE,
      PRESSURE_ITERATIONS,
      CURL,
      SPLAT_RADIUS,
      SPLAT_FORCE,
      SHADING,
      COLOR_UPDATE_SPEED,
      PAUSED: false,
      BACK_COLOR,
      TRANSPARENT,
      RAINBOW_MODE,
      COLOR
    };

    let pointers = [new pointerPrototype()];
    const { gl, ext } = getWebGLContext(canvas);

    if (!ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }

    function getWebGLContext(canvas) {
      const params = {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false
      };
      let gl = canvas.getContext('webgl2', params);
      const isWebGL2 = !!gl;
      if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
      
      let halfFloat;
      let supportLinearFiltering;
      if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
      } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
      }

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat && halfFloat.HALF_FLOAT_OES;
      let formatRGBA, formatRG, formatR;

      if (isWebGL2) {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
      } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      }

      return {
        gl,
        ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering }
      };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
          case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
          case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
          default: return null;
        }
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      return status === gl.FRAMEBUFFER_COMPLETE;
    }

    function hashCode(s) {
      if (s.length === 0) return 0;
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    class Material {
      constructor(vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = [];
      }
      setKeywords(keywords) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);
        let program = this.programs[hash];
        if (program == null) {
          let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
          program = createProgram(this.vertexShader, fragmentShader);
          this.programs[hash] = program;
        }
        if (program === this.activeProgram) return;
        this.uniforms = getUniforms(program);
        this.activeProgram = program;
      }
      bind() { gl.useProgram(this.activeProgram); }
    }

    class Program {
      constructor(vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
      }
      bind() { gl.useProgram(this.program); }
    }

    function createProgram(vertexShader, fragmentShader) {
      let program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.trace(gl.getProgramInfoLog(program));
      return program;
    }

    function getUniforms(program) {
      let uniforms = [];
      let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
      }
      return uniforms;
    }

    function compileShader(type, source, keywords) {
      source = addKeywords(source, keywords);
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.trace(gl.getShaderInfoLog(shader));
      return shader;
    }

    function addKeywords(source, keywords) {
      if (!keywords) return source;
      let keywordsString = '';
      keywords.forEach(keyword => { keywordsString += '#define ' + keyword + '\n'; });
      return keywordsString + source;
    }

    const baseVertexShader = compileShader(
      gl.VERTEX_SHADER,
      `precision highp float;
       attribute vec2 aPosition;
       varying vec2 vUv;
       varying vec2 vL;
       varying vec2 vR;
       varying vec2 vT;
       varying vec2 vB;
       uniform vec2 texelSize;
       void main () {
           vUv = aPosition * 0.5 + 0.5;
           vL = vUv - vec2(texelSize.x, 0.0);
           vR = vUv + vec2(texelSize.x, 0.0);
           vT = vUv + vec2(0.0, texelSize.y);
           vB = vUv - vec2(0.0, texelSize.y);
           gl_Position = vec4(aPosition, 0.0, 1.0);
       }`
    );

    const copyShader = compileShader(gl.FRAGMENT_SHADER,
      `precision mediump float;
       precision mediump sampler2D;
       varying highp vec2 vUv;
       uniform sampler2D uTexture;
       void main () { gl_FragColor = texture2D(uTexture, vUv); }`
    );

    const clearShader = compileShader(gl.FRAGMENT_SHADER,
      `precision mediump float;
       precision mediump sampler2D;
       varying highp vec2 vUv;
       uniform sampler2D uTexture;
       uniform float value;
       void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`
    );

    const displayShaderSource = 
      `precision highp float;
       precision highp sampler2D;
       varying vec2 vUv;
       varying vec2 vL;
       varying vec2 vR;
       varying vec2 vT;
       varying vec2 vB;
       uniform sampler2D uTexture;
       uniform vec2 texelSize;
       void main () {
           vec3 c = texture2D(uTexture, vUv).rgb;
           #ifdef SHADING
               vec3 lc = texture2D(uTexture, vL).rgb;
               vec3 rc = texture2D(uTexture, vR).rgb;
               vec3 tc = texture2D(uTexture, vT).rgb;
               vec3 bc = texture2D(uTexture, vB).rgb;
               float dx = length(rc) - length(lc);
               float dy = length(tc) - length(bc);
               vec3 n = normalize(vec3(dx, dy, length(texelSize)));
               vec3 l = vec3(0.0, 0.0, 1.0);
               float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
               c *= diffuse;
           #endif
           float a = max(c.r, max(c.g, c.b));
           gl_FragColor = vec4(c, a);
       }`;

    const splatShader = compileShader(gl.FRAGMENT_SHADER,
      `precision highp float;
       precision highp sampler2D;
       varying vec2 vUv;
       uniform sampler2D uTarget;
       uniform float aspectRatio;
       uniform vec3 color;
       uniform vec2 point;
       uniform float radius;
       void main () {
           vec2 p = vUv - point.xy;
           p.x *= aspectRatio;
           vec3 splat = exp(-dot(p, p) / radius) * color;
           vec3 base = texture2D(uTarget, vUv).xyz;
           gl_FragColor = vec4(base + splat, 1.0);
       }`
    );

    const advectionShader = compileShader(gl.FRAGMENT_SHADER,
      `precision highp float;
       precision highp sampler2D;
       varying vec2 vUv;
       uniform sampler2D uVelocity;
       uniform sampler2D uSource;
       uniform vec2 texelSize;
       uniform vec2 dyeTexelSize;
       uniform float dt;
       uniform float dissipation;
       vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
           vec2 st = uv / tsize - 0.5;
           vec2 iuv = floor(st);
           vec2 fuv = fract(st);
           vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
           vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
           vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
           vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
           return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
       }
       void main () {
           #ifdef MANUAL_FILTERING
               vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
               vec4 result = bilerp(uSource, coord, dyeTexelSize);
           #else
               vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
               vec4 result = texture2D(uSource, coord);
           #endif
           float decay = 1.0 + dissipation * dt;
           gl_FragColor = result / decay;
       }`, ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
    );

    const divergenceShader = compileShader(gl.FRAGMENT_SHADER,
      `precision mediump float;
       precision mediump sampler2D;
       varying highp vec2 vUv;
       varying highp vec2 vL;
       varying highp vec2 vR;
       varying highp vec2 vT;
       varying highp vec2 vB;
       uniform sampler2D uVelocity;
       void main () {
           float L = texture2D(uVelocity, vL).x;
           float R = texture2D(uVelocity, vR).x;
           float T = texture2D(uVelocity, vT).y;
           float B = texture2D(uVelocity, vB).y;
           vec2 C = texture2D(uVelocity, vUv).xy;
           if (vL.x < 0.0) { L = -C.x; }
           if (vR.x > 1.0) { R = -C.x; }
           if (vT.y > 1.0) { T = -C.y; }
           if (vB.y < 0.0) { B = -C.y; }
           float div = 0.5 * (R - L + T - B);
           gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
       }`
    );

    const curlShader = compileShader(gl.FRAGMENT_SHADER,
      `precision mediump float;
       precision mediump sampler2D;
       varying highp vec2 vUv;
       varying highp vec2 vL;
       varying highp vec2 vR;
       varying highp vec2 vT;
       varying highp vec2 vB;
       uniform sampler2D uVelocity;
       void main () {
           float L = texture2D(uVelocity, vL).y;
           float R = texture2D(uVelocity, vR).y;
           float T = texture2D(uVelocity, vT).x;
           float B = texture2D(uVelocity, vB).x;
           float vorticity = R - L - T + B;
           gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
       }`
    );

    const vorticityShader = compileShader(gl.FRAGMENT_SHADER,
      `precision highp float;
       precision highp sampler2D;
       varying vec2 vUv;
       varying vec2 vL;
       varying vec2 vR;
       varying vec2 vT;
       varying vec2 vB;
       uniform sampler2D uVelocity;
       uniform sampler2D uCurl;
       uniform float curl;
       uniform float dt;
       void main () {
           float L = texture2D(uCurl, vL).x;
           float R = texture2D(uCurl, vR).x;
           float T = texture2D(uCurl, vT).x;
           float B = texture2D(uCurl, vB).x;
           float C = texture2D(uCurl, vUv).x;
           vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
           force /= length(force) + 0.0001;
           force *= curl * C;
           vec2 vel = texture2D(uVelocity, vUv).xy;
           gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
       }`
    );

    const pressureShader = compileShader(gl.FRAGMENT_SHADER,
      `precision mediump float;
       precision mediump sampler2D;
       varying highp vec2 vUv;
       varying highp vec2 vL;
       varying highp vec2 vR;
       varying highp vec2 vT;
       varying highp vec2 vB;
       uniform sampler2D uPressure;
       uniform sampler2D uDivergence;
       void main () {
           float L = texture2D(uPressure, vL).x;
           float R = texture2D(uPressure, vR).x;
           float T = texture2D(uPressure, vT).x;
           float B = texture2D(uPressure, vB).x;
           float div = texture2D(uDivergence, vUv).x;
           gl_FragColor = vec4(0.25 * (L + R + T + B - div), 0.0, 0.0, 1.0);
       }`
    );

    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER,
      `precision mediump float;
       precision mediump sampler2D;
       varying highp vec2 vUv;
       varying highp vec2 vL;
       varying highp vec2 vR;
       varying highp vec2 vT;
       varying highp vec2 vB;
       uniform sampler2D uPressure;
       uniform sampler2D uVelocity;
       void main () {
           float L = texture2D(uPressure, vL).x;
           float R = texture2D(uPressure, vR).x;
           float T = texture2D(uPressure, vT).x;
           float B = texture2D(uPressure, vB).x;
           vec2 vel = texture2D(uVelocity, vUv).xy;
           gl_FragColor = vec4(vel - 0.5 * vec2(R - L, T - B), 0.0, 1.0);
       }`
    );

    const blit = (() => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      return (target) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    })();

    let dye, velocity, divergence, curl, pressure;
    const copyProgram = new Program(baseVertexShader, copyShader);
    const clearProgram = new Program(baseVertexShader, clearShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradSubProgram = new Program(baseVertexShader, gradientSubtractShader);
    const displayMaterial = new Material(baseVertexShader, displayShaderSource);

    function initFramebuffers() {
      let simWidth = config.SIM_RESOLUTION;
      let simHeight = config.SIM_RESOLUTION;
      let dyeWidth = config.DYE_RESOLUTION;
      let dyeHeight = config.DYE_RESOLUTION;
      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA;
      const rg = ext.formatRG;
      const r = ext.formatR;

      dye = createDoubleFBO(dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
      velocity = createDoubleFBO(simWidth, simHeight, rg.internalFormat, rg.format, texType, ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
      divergence = createFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
      curl = createFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      return { texture, fbo, width: w, height: h, attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w, height: h,
        get read() { return fbo1; },
        get write() { return fbo2; },
        swap() { let temp = fbo1; fbo1 = fbo2; fbo2 = temp; }
      };
    }

    initFramebuffers();
    let lastUpdateTime = Date.now();
    update();

    function update() {
      if (resizeCanvas()) initFramebuffers();
      const dt = Math.min((Date.now() - lastUpdateTime) / 1000, 0.016);
      lastUpdateTime = Date.now();

      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      if (!config.TRANSPARENT) {
        gl.clearColor(config.BACK_COLOR.r, config.BACK_COLOR.g, config.BACK_COLOR.b, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      applyInputs();
      step(dt);
      render(null);
      requestAnimationFrame(update);
    }

    function resizeCanvas() {
      let width = scaleByPixelRatio(canvas.clientWidth);
      let height = scaleByPixelRatio(canvas.clientHeight);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
      }
      return false;
    }

    function scaleByPixelRatio(input) {
      return Math.floor(input * (window.devicePixelRatio || 1));
    }

    function step(dt) {
      gl.viewport(0, 0, velocity.width, velocity.height);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize, 1.0 / velocity.width, 1.0 / velocity.height);
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl.fbo);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0 / velocity.width, 1.0 / velocity.height);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write.fbo);
      velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / velocity.width, 1.0 / velocity.height);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence.fbo);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      blit(pressure.write.fbo);
      pressure.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / velocity.width, 1.0 / velocity.height);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write.fbo);
        pressure.swap();
      }

      gradSubProgram.bind();
      gl.uniform2f(gradSubProgram.uniforms.texelSize, 1.0 / velocity.width, 1.0 / velocity.height);
      gl.uniform1i(gradSubProgram.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradSubProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write.fbo);
      velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / velocity.width, 1.0 / velocity.height);
      if (!ext.supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1.0 / velocity.width, 1.0 / velocity.height);
      let invDt = 1.0 / dt;
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read.attach(0));
      blit(velocity.write.fbo);
      velocity.swap();

      gl.viewport(0, 0, dye.width, dye.height);
      if (!ext.supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1.0 / dye.width, 1.0 / dye.height);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      blit(dye.write.fbo);
      dye.swap();
    }

    function render(target) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      let keywords = [];
      if (config.SHADING) keywords.push('SHADING');
      displayMaterial.setKeywords(keywords);
      displayMaterial.bind();
      gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / canvas.width, 1.0 / canvas.height);
      gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
      blit(target);
    }

    function applyInputs() {
      pointers.forEach(p => {
        if (p.moved) {
          p.moved = false;
          splatPointer(p);
        }
      });
    }

    function splatPointer(pointer) {
      let dx = pointer.deltaX * config.SPLAT_FORCE;
      let dy = pointer.deltaY * config.SPLAT_FORCE;
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    function splat(x, y, dx, dy, color) {
      gl.viewport(0, 0, velocity.width, velocity.height);
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS / 100.0);
      blit(velocity.write.fbo);
      velocity.swap();

      gl.viewport(0, 0, dye.width, dye.height);
      gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color, color[0], color[1], color[2]);
      blit(dye.write.fbo);
      dye.swap();
    }

    function colorFromString(hex) {
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ] : [1, 0, 1];
    }

    // Connect global mouse/touch triggers cleanly within navbar layout bounds
    const handleMouseMove = (e) => {
      let pointer = pointers[0];
      let rect = canvas.getBoundingClientRect();
      pointer.texcoordX = (e.clientX - rect.left) / canvas.clientWidth;
      pointer.texcoordY = 1.0 - (e.clientY - rect.top) / canvas.clientHeight;
      pointer.deltaX = pointer.texcoordX - pointer.prevTexcoordX;
      pointer.deltaY = pointer.texcoordY - pointer.prevTexcoordY;
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.color = colorFromString(config.COLOR);
    };

    const handleTouchMove = (e) => {
      if (e.targetTouches.length === 0) return;
      let pointer = pointers[0];
      let rect = canvas.getBoundingClientRect();
      let touch = e.targetTouches[0];
      pointer.texcoordX = (touch.clientX - rect.left) / canvas.clientWidth;
      pointer.texcoordY = 1.0 - (touch.clientY - rect.top) / canvas.clientHeight;
      pointer.deltaX = pointer.texcoordX - pointer.prevTexcoordX;
      pointer.deltaY = pointer.texcoordY - pointer.prevTexcoordY;
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.color = colorFromString(config.COLOR);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [
    SIM_RESOLUTION, DYE_RESOLUTION, CAPTURE_RESOLUTION, DENSITY_DISSIPATION,
    VELOCITY_DISSIPATION, PRESSURE, PRESSURE_ITERATIONS, CURL, SPLAT_RADIUS,
    SPLAT_FORCE, SHADING, COLOR_UPDATE_SPEED, BACK_COLOR, TRANSPARENT,
    RAINBOW_MODE, COLOR
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full pointer-events-none"
    />
  );
}