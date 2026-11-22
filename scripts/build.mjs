import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

// Limite por arquivo no plano gratuito de Workers Static Assets.
const MAX_BYTES = 25 * 1024 * 1024;

const required = [
  "index.html",
  "assets/css/styles.css",
  "assets/js/main.js",
  "assets/favicon.svg",
  "assets/og-image.png",
  "_headers",
];

const forbidden = [
  "Dockerfile",
  "nginx.conf",
  "README.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "wrangler.jsonc",
  "package.json",
  "package-lock.json",
  ".github",
  "node_modules",
  "scripts",
  ".git",
  ".wrangler",
];

const secretName =
  /(^|\/)(\.env($|\.)|\.dev\.vars$|id_rsa$|.*\.(pem|key)$|credentials\.json$)/i;

const fail = (message) => {
  console.error(`build: ${message}`);
  process.exitCode = 1;
};

const copyFile = async (from, to) => {
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to);
};

const walk = async (dir, rel = "") => {
  const items = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const item of items) {
    const relPath = rel ? `${rel}/${item.name}` : item.name;
    const full = path.join(dir, item.name);

    if (item.isSymbolicLink()) {
      fail(`${relPath} é um link simbólico e não entra no output`);
      continue;
    }

    if (item.isDirectory()) {
      files.push(...(await walk(full, relPath)));
      continue;
    }

    const info = await stat(full);
    if (info.size > MAX_BYTES) {
      fail(
        `${relPath} tem ${info.size} bytes e passa de 25 MiB. O plano gratuito de Workers Static Assets recusa o deploy. Publique o DMG no GitHub Release e deixe o fallback de index.html apontando para lá.`
      );
    }
    if (secretName.test(relPath)) {
      fail(`${relPath} parece um segredo e não pode ir para o output`);
    }
    files.push(relPath);
  }

  return files;
};

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await copyFile(path.join(root, "index.html"), path.join(dist, "index.html"));
await cp(path.join(root, "assets"), path.join(dist, "assets"), {
  recursive: true,
  verbatimSymlinks: false,
});
await copyFile(path.join(root, "_headers"), path.join(dist, "_headers"));

const downloadEntries = await readdir(path.join(root, "downloads"), {
  withFileTypes: true,
});
for (const entry of downloadEntries) {
  if (entry.name === "README.md" || entry.name.startsWith(".")) continue;
  await copyFile(
    path.join(root, "downloads", entry.name),
    path.join(dist, "downloads", entry.name)
  );
}

const files = (await walk(dist)).sort();

for (const name of required) {
  if (!files.includes(name)) fail(`output sem ${name}`);
}

for (const name of forbidden) {
  if (files.some((file) => file === name || file.startsWith(`${name}/`))) {
    fail(`output vazou ${name}`);
  }
}

const html = await readFile(path.join(dist, "index.html"), "utf8");
if (!html.includes("https://clp.erick.page/")) {
  fail("index.html perdeu a URL canônica https://clp.erick.page/");
}

const localRefs = [
  ...html.matchAll(/(?:href|src)="(\/[^"?#]+)"/g),
].map((match) => match[1].replace(/^\//, ""));
for (const ref of localRefs) {
  if (!files.includes(ref)) fail(`index.html aponta para /${ref}, ausente no output`);
}

const headers = await readFile(path.join(dist, "_headers"), "utf8");
for (const needle of [
  "/assets/*",
  "Cache-Control: public, max-age=3600, must-revalidate",
  "/downloads/*",
  "Content-Disposition: attachment",
  "X-Robots-Tag: noindex",
]) {
  if (!headers.includes(needle)) fail(`_headers sem ${needle}`);
}

const css = await readFile(path.join(dist, "assets/css/styles.css"), "utf8");
const js = await readFile(path.join(dist, "assets/js/main.js"), "utf8");
const svg = await readFile(path.join(dist, "assets/favicon.svg"), "utf8");
if (!css.trim()) fail("styles.css vazio");
if (!js.includes("data-download")) fail("main.js não atualiza os botões de download");
if (!svg.includes("<svg")) fail("favicon.svg inválido");

const png = await readFile(path.join(dist, "assets/og-image.png"));
const pngSignature = png.subarray(0, 8).toString("hex");
if (pngSignature !== "89504e470d0a1a0a") fail("og-image.png não é um PNG");

if (process.exitCode) process.exit(process.exitCode);

console.log(`dist/ ok — ${files.length} arquivos`);
for (const file of files) console.log(`  ${file}`);
