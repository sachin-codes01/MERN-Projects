# Golden Butterfly

The public website lazy-loads a procedural Three.js / React Three Fiber butterfly via `SiteButterfly` in `client/src/App.jsx`. Staff routes do not load it. The larger forewings and hindwings overlap, with a small phase offset between near and far wings during flight. The model uses a right three-quarter view so both wing pairs remain visible, per the requested reference; banking is limited to the screen plane. Four independently articulated, curved silhouette meshes form the wings, with generated blue scale textures with subtle iridescence, veins and eyespots. This is procedural 3D artwork inspired by the reference, not a scanned model or an image plane.

## Install and run

From `client/`:

```sh
npm install three @react-three/fiber
npm run dev
npm run build
npm run lint
```

Dependencies and lockfile are already updated.

## Component API

```jsx
import GoldenButterfly from './components/GoldenButterfly.jsx'

<GoldenButterfly
  size={120}
  speed={1.2}
  autoFly={true}
  autoLand={true}
  followCursor={true}
  clickInteraction={true}
  landingDuration={3500}
  zIndex={50}
  onLand={(element) => console.log(element)}
/>
```

`size` is the maximum open wingspan in CSS pixels, capped to 23% of viewport dimensions on small screens. A side view has a narrower apparent silhouette. `speed` scales travel time with a minimum of 0.25. `landingDuration` is milliseconds, bounded to 2000–6000; flower perches rest for at least 5000 ms. `autoFly={false}` parks the butterfly until a click attracts it (disable `clickInteraction` too for a stationary butterfly). `autoLand={false}` disables perching. Cursor approaches are probabilistic and separated by at least 12 seconds. All handlers are passive; the overlay cannot capture clicks, selection or scrolling. `onLand` fires once after each successful landing.

Mark landing targets with `data-butterfly-land`. The hero, section titles and customer page headers are already marked. Flower images use `data-butterfly-land="flower"`; these are preferred over other targets, and their centres are used as perches. Targets are queried fresh at each flight decision, so newly mounted content and route changes work without registration. Only visible targets with enough room around the perch are eligible. A removed or offscreen perch triggers takeoff. During approach and rest, its viewport rectangle is read each frame to track scroll and resize. The butterfly only travels within the current viewport; it never scrolls the page for the user.

## Motion and resources

`ButterflyController.jsx` implements IDLE, FLYING, APPROACHING, LANDING, RESTING and TAKEOFF using refs and `useFrame`, cubic Bezier travel and eased deceleration. An orthographic camera maps CSS viewport pixels to scene coordinates. Right three-quarter orientation is fixed in `ButterflyModel.jsx`; wings fold during rest and flap in flight.

Reduced-motion preference removes the WebGL decoration. Hidden tabs stop the render loop. Device pixel ratio is capped at 1.5. An error boundary and WebGL context-loss handler disable the decoration on failure. Unmounting removes input/preference listeners and releases geometry, texture and material resources. No image-generation service, GLB download or extra runtime animation package is required.

The lazy Three.js bundle is approximately 245 kB gzip and triggers Vite's default large-chunk notice. Build success does not verify WebGL behavior on every device; inspect flight, scroll-following perches and touch navigation in a WebGL-capable browser before deployment.


