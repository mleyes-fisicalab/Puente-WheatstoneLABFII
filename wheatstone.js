/* ==========================================================================
   Cuaderno interactivo · Informe 5 · Construcción de un puente de Wheatstone
   ========================================================================== */
const E_SRC = 6, R_SRC = 0.3, R_G = 120, R_PROT = 10000;
const FS = { fino: 10e-6, grueso: 100e-6 };
const RX = [
  { k: "A", nom: 68, b: [6, 8, 0] }, { k: "B", nom: 470, b: [4, 7, 1] }, { k: "C", nom: 1500, b: [1, 5, 2] },
  { k: "D", nom: 8200, b: [8, 2, 2] }, { k: "E", nom: 33000, b: [3, 3, 3] }, { k: "F", nom: 150000, b: [1, 5, 4] }];
const BAND = ["#1b1b1b", "#7a4a22", "#d23b2b", "#f08a1c", "#f2d02a", "#2f9e4a", "#2f62d0", "#8a4ad0", "#8a8a8a", "#f4f4f4"];
const MULT = [[0.01, 1000, 10], [0.1, 1000, 100], [1, 1000, 1000], [10, 100, 1000], [100, 100, 10000]];
const RSET = [10, 100, 220, 470, 1000, 2200, 4700, 10000];

function rxTrue(k) {
  let t = Store.get("rxTrue");
  if (!t) { t = {}; RX.forEach(s => t[s.k] = s.nom * (1 + 0.04 * (Math.random() * 2 - 1))); t.tol = Math.random(); Store.set("rxTrue", t); }
  return t[k];
}
function trueR(nom) { const t = Store.get("rxTrue", { tol: .5 }); return nom * (1 + 0.0012 * Math.sin(nom * 0.37 + t.tol * 10)); } // resistores de precisión 0,1 %
const fmtOhm = r => !isFinite(r) ? "—" : r >= 1e5 ? fmt(r / 1e3, 1) + " kΩ" : r >= 1e4 ? fmt(r / 1e3, 2) + " kΩ" : r >= 1e3 ? fmt(r / 1e3, 3) + " kΩ" : fmt(r, 1) + " Ω";
const fmtMult = m => String(m).replace(".", ",");

function sim() {
  return Object.assign({ sample: "B", R1: 1000, R2: 1000, dec: [0, 0, 0, 0], sens: "grueso" }, Store.get("sim", {}));
}
function saveSim(s) { Store.set("sim", s); }
const R3of = d => d[0] * 1000 + d[1] * 100 + d[2] * 10 + d[3];

/* análisis nodal completo del puente (fuente con resistencia interna, galvanómetro real) */
function solveBridge({ R1, R2, R3, Rx, Rg }) {
  R3 = Math.max(R3, 0.02);
  const a = [[1 / R_SRC + 1 / R3 + 1 / R1, -1 / R3, -1 / R1], [-1 / R3, 1 / R3 + 1 / Rx + 1 / Rg, -1 / Rg], [-1 / R1, -1 / Rg, 1 / R1 + 1 / R2 + 1 / Rg]];
  const bvec = [E_SRC / R_SRC, 0, 0];
  const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(a); const V = [0, 1, 2].map(j => det(a.map((r, i) => r.map((v, k) => k === j ? bvec[i] : v))) / D);
  const [VT, VL, VR] = V;
  return { VT, VL, VR, I3: (VT - VL) / R3, I1: (VT - VR) / R1, Ix: VL / Rx, I2: VR / R2, Ig: (VL - VR) / Rg };
}
function bridgeNow(s = sim()) {
  const Rg = R_G + (s.sens === "grueso" ? R_PROT : 0);
  return solveBridge({ R1: trueR(s.R1), R2: trueR(s.R2), R3: R3of(s.dec), Rx: rxTrue(s.sample), Rg });
}
function rows1() { return Store.get("t1", []); }

