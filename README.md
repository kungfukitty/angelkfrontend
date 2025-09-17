# AngelKellogg SPA (Vite + React + Tailwind)

Production-ready single-page app aligned with your Home / About / Brands / Media / Contact (+ Privacy & Terms) structure.

## Quick Start
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Environment Variables (Vercel/Render)
- `VITE_API_BASE` — e.g., `https://project-angel.onrender.com`
  - The Contact form posts to `${VITE_API_BASE}/api/contact`

## Optional Runtime Hero Overrides
In production, you can inject on the page:
```html
<script>
  window.__HERO_TITLE = "Your headline";
  window.__HERO_SUBTITLE = "Your subheadline";
  window.__HERO_IMAGE = "https://.../hero.jpg";
  window.__HERO_VIDEO = "https://.../hero.mp4";
</script>
```

## Deploy Notes
- **Vercel**: Framework preset "Vite", Build Command `npm run build`, Output `dist/`.
- **Render (Static)**: Build Command `npm run build`, Publish Directory `dist`.
- This repo is frontend-only; point `VITE_API_BASE` to your Render backend.
