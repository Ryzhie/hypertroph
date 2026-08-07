import { BODY_REGIONS, BODY_DECO, BODY_OUTLINE, MUSCLE_REGIONS } from './src/data/body.js'

const CX = 120
const W = 240, H = 420
const MIRROR = `translate(${W} 0) scale(-1 1)`

function region(id, d, centered, mirror) {
  const parts = [`<path d="${d}" class="reg"/>`]
  if (!centered) parts.push(`<path d="${d}" class="reg" transform="${MIRROR}"/>`)
  return parts.join('\n')
}

const frontRegions = BODY_REGIONS.filter(r => r.view === 'front' && !r.deco)
const backRegions = BODY_REGIONS.filter(r => r.view === 'back' && !r.deco)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="880" viewBox="0 0 520 880" style="background:#0f1218">
<defs>
<style>
  .reg { fill: #2a3444; stroke: #171c24; stroke-width: 1; }
  .on { fill: #f59e0b; stroke: #fbbf24; stroke-width: 1.5; }
  .deco { fill: #0e1117; stroke: #171c24; stroke-width: 1; }
  .silo { fill: none; stroke: #252d3a; stroke-width: 1; opacity: 0.5; }
  .label { fill: #94a3b8; font-size: 14px; font-family: system-ui; }
</style>
</defs>

<!-- Front view -->
<g transform="translate(0,0)">
  <text x="60" y="24" class="label">Front</text>
  <path d="${BODY_OUTLINE}" class="silo"/>
  ${BODY_DECO.front.map(id => `<path id="${id}" d="${BODY_REGIONS.find(r=>r.id===id)?.d}" class="deco"/>`).join('\n  ')}
  ${frontRegions.map(r => region(r.id, r.d, r.centered)).join('\n  ')}
</g>

<!-- Back view -->
<g transform="translate(260,0)">
  <text x="60" y="24" class="label">Back</text>
  <path d="${BODY_OUTLINE}" class="silo"/>
  ${BODY_DECO.back.map(id => `<path id="b-${id}" d="${BODY_REGIONS.find(r=>r.id===id)?.d}" class="deco"/>`).join('\n  ')}
  ${backRegions.map(r => region(`b-${r.id}`, r.d, r.centered)).join('\n  ')}
</g>
</svg>`

import { writeFileSync } from 'fs'
writeFileSync('/tmp/bodymap-v2.svg', svg)
console.log('SVG written to /tmp/bodymap-v2.svg')
