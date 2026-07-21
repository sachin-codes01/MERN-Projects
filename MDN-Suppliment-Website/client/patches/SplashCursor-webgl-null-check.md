# SplashCursor.jsx — WebGL null-context patch

I don't have your actual `SplashCursor.jsx`, so I can't hand you a full replacement file safely (I'd
risk silently dropping any customizations you've made). But your error's exact location tells us
precisely what's wrong and exactly what to add — this is the standard "Splash Cursor" WebGL fluid
component, and this is its one known sharp edge.

## What's happening

```js
function getWebGLContext(canvas) {
  const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };

  let gl = canvas.getContext("webgl2", params);
  const isWebGL2 = !!gl;
  if (!isWebGL2)
    gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);

  // ⬇ Line 87 — this crashes when BOTH getContext calls above returned null
  //   (WebGL genuinely unavailable, OR — very commonly in dev — React
  //   StrictMode double-invoking this effect and the second call getting
  //   rejected on the same canvas).
  if (isWebGL2) {
    gl.getExtension("EXT_color_buffer_float");
    ...
```

`gl` is `null`, and the code immediately calls `.getExtension()` on it with no check.

## The fix — two small additions

**1. Inside `getWebGLContext`, right after the fallback `getContext` call, before anything else touches `gl`:**

```js
let gl = canvas.getContext("webgl2", params);
const isWebGL2 = !!gl;
if (!isWebGL2)
  gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);

// ADD THIS — bail out gracefully instead of crashing on the next line
if (!gl) {
  return { gl: null, ext: null };
}
```

**2. At the call site (around line 62), right after calling `getWebGLContext`:**

```js
const { gl, ext } = getWebGLContext(canvas);

// ADD THIS — skip the rest of the fluid-sim setup entirely if WebGL isn't available
if (!gl) {
  return;
}
```

That's the whole fix — WebGL just won't be available on that particular browser/machine, and instead of
crashing, the component quietly renders nothing (no background fluid effect), and everything else on
the page works normally.

## If your variable names differ

If your file destructures differently (e.g. returns just `gl` instead of `{ gl, ext }`, or the function
is named differently), the *pattern* is what matters: add a `if (!gl) return ...` immediately after each
place `gl` is first obtained, before any `gl.something()` call. Paste me the real file any time and I'll
place these precisely instead of you having to match it up yourself.