/* ---------- dibujos SVG ---------- */
function zig(x1, y1, x2, y2, n = 6, amp = 9) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const a = .3, b = .7; let d = `M${x1},${y1} L${x1 + dx * a},${y1 + dy * a}`;
  for (let i = 1; i <= n * 2; i++) { const t = a + (b - a) * (i - .5) / (n * 2); const s = i % 2 ? 1 : -1; d += ` L${x1 + dx * t + nx * amp * s},${y1 + dy * t + ny * amp * s}`; }
  return d + ` L${x1 + dx * b},${y1 + dy * b} L${x2},${y2}`;
}
function resistorChip(b) {
  const c = [BAND[b[0]], BAND[b[1]], BAND[b[2]], "#c9a03a"];
  return `<svg viewBox="0 0 110 28" aria-hidden="true"><line x1="0" y1="14" x2="110" y2="14" stroke="var(--fg3)" stroke-width="2"/>
  <rect x="22" y="5" width="66" height="18" rx="8" fill="#d9c49a"/>${[32, 42, 52, 72].map((x, i) => `<rect x="${x}" y="5" width="5" height="18" fill="${c[i]}"/>`).join("")}</svg>`;
}
const N = { T: [430, 95], W: [300, 215], E: [560, 215], S: [430, 335] };
function circuitSVG() {
  return `<svg viewBox="0 0 640 410" role="img" aria-label="Circuito del puente de Wheatstone de la Figura 1">
  <path class="wire" d="M150,196 V60 H430 V95"/><path class="wire" d="M430,335 V370 H150 V226"/>
  <path class="wire" d="M150,60 H62 V192 M62,238 V370 H150"/>
  <circle class="cbody" cx="62" cy="215" r="22"/><text x="62" y="220" text-anchor="middle" class="lb" style="font-size:15px">V</text>
  <text x="34" y="190" class="lb" style="font-size:14px">+</text><text x="36" y="252" class="lb" style="font-size:14px">−</text>
  <line x1="126" y1="196" x2="174" y2="196" stroke="var(--fg)" stroke-width="3"/><line x1="138" y1="226" x2="162" y2="226" stroke="var(--fg)" stroke-width="5"/>
  <text x="182" y="216" class="lb" style="font-size:15px">6 V</text><text x="120" y="190" class="lb" style="font-size:14px">+</text>
  <path class="res adj" d="${zig(...N.T, ...N.W)}"/><path class="res" d="${zig(...N.T, ...N.E)}"/>
  <path class="res x" d="${zig(...N.W, ...N.S)}"/><path class="res" d="${zig(...N.E, ...N.S)}"/>
  <path class="wire" d="M300,215 H404 M456,215 H560"/>
  <circle class="cbody" cx="430" cy="215" r="25"/><text x="430" y="234" text-anchor="middle" style="font-size:11px">G</text>
  <line id="gneedle" x1="430" y1="226" x2="430" y2="196" stroke="var(--bad)" stroke-width="2" stroke-linecap="round"/>
  <g id="flows">
    <path class="flow" data-b="src" d="M150,196 V60 H430 V95"/><path class="flow" data-b="I3" d="M${N.T} L${N.W}"/><path class="flow" data-b="I1" d="M${N.T} L${N.E}"/>
    <path class="flow" data-b="Ix" d="M${N.W} L${N.S}"/><path class="flow" data-b="I2" d="M${N.E} L${N.S}"/>
    <path class="flow" data-b="Ig" d="M300,215 H404 M456,215 H560"/><path class="flow" data-b="ret" d="M430,335 V370 H150 V226"/></g>
  ${Object.values(N).map(p => `<circle class="node" cx="${p[0]}" cy="${p[1]}" r="4"/>`).join("")}
  <text x="338" y="138" text-anchor="end" class="lb">R₃</text><text id="tR3" x="338" y="156" text-anchor="end"></text>
  <text x="522" y="138" class="lb">R₁</text><text id="tR1" x="522" y="156"></text>
  <text x="338" y="298" text-anchor="end" class="lb" style="fill:var(--c3)">Rₓ</text><text id="tRx" x="338" y="316" text-anchor="end"></text>
  <text x="522" y="298" class="lb">R₂</text><text id="tR2" x="522" y="316"></text>
  <text x="620" y="400" text-anchor="end" style="font-size:11px;fill:var(--fg3)">Figura 1 · puntos cian: sentido de la corriente</text></svg>`;
}
function galvSVG() {
  const ticks = []; for (let k = -10; k <= 10; k++) { const a = (k / 10) * 50 * Math.PI / 180, r1 = 92, r2 = k % 5 === 0 ? 78 : 85; ticks.push(`<line class="tick" x1="${120 + r1 * Math.sin(a)}" y1="${120 - r1 * Math.cos(a)}" x2="${120 + r2 * Math.sin(a)}" y2="${120 - r2 * Math.cos(a)}"/>`); }
  const labs = [-10, -5, 0, 5, 10].map(k => { const a = (k / 10) * 50 * Math.PI / 180; return `<text data-k="${k}" x="${120 + 68 * Math.sin(a)}" y="${124 - 68 * Math.cos(a)}" text-anchor="middle"></text>`; });
  return `<svg viewBox="0 0 240 140" role="img" aria-label="Galvanómetro de cero central"><rect class="face" x="4" y="4" width="232" height="132" rx="12"/>
  <path d="M${120 - 92 * Math.sin(50 * Math.PI / 180)},${120 - 92 * Math.cos(50 * Math.PI / 180)} A92,92 0 0 1 ${120 + 92 * Math.sin(50 * Math.PI / 180)},${120 - 92 * Math.cos(50 * Math.PI / 180)}" fill="none" stroke="var(--fg3)"/>
  ${ticks.join("")}${labs.join("")}<text x="120" y="96" text-anchor="middle" style="font-size:12px;fill:var(--fg2)" id="gunit">µA</text>
  <line class="needle" id="needle" x1="120" y1="122" x2="120" y2="34"/><circle cx="120" cy="122" r="6" fill="var(--fg2)"/></svg>`;
}

