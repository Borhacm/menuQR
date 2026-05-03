/**
 * Build local con salida visible (stdio inherit = TTY, evita buffering al usar pipes).
 * Escribe siempre build-local.last.log con resultado final por si hay que revisar después.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const logFile = path.join(root, "build-local.last.log");
const started = new Date().toISOString();

function banner(lines) {
  const text = lines.join("\n");
  process.stderr.write(`\n${"=".repeat(72)}\n${text}\n${"=".repeat(72)}\n\n`);
}

banner([
  `[menuly] build local — ${started}`,
  `cwd: ${root}`,
  `node: ${process.version}`,
  `platform: ${process.platform}`,
]);

if (!fs.existsSync(nextBin)) {
  process.stderr.write(
    `[menuly] ERROR: Next no encontrado en:\n  ${nextBin}\nDesde esta carpeta ejecuta: npm install\n`
  );
  fs.writeFileSync(logFile, `ERROR: Next CLI missing.\nExpected: ${nextBin}\n`, "utf8");
  process.exit(1);
}

const nextDir = path.join(root, ".next");
process.stderr.write(`[menuly] Borrando .next …\n`);
try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  process.stderr.write(`[menuly] .next listo.\n\n`);
} catch (err) {
  process.stderr.write(`[menuly] AVISO al borrar .next: ${err?.message ?? err}\n\n`);
}

const env = {
  ...process.env,
  FORCE_COLOR: process.env.FORCE_COLOR ?? "1",
};

process.stderr.write(`[menuly] prisma generate (evita cliente Prisma desfasado del schema)…\n`);
const prismaGen = spawnSync("npx", ["prisma", "generate", "--no-hints"], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (prismaGen.status !== 0) {
  process.stderr.write(
    `[menuly] ERROR: prisma generate falló (código ${prismaGen.status}). Corrige schema/instalación antes de build.\n`
  );
  process.exit(typeof prismaGen.status === "number" ? prismaGen.status : 1);
}
process.stderr.write(`[menuly] Prisma client listo.\n\n`);

process.stderr.write(`[menuly] next build (salida directa en este terminal)\n`);
process.stderr.write(`[menuly] resumen después en: ${logFile}\n\n`);

const run = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  env,
  /** Evita buffering de Webpack/Turbopack al detectar pipes; el usuario ve progreso al instante */
  stdio: "inherit",
});

const finished = new Date().toISOString();
const exitCode =
  typeof run.status === "number" ? run.status : run.error ? 1 : 1;

fs.writeFileSync(
  logFile,
  [
    `menuly build-local`,
    `started: ${started}`,
    `finished: ${finished}`,
    `cwd: ${root}`,
    `node: ${process.version}`,
    `exit: ${exitCode}`,
    run.error ? `spawn error: ${run.error.message}` : "",
    "",
  ]
    .filter(Boolean)
    .join("\n") + "\n",
  "utf8"
);

process.stderr.write(
  `\n${"=".repeat(72)}\n[menuly] build terminado — código ${exitCode}\nfinalizado: ${finished}\nlog: ${logFile}\n${"=".repeat(72)}\n`
);

process.exit(exitCode);
