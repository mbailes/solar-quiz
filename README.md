# Solar System Quiz

A mobile-first quiz: one question per planet, with the planet rotating in 3D (drag to spin) and a "Vital stats" card.

- Plain static site: `index.html`, `style.css`, `app.js`, `planets.js`. No build step.
- 3D: [three.js](https://threejs.org) r170, **vendored** in `vendor/` (MIT, licence included), so there are no third-party script hosts.
- Planet surfaces are generated procedurally in the browser, so there are no image files and no image licences.
- Axial tilts are true (the yellow line is the spin axis). Rotation speeds are compressed (power 0.3) so that Venus (243 days) still visibly turns.
- Data: NASA Planetary Fact Sheet; moon counts as of 2025.
- A Content-Security-Policy `<meta>` tag allows only same-origin scripts and styles. User-visible text is set with `textContent`, never `innerHTML`.

## Edit questions
Everything is in `planets.js`. Each planet has `question: { q, options[4], answer (index), why }`.

## Run locally
    python3 -m http.server 8000      # then open http://localhost:8000
    # http://localhost:8000/#6 jumps straight to planet 6 (Saturn)

ES modules don't load from `file://`, so use a local server.

## Deploy (GitHub Pages)
Push to a GitHub repo, then go to Settings → Pages → Deploy from branch → `main` / root. `.nojekyll` is included.