/* ---------- tablas ---------- */
function table1HTML(editable = true) {
  const rs = rows1();
  return tableHTML({
    id: "t1", caption: "Tabla 1. Datos del puente en equilibrio", head: ["N.º", "Muestra", "R₁ (Ω)", "R₂ (Ω)", "R₃ (Ω)", "Rₓ multímetro (Ω)", "Brazo multiplicador R₂/R₁", editable ? "" : null].filter(x => x !== null),
    rows: rs.map((r, i) => {
      const inp = (k) => editable ? `<input data-r="${i}" data-k="${k}" value="${isFinite(r[k]) ? fmt(r[k], k === "Rx" ? 1 : 0) : ""}" inputmode="decimal" aria-label="${k} fila ${i + 1}">` : fmt(r[k], k === "Rx" ? 1 : 0);
      const c = [i + 1, { v: r.m || "—", cls: "lbl" }, { v: inp("R1") }, { v: inp("R2") }, { v: inp("R3") }, { v: inp("Rx") }, fmtMult(+(r.R2 / r.R1).toPrecision(3))];
      if (editable) c.push({ v: `<button class="del" data-del="${i}" aria-label="Borrar fila ${i + 1}">✕</button>` });
      return c;
    })
  });
}
function t2rows() { return rows1().map(r => { const calc = r.R3 * r.R2 / r.R1; return { ...r, calc, er: Math.abs(r.Rx - calc) / r.Rx * 100 }; }); }
function table2HTML() {
  return tableHTML({
    id: "t2", caption: "Tabla 2. Resistencia calculada con la condición de equilibrio y error porcentual", head: ["N.º", "Muestra", "Rₓ calculada = R₃·R₂/R₁ (Ω)", "Rₓ multímetro (Ω)", "Error (%)"],
    rows: t2rows().map((r, i) => [i + 1, { v: r.m || "—", cls: "lbl" }, fmtS(r.calc, 5), fmtS(r.Rx, 5), { v: fmt(r.er, 2), cls: r.er < 1 ? "" : "" }])
  });
}

