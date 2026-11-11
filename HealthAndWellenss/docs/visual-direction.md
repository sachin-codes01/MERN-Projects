# Visual direction and asset provenance

The existing React, Vite, Tailwind and MUI frontend is retained. Routes, API calls, authentication and booking logic are unchanged.

## Design decisions

- Welcome: editorial split hero, existing brand and copy, locally stored still-life photography, existing registration/login/therapy/staff destinations.
- Authentication: photograph behind the existing desktop brand panel with a contrast overlay; warm neutral form area; mobile forms remain compact.
- Catalogue: photographic introduction, three columns on large screens, two on tablets, one on small screens. Existing uploaded therapy images remain authoritative. Missing photos use named, numbered typographic brand covers rather than treatment imagery.
- Customer home: sage greeting and related tonal appointment/follow-up sections.
- Booking: neutral selection sections and a distinct sage summary. Date, availability, offers and submission behavior retained.
- Reminders: sand preference strip and sage next-follow-up area.
- Existing focus styles and reduced-motion support retained.

## Image provenance

Tool: built-in image_gen (no new runtime dependency).
Asset: client/public/images/wellness-editorial.png.
This is an illustrative generated still life, not a photograph of the centre or a specific treatment.

Final generation prompt:

Create a photorealistic editorial still-life photograph for an Indian wellness brand website, portrait 4:5 composition. Close, tactile scene: a small dark antique brass bowl of amber massage oil on an ivory linen towel, one simple unglazed ceramic vessel, a few fresh neem leaves with natural imperfect edges on warm sandstone. Background softly out of focus deep olive green, warm natural window light from upper left, quiet chiaroscuro, fine film grain, restrained premium Aesop-like editorial photography without copying any brand. Rich earthy greens, warm cream and muted brass palette. Objects in lower central two-thirds, top with soft shadow and negative space. No people, no text, no logos, no candles, no floating objects, no spa stones, no collage, no border. The image must feel authentic, material and photographic, not glossy 3D or plastic.

## Validation

Production build and oxlint passed. HTTP route and asset checks were run against the existing development server. Browser webview attachment failed, so rendered desktop/mobile screenshots and end-to-end interaction checks remain unverified. No real customer registration or booking data was submitted during this visual update.
