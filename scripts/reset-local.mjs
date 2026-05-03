/**
 * Detiene procesos que suelen ocupar puertos locales del proyecto,
 * borra artefactos de build/cachés y opcionalmente deja el árbol listo para rebuild.
 *
 * Ejecutar desde la raíz del repo: node scripts/reset-local.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Puertos típicos: Next dev/start, prisma studio alternativo */
const PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 5555];

function banner(msg) {
  process.stderr.write(`\n${"=".repeat(72)}\n${msg}\n${"=".repeat(72)}\n`);
}

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -nP -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (!out) return [];
    return [...new Set(out.split(/\s+/).flatMap((line) => line.split("\n")).filter(Boolean))];
  } catch {
    return [];
  }
}

function killPid(pid, signal) {
  try {
    process.kill(Number(pid), signal);
    return true;
  } catch {
    return false;
  }
}

banner(`[menuly] reset local — ${root}`);

if (process.platform === "win32") {
  process.stderr.write(
    "[menuly] En Windows debes cerrar a mano `next dev` / terminales y borrar .next; este script solo limpia carpetas.\n"
  );
} else {
  process.stderr.write("[menuly] Liberando puertos (SIGTERM, luego SIGKILL si hace falta)…\n");
  for (const port of PORTS) {
    const pids = pidsOnPort(port);
    for (const pid of pids) {
      process.stderr.write(`  puerto ${port}: SIGTERM pid ${pid}\n`);
      killPid(pid, "SIGTERM");
    }
  }
  await new Promise((r) => setTimeout(r, 1200));
  for (const port of PORTS) {
    const pids = pidsOnPort(port);
    for (const pid of pids) {
      process.stderr.write(`  puerto ${port}: SIGKILL pid ${pid}\n`);
      killPid(pid, "SIGKILL");
    }
  }
}

const toRemove = [
  path.join(root, ".next"),
  path.join(root, "out"),
  path.join(root, "build"),
  path.join(root, ".turbo"),
  path.join(root, "node_modules", ".cache"),
  path.join(root, "build-local.last.log"),
];

process.stderr.write("\n[menuly] Eliminando artefactos de build…\n");
for (const target of toRemove) {
  try {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      process.stderr.write(`  ok: ${path.relative(root, target) || target}\n`);
    }
  } catch (err) {
    process.stderr.write(`  error: ${target} — ${err?.message ?? err}\n`);
  }
}

const tsBuildInfo = path.join(root, "tsconfig.tsbuildinfo");
try {
  if (fs.existsSync(tsBuildInfo)) {
    fs.rmSync(tsBuildInfo, { force: true });
    process.stderr.write(`  ok: tsconfig.tsbuildinfo\n`);
  }
} catch (err) {
  process.stderr.write(`  error tsconfig.tsbuildinfo: ${err?.message ?? err}\n`);
}

banner(
  "[menuly] reset local terminado.\n" +
    "→ Producción local: npm run build:clean   luego   npm run start\n" +
    "→ Desarrollo: npm run dev   (sin esto http://localhost:3000 da error -102 / conexión rechazada)\n"
);
process.exit(0);