/* ---------- páginas ---------- */
const PAGES = [
{
  id: "portada", cover: true, group: "Inicio", nav: "Portada", html: () => coverHTML()
},
{
  id: "introduccion", group: "Inicio", nav: "Objetivos y materiales",
  eyebrow: "Introducción", title: "Objetivos, materiales y ruta de trabajo",
  html: () => `<div class="grid2">
    <div class="card"><h3>Objetivos</h3><ul class="clean">
      <li>Montar un puente de Wheatstone y llevarlo al equilibrio ajustando la caja de décadas R₃.</li>
      <li>Determinar resistencias desconocidas con la condición $R_x = R_3\\,\\dfrac{R_2}{R_1}$.</li>
      <li>Comparar el valor obtenido con la lectura del multímetro y calcular el error porcentual.</li>
      <li>Entender por qué la elección del brazo multiplicador fija la precisión de la medida.</li></ul></div>
    <div class="card"><h3>Materiales</h3><ul class="clean">
      <li>Fuente DC de 6 V y voltímetro</li><li>Galvanómetro de cero central con resistencia de protección</li>
      <li>Resistencias de precisión R₁ y R₂ (brazos de razón)</li><li>Caja de décadas R₃ (0 a 9 999 Ω, paso de 1 Ω)</li>
      <li>Resistencias problema Rₓ con código de colores</li><li>Multímetro digital y cables de conexión</li></ul></div>
  </div>
  <div class="stack"><h2>Ruta del cuaderno</h2><div class="steps">
    <div><b>Marco teórico</b><br><span class="small">Condición de equilibrio, galvanómetro y sensibilidad.</span></div>
    <div><b>Datos experimentales</b><br><span class="small">Montaje virtual de la Figura 1 y Tabla 1.</span></div>
    <div><b>Análisis</b><br><span class="small">Tabla 2: Rₓ calculada y error porcentual.</span></div>
    <div><b>Preguntas y conclusiones</b><br><span class="small">Respuestas, autoevaluación e informe final.</span></div></div></div>
  <div class="callout acc"><b>Tus datos se quedan en este navegador.</b> Las tablas, respuestas y conclusiones se guardan solas. Si trabajas en el laboratorio físico, puedes escribir tus propias mediciones en la Tabla 1.</div>`
},
{
  id: "teoria", group: "Marco teórico", nav: "Condición de equilibrio",
  eyebrow: "1 · Marco teórico", title: "El puente y su condición de equilibrio",
  html: () => `
  <p class="lead">El puente está formado por dos divisores de voltaje conectados a la misma fuente. El galvanómetro G une sus puntos medios y solo compara potenciales: si son iguales, por él no circula corriente.</p>
  <div class="grid2">
    <div class="card stack"><h3>Dos divisores en paralelo</h3>
      <p>En la Figura 1, el nodo izquierdo está entre R₃ y Rₓ, y el derecho entre R₁ y R₂. Con la fuente de fem $\\varepsilon$, sus potenciales respecto al nodo inferior son</p>
      <div class="eq">$$V_L=\\varepsilon\\,\\frac{R_x}{R_3+R_x},\\qquad V_R=\\varepsilon\\,\\frac{R_2}{R_1+R_2}.$$</div>
      <p>El puente está <b>equilibrado</b> cuando $V_L=V_R$, es decir, cuando $I_g=0$.</p></div>
    <div class="card stack"><h3>Deducción</h3>
      <p>Sin corriente por G, la corriente $I_a$ que pasa por R₃ sigue por Rₓ y la corriente $I_b$ que pasa por R₁ sigue por R₂. Las caídas de voltaje a cada lado del galvanómetro son iguales:</p>
      <div class="eq">$$I_a R_3 = I_b R_1,\\qquad I_a R_x = I_b R_2.$$</div>
      <p>Dividiendo una ecuación entre la otra desaparecen las corrientes y la fem:</p>
      <div class="eq">$$\\boxed{R_x = R_3\\,\\frac{R_2}{R_1}}$$</div></div>
  </div>
  <div class="callout"><b>Lo importante:</b> el resultado no depende de $\\varepsilon$ ni de la calibración del galvanómetro. Solo exige saber cuándo $I_g=0$ y conocer bien R₁, R₂ y R₃. Por eso el método es más preciso que un óhmetro sencillo.</div>
  <div class="card stack"><h3>Brazo multiplicador</h3>
    <p>El cociente $M = R_2/R_1$ se llama brazo multiplicador o brazo de razón. Con él, $R_x = M\\,R_3$. Si la caja de décadas va de 1 Ω a 9 999 Ω, el multiplicador decide qué rango de resistencias puedes medir y con cuántas cifras.</p>
    ${tableHTML({ caption: "Rango cubierto por cada multiplicador con una caja de décadas de 1 Ω a 9 999 Ω", head: ["M = R₂/R₁", "R₁ (Ω)", "R₂ (Ω)", "Rₓ mínima", "Rₓ máxima", "Resolución en Rₓ"], rows: MULT.map(([m, a, b]) => [fmtMult(m), a, b, fmtOhm(m * 1), fmtOhm(m * 9999), fmtOhm(m)]) })}
  </div>`
},
{
  id: "sensibilidad", group: "Marco teórico", nav: "Galvanómetro y sensibilidad",
  eyebrow: "1 · Marco teórico", title: "Galvanómetro, sensibilidad y elección del multiplicador",
  html: () => `
  <p class="lead">Fuera del equilibrio, el puente se comporta como una fuente de Thévenin conectada al galvanómetro. Esto explica cuánto se mueve la aguja cuando cambias R₃ en un ohmio.</p>
  <div class="grid2">
    <div class="card stack"><h3>Equivalente de Thévenin entre los nodos del galvanómetro</h3>
      <div class="eq">$$V_{th}=\\varepsilon\\left(\\frac{R_x}{R_3+R_x}-\\frac{R_2}{R_1+R_2}\\right)$$</div><div class="eq">$$R_{th}=\\frac{R_3R_x}{R_3+R_x}+\\frac{R_1R_2}{R_1+R_2}$$</div>
      <div class="eq">$$I_g=\\frac{V_{th}}{R_{th}+R_g}$$</div>
      <p class="small">$R_g$ es la resistencia del galvanómetro. En modo grueso se le suma una resistencia de protección de 10 kΩ, así la aguja no se daña cuando el puente está muy desequilibrado.</p></div>
    <div class="card stack"><h3>Procedimiento recomendado</h3><ul class="clean">
      <li>Lee el valor nominal de Rₓ con el código de colores.</li>
      <li>Escoge M para que R₃ quede entre 1 000 Ω y 9 999 Ω: así usas las cuatro décadas.</li>
      <li>Equilibra primero en <b>grueso</b> y termina en <b>fino</b>.</li>
      <li>Si la aguja pasa de un lado a otro entre dos valores consecutivos de R₃, registra el que la deja más cerca de cero.</li></ul></div>
  </div>
  <div class="card stack">
    <div class="row" style="justify-content:space-between"><h3>Curva de corriente del galvanómetro</h3><span class="small">Se calcula con el valor nominal de la muestra</span></div>
    <div class="row">
      <label class="f">Muestra<select id="sxS">${RX.map(r => `<option value="${r.k}">${r.k} · ${fmtOhm(r.nom)}</option>`).join("")}</select></label>
      <div><div class="meterlbl">Multiplicador M</div><div class="seg" id="sxM">${MULT.map(([m]) => `<button data-m="${m}" aria-pressed="false">×${fmtMult(m)}</button>`).join("")}</div></div>
    </div>
    <div id="sxPlane"></div>
    <div id="sxInfo" class="callout acc"></div>
  </div>`,
  mount(el) {
    const s = sim(); let k = s.sample, m = +(s.R2 / s.R1).toPrecision(3); if (!MULT.find(x => x[0] === m)) m = 1;
    const P = new CartesianPlane($("#sxPlane", el), { id: "sens", height: 340, xLabel: "R₃ (Ω)", yLabel: "Ig (µA)", includeOrigin: false });
    const draw = () => {
      $("#sxS", el).value = k; $$("#sxM button", el).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.m === m)));
      const [, R1, R2] = MULT.find(x => x[0] === m), Rx = RX.find(r => r.k === k).nom, R3e = Rx * R1 / R2;
      const ig = (R3, g) => solveBridge({ R1, R2, R3, Rx, Rg: R_G + (g ? R_PROT : 0) }).Ig * 1e6;
      const span = Math.max(R3e * 0.05, 8);
      P.setSeries([
        { id: "fino", type: "fn", f: R3 => ig(R3, false), label: "Fino (sin protección)", color: "--c2" },
        { id: "grueso", type: "fn", f: R3 => ig(R3, true), label: "Grueso (10 kΩ en serie)", color: "--c1", dash: "dash" },
        { id: "eq", type: "vline", x: R3e, color: "--c3", dash: "dot", label: "equilibrio", noLegend: true }], false);
      P.setView({ xmin: R3e - span, xmax: R3e + span, ymin: -12, ymax: 12 });
      const sens = Math.abs(ig(R3e + 1, false) - ig(R3e, false));
      const ok = R3e >= 1000 && R3e <= 9999;
      $("#sxInfo", el).innerHTML = `Con M = ${fmtMult(m)} el equilibrio se alcanza en R₃ ≈ <b class="mono">${fmtS(R3e, 5)} Ω</b>. ${R3e > 9999 ? "<b>Fuera del rango de la caja de décadas:</b> aumenta el multiplicador." : R3e < 1 ? "<b>R₃ sería menor que 1 Ω:</b> reduce el multiplicador." : ""}
      Un paso de 1 Ω en R₃ mueve la aguja unos <b class="mono">${fmtS(sens, 2)} µA</b> en modo fino y cambia Rₓ en <b class="mono">${fmtOhm(m)}</b>, es decir, <b class="mono">${fmt(m / Rx * 100, 3)} %</b> del valor. ${ok ? '<span class="pill ok">Multiplicador adecuado</span>' : '<span class="pill warn">Prueba otro multiplicador</span>'}`;
    };
    $("#sxS", el).onchange = e => { k = e.target.value; draw(); };
    $$("#sxM button", el).forEach(b => b.onclick = () => { m = +b.dataset.m; draw(); });
    draw();
  }
},
{
  id: "laboratorio", group: "Datos experimentales", nav: "Laboratorio virtual",
  eyebrow: "2 · Datos experimentales", title: "Montaje de la Figura 1 y equilibrio del puente",
  html: () => `
  <p class="lead">Escoge una resistencia problema, fija el brazo multiplicador y gira las décadas de R₃ hasta que la aguja del galvanómetro quede en cero. Luego registra la medición en la Tabla 1.</p>
  <div class="bench">
    <div class="stage" id="stage">${circuitSVG()}</div>
    <div class="ctrls">
      <div class="card tight stack">
        <label class="f">Resistencia problema Rₓ<select id="smp">${RX.map(r => `<option value="${r.k}">Muestra ${r.k}</option>`).join("")}</select></label>
        <div class="rxchip"><span id="chip"></span><span class="small" id="chipTxt"></span></div>
      </div>
      <div class="card tight stack"><div class="meterlbl">Brazo multiplicador M = R₂/R₁</div>
        <div class="seg" id="mseg">${MULT.map(([m]) => `<button data-m="${m}" aria-pressed="false">×${fmtMult(m)}</button>`).join("")}</div>
        <div class="row" style="gap:10px"><label class="f">R₁ (Ω)<select id="r1">${RSET.map(v => `<option>${v}</option>`).join("")}</select></label>
          <label class="f">R₂ (Ω)<select id="r2">${RSET.map(v => `<option>${v}</option>`).join("")}</select></label></div></div>
      <div class="card tight stack"><div class="row" style="justify-content:space-between"><div class="meterlbl" style="margin:0">Caja de décadas R₃</div><b class="mono" id="r3v"></b></div>
        <div class="decades">${["×1000", "×100", "×10", "×1"].map((t, i) => `<div class="dec"><span class="k">${t}</span><span class="d" id="d${i}">0</span>
          <span class="pm"><button data-i="${i}" data-s="-1" aria-label="Bajar década ${t}">−</button><button data-i="${i}" data-s="1" aria-label="Subir década ${t}">+</button></span></div>`).join("")}</div></div>
    </div>
  </div>
  <div class="grid2">
    <div class="card tight stack galv"><div class="row" style="justify-content:space-between"><div class="meterlbl" style="margin:0">Galvanómetro</div>
      <div class="seg" id="sens"><button data-s="grueso" aria-pressed="false">Grueso</button><button data-s="fino" aria-pressed="false">Fino</button></div></div>
      ${galvSVG()}<div class="status" id="gstat"></div></div>
    <div class="card tight stack">
      <div class="grid2" style="gap:10px"><div><div class="meterlbl">Voltímetro (fuente)</div><div class="meter" id="vm">0,00<small>V</small></div></div>
        <div><div class="meterlbl">Multímetro (Rₓ)</div><div class="meter" id="om">— — —</div></div></div>
      <button class="btn" id="measure">Medir Rₓ con el multímetro</button>
      <button class="btn pri" id="rec">Registrar en la Tabla 1</button>
      <p class="small">Antes de medir Rₓ con el multímetro, en el laboratorio real se desconecta la resistencia del circuito.</p></div>
  </div>
  <div class="stack"><div class="row" style="justify-content:space-between"><h2>Tabla 1</h2><div class="row">${copyBtn("#t1")}<button class="btn sm" id="addrow">Agregar fila manual</button></div></div>
    <div id="t1wrap">${table1HTML()}</div>
    <p class="small">Puedes corregir cualquier valor de la tabla. Para datos del laboratorio físico, usa “Agregar fila manual”.</p></div>`,
  mount(el) {
    let s = sim(); const sp = { th: 0, v: 0 }; const flowOff = {}; let B = bridgeNow(s);
    const paint = () => {
      saveSim(s); B = bridgeNow(s);
      $("#smp", el).value = s.sample; const r = RX.find(x => x.k === s.sample);
      $("#chip", el).innerHTML = resistorChip(r.b); $("#chipTxt", el).textContent = `Código de colores: ${fmtOhm(r.nom)} ± 5 %`;
      $("#r1", el).value = s.R1; $("#r2", el).value = s.R2;
      const m = +(s.R2 / s.R1).toPrecision(3); $$("#mseg button", el).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.m === m && MULT.find(x => x[0] === m)[1] === s.R1)));
      s.dec.forEach((d, i) => $("#d" + i, el).textContent = d); $("#r3v", el).textContent = fmt(R3of(s.dec), 0) + " Ω";
      $$("#sens button", el).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.s === s.sens)));
      const fs = FS[s.sens] * 1e6; $$('.galv text[data-k]', el).forEach(t => t.textContent = String(+t.dataset.k * fs / 10).replace(".", ","));
      $("#tR3", el).textContent = fmt(R3of(s.dec), 0) + " Ω"; $("#tR1", el).textContent = s.R1 + " Ω"; $("#tR2", el).textContent = s.R2 + " Ω"; $("#tRx", el).textContent = "?";
      $("#vm", el).innerHTML = fmt(B.VT, 2) + "<small>V</small>";
      const meas = Store.get("rxMeas", {})[s.sample]; $("#om", el).innerHTML = meas ? (meas >= 1000 ? fmt(meas / 1000, meas >= 1e5 ? 1 : meas >= 1e4 ? 2 : 3) + "<small>kΩ</small>" : fmt(meas, 1) + "<small>Ω</small>") : "— — —";
      const rel = Math.abs(B.Ig) / FS[s.sens];
      $("#gstat", el).innerHTML = Math.abs(B.Ig) < 0.15e-6 ? '<span class="pill ok">Aguja en cero: puente equilibrado</span>' : rel > 1 ? '<span class="pill bad">Aguja fuera de escala</span> <span class="small">Ajusta las décadas grandes primero.</span>' : `<span class="pill warn">La aguja se desvía hacia ${B.Ig > 0 ? "la derecha" : "la izquierda"}</span> <span class="small">${B.Ig > 0 ? "Aumenta" : "Disminuye"} R₃.</span>`;
    };
    $("#smp", el).onchange = e => { s.sample = e.target.value; paint(); };
    $$("#mseg button", el).forEach(b => b.onclick = () => { const [, a, c] = MULT.find(x => x[0] === +b.dataset.m); s.R1 = a; s.R2 = c; paint(); });
    $("#r1", el).onchange = e => { s.R1 = +e.target.value; paint(); }; $("#r2", el).onchange = e => { s.R2 = +e.target.value; paint(); };
    $$(".dec .pm button", el).forEach(b => b.onclick = () => { const i = +b.dataset.i; s.dec[i] = (s.dec[i] + +b.dataset.s + 10) % 10; paint(); });
    $$(".dec .d", el).forEach((d, i) => d.addEventListener("wheel", e => { e.preventDefault(); s.dec[i] = (s.dec[i] + (e.deltaY < 0 ? 1 : -1) + 10) % 10; paint(); }, { passive: false }));
    $$("#sens button", el).forEach(b => b.onclick = () => { s.sens = b.dataset.s; paint(); });
    const measure = () => { const t = rxTrue(s.sample); let v = t * (1 + 0.0015 * gauss()); v = +v.toPrecision(4); const mm = Store.get("rxMeas", {}); mm[s.sample] = v; Store.set("rxMeas", mm); paint(); return v; };
    $("#measure", el).onclick = () => { measure(); toast("Lectura del multímetro registrada para la muestra " + s.sample); };
    const redrawT = () => { $("#t1wrap", el).innerHTML = table1HTML(); bindT(); };
    const bindT = () => {
      $$("#t1 input", el).forEach(inp => inp.onchange = () => { const rs = rows1(); const v = num(inp.value); if (isFinite(v) && v > 0) { rs[+inp.dataset.r][inp.dataset.k] = v; Store.set("t1", rs); } redrawT(); });
      $$("#t1 [data-del]", el).forEach(b => b.onclick = () => { const rs = rows1(); rs.splice(+b.dataset.del, 1); Store.set("t1", rs); redrawT(); });
    };
    $("#rec", el).onclick = () => {
      const meas = Store.get("rxMeas", {})[s.sample] || measure();
      const rs = rows1(); rs.push({ m: s.sample, R1: s.R1, R2: s.R2, R3: R3of(s.dec), Rx: meas }); Store.set("t1", rs); redrawT();
      toast(Math.abs(B.Ig) > 0.5e-6 || s.sens === "grueso" ? "Registrado. Ojo: confirma el equilibrio en modo fino." : "Medición registrada en la Tabla 1");
    };
    $("#addrow", el).onclick = () => { const rs = rows1(); rs.push({ m: "Manual", R1: 1000, R2: 1000, R3: NaN, Rx: NaN }); Store.set("t1", rs); redrawT(); };
    bindT(); paint();
    // animación: aguja con amortiguamiento y flujo de corriente
    let last = performance.now();
    NB.raf(t => {
      const dt = Math.min(.05, (t - last) / 1000); last = t;
      const tgt = clamp(B.Ig / FS[s.sens], -1.12, 1.12);
      sp.v += (70 * (tgt - sp.th) - 9 * sp.v) * dt; sp.th += sp.v * dt;
      const a = sp.th * 50 * Math.PI / 180;
      const nd = $("#needle", el); if (nd) { nd.setAttribute("x2", 120 + 88 * Math.sin(a)); nd.setAttribute("y2", 122 - 88 * Math.cos(a)); }
      const gn = $("#gneedle", el); if (gn) { gn.setAttribute("x2", 430 + 22 * Math.sin(a)); gn.setAttribute("y2", 226 - 22 * Math.cos(a)); }
      const Imax = Math.max(Math.abs(B.I1), Math.abs(B.I3), 1e-9);
      const I = { src: B.I1 + B.I3, ret: B.I1 + B.I3, I3: B.I3, I1: B.I1, Ix: B.Ix, I2: B.I2 };
      $$("#flows .flow", el).forEach(p => {
        const k = p.dataset.b; let v;
        if (k === "Ig") v = clamp(B.Ig / FS[s.sens], -1, 1) * 70; else { const r = I[k] / Imax; v = Math.sign(r) * (18 + 45 * Math.min(1, Math.abs(r))); }
        flowOff[k] = ((flowOff[k] || 0) - v * dt) % 1400; p.style.strokeDashoffset = flowOff[k]; p.style.opacity = Math.abs(v) < 0.6 ? 0 : .9;
      });
    });
  }
},
{
  id: "analisis", group: "Análisis", nav: "Tabla 2 y error",
  eyebrow: "3 · Análisis", title: "Resistencia calculada y error porcentual",
  html: () => `
  <p class="lead">Con los datos de la Tabla 1 se calcula Rₓ con la condición de equilibrio y se compara con la lectura del multímetro.</p>
  <div class="grid2">
    <div class="card"><div class="eq">$$R_{x,\\text{calc}}=R_3\\,\\frac{R_2}{R_1}$$</div></div>
    <div class="card"><div class="eq">$$E_r=\\frac{\\left|R_{x,\\text{mult}}-R_{x,\\text{calc}}\\right|}{R_{x,\\text{mult}}}\\times 100\\,\\%$$</div></div>
  </div>
  <div class="stack"><div class="row" style="justify-content:space-between"><h2>Tabla 2</h2>${copyBtn("#t2")}</div><div>${table2HTML()}</div></div>
  <div class="card stack"><h3>Error porcentual por medición</h3><div id="erPlane"></div><div id="erInfo" class="small"></div></div>`,
  mount(el) {
    const r = t2rows();
    const P = new CartesianPlane($("#erPlane", el), { id: "err", height: 300, xLabel: "Medición", yLabel: "Eᵣ (%)" });
    P.setSeries([{ id: "er", type: "points", data: r.map((x, i) => [i + 1, x.er]), label: "Error porcentual", color: "--c1", fmtX: v => "N.º " + v, fmtY: v => fmt(v, 2) + " %" }], true);
    if (!r.length) { P.setView({ xmin: -0.5, xmax: 6, ymin: -0.5, ymax: 3 }); $("#erInfo", el).textContent = "Registra mediciones en el laboratorio virtual para ver el gráfico."; }
    else $("#erInfo", el).textContent = `Error promedio: ${fmt(mean(r.map(x => x.er)), 2)} % · máximo: ${fmt(Math.max(...r.map(x => x.er)), 2)} % en ${r.length} mediciones.`;
  }
},
{
  id: "preguntas", group: "Preguntas", nav: "Preguntas del informe",
  eyebrow: "4 · Preguntas", title: "Preguntas",
  html: () => [
    ["p1", "Por medio de la Tabla 2, ¿qué puede concluir del puente de Wheatstone realizado en esta práctica? ¿Es confiable?", "Compara el error de cada medición con la tolerancia de las resistencias y con la exactitud del multímetro. Revisa si el error crece con alguna muestra o algún multiplicador y explica por qué. Recuerda que un paso de 1 Ω en R₃ equivale a M ohmios en Rₓ."],
    ["p2", "¿Qué pasa si se alimenta un puente de Wheatstone con corriente alterna?", "Con corriente alterna las ramas se describen con impedancias. La condición pasa a ser $Z_x = Z_3 Z_2/Z_1$ y debe cumplirse en magnitud y en fase. El detector también cambia: un galvanómetro de bobina móvil no responde a una señal alterna, se usan audífonos u osciloscopio. Así funcionan los puentes de Maxwell, Wien y Schering."],
    ["p3", "¿Cuáles son las aplicaciones del puente de Wheatstone?", "Piensa en sensores cuya resistencia cambia con una magnitud física: galgas extensiométricas, termómetros de resistencia (RTD), termistores, sensores de presión y fotorresistencias. También se usa para localizar fallas en cables (lazo de Murray)."]
  ].map(([k, q, h], i) => `<div class="card stack"><div class="row" style="gap:8px;align-items:baseline"><span class="qnum">${i + 1}</span><b>${q}</b></div>${answerBox(k)}<details class="hint"><summary>Orientación</summary><p>${h}</p></details></div>`).join("")
},
{
  id: "conclusiones", group: "Conclusiones", nav: "Conclusiones y autoevaluación",
  eyebrow: "5 · Conclusiones", title: "Conclusiones y autoevaluación",
  html: () => `<div class="card stack"><h3>Escribe 3 conclusiones con respecto a la práctica</h3>
    ${[1, 2, 3].map(i => `<label class="f">Conclusión ${i}${answerBox("c" + i, "Una conclusión respaldada por tus datos…")}</label>`).join("")}</div>
    <h2>Autoevaluación</h2><div id="quiz" class="stack"></div>`,
  mount(el) {
    quiz($("#quiz", el), "q5", [
      { q: "En el equilibrio del puente, la corriente por el galvanómetro es:", o: ["Máxima", "Igual a la corriente de la fuente", "Cero", "Igual a la corriente por Rₓ"], a: 2, why: "El equilibrio se define como $I_g = 0$; por eso los nodos L y R están al mismo potencial." },
      { q: "Si R₁ = 100 Ω, R₂ = 1 000 Ω y el equilibrio ocurre con R₃ = 4 712 Ω, ¿cuánto vale Rₓ?", o: ["471,2 Ω", "4 712 Ω", "47 120 Ω", "47,12 Ω"], a: 2, why: "$R_x = R_3 R_2/R_1 = 4712 \\times 10 = 47\\,120\\ \\Omega$." },
      { q: "¿Por qué la fem de la fuente no aparece en la condición de equilibrio?", o: ["Porque la fuente es ideal", "Porque se cancela al dividir las dos relaciones entre caídas de voltaje", "Porque la corriente total es cero", "Porque el galvanómetro la compensa"], a: 1, why: "Ambos divisores reciben el mismo voltaje; al igualar $V_L$ y $V_R$ la fem queda a ambos lados y se cancela." },
      { q: "Para medir una resistencia de unos 68 Ω con una caja de décadas de 1 a 9 999 Ω, el multiplicador más adecuado es:", o: ["×100", "×10", "×1", "×0,01"], a: 3, why: "Con M = 0,01 el equilibrio queda en R₃ ≈ 6 800 Ω y se usan las cuatro décadas: la resolución es 0,01 Ω." },
      { q: "¿Para qué sirve la resistencia de protección del modo grueso?", o: ["Aumenta la sensibilidad", "Limita la corriente por el galvanómetro cuando el puente está muy desequilibrado", "Cambia la condición de equilibrio", "Compensa la resistencia interna de la fuente"], a: 1, why: "Al aumentar la resistencia de la rama del detector, la corriente es pequeña aunque el desequilibrio sea grande. No cambia el punto de equilibrio." }]);
  }
},
{ id: "informe", group: "Cierre", nav: "Mi informe", eyebrow: "Cierre", title: "Mi informe",
  html: () => reportHTML(table1HTML(false) + table2HTML(), ["p1", "p2", "p3"]),
  mount(el) { bindReport(el, "INFORME 5 · CONSTRUCCIÓN DE UN PUENTE DE WHEATSTONE", ["p1", "p2", "p3"]); } }
];

NB.init({ storeKey: "utp-lab2-wheatstone", numero: 5, practica: "Construcción de un puente de Wheatstone", illustration: illWheatstone(), pages: PAGES });
