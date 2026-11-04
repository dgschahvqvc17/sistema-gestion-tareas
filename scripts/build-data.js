/* Genera data/cartas.js y data/configuracion.js a partir de los JSON,
   para que la app funcione también al abrir index.html con file://.
   Uso: node scripts/build-data.js */

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

const sources = [
  { json: "cartas.json", js: "cartas.js", key: "cards" },
  { json: "configuracion.json", js: "configuracion.js", key: "config" },
];

for (const { json, js, key } of sources) {
  const value = JSON.parse(fs.readFileSync(path.join(dataDir, json), "utf8"));
  const output = [
    `/* Archivo generado por scripts/build-data.js desde ${json}. No editar a mano. */`,
    "window.POKECARDS_FALLBACK = window.POKECARDS_FALLBACK || {};",
    `window.POKECARDS_FALLBACK.${key} = ${JSON.stringify(value, null, 2)};`,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(dataDir, js), output, "utf8");
  console.log(`Generado data/${js}`);
}
