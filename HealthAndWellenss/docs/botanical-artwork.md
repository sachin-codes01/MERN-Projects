# Botanical website artwork

Transparent cutouts created from the 22 user-provided JPGs using the built-in image generation tool (background-extraction edits). Source JPGs are preserved in the original Downloads folder.

Prompt for each asset:

> Use case: background-extraction. Edit target: the supplied {asset-name} image. Remove only the white/gray/checkerboard background (including gaps between leaves/petals), replacing it with actual alpha transparency. Preserve the original subject, colors, details, composition and delicate edges. No new objects, no backdrop, no checkerboard. For the hibiscus remove the exterior sticker border too. Save a clean transparent PNG website asset.

Final cutouts live in `client/public/images/botanicals/`. The asset manifest records the source filename and output filename. The supplied wooden sign and extra flowers are retained in the library for future use; the site uses a curated selection.

For the three additional assets (vintage butterflies, floral portrait and floral column), the extraction prompt also explicitly preserves vintage texture and removes gaps between stems, antennae and butterflies. All selected cutouts were reviewed against the cream website background.

`BotanicalScene.jsx` defines seven compositions, shared by the landing page, authentication panel and therapy catalogue. Each illustration has a reserved container, hidden overflow, decorative image semantics, lazy loading below the hero, and pointer events disabled. All motion stops for `prefers-reduced-motion: reduce`.

Desktop uses two-column text/art layouts; mobile stacks the hero and caps illustration sizes. The admin interface and therapy photographs retain their existing purpose.


