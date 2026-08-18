/**
 * Hakee Sawusaunan uusimmat Instagram-julkaisut, lataa kuvat repoon ja
 * kirjoittaa instagram.json.
 *
 * Ajetaan GitHub Actionsissa. Token luetaan ympäristömuuttujasta, se ei ole
 * koskaan koodissa eikä selaimessa.
 *
 * Kuvat ladataan repoon tarkoituksella: Instagramin media_url-osoitteet ovat
 * allekirjoitettuja ja vanhenevat muutamassa päivässä, joten pelkkien
 * osoitteiden tallentaminen tuottaisi rikkinäiset kuvat.
 */

import { mkdir, writeFile, readFile, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const TOKEN = process.env.INSTAGRAM_TOKEN;
const COUNT = Number(process.env.INSTAGRAM_COUNT || 6);
const IMAGE_DIR = "public/instagram";
const JSON_PATH = "instagram.json";
const WIDTH = 640;

if (!TOKEN) {
  console.error("INSTAGRAM_TOKEN puuttuu. Ei muuteta mitään.");
  process.exit(1);
}

const fields = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "permalink",
  "thumbnail_url",
  "timestamp",
].join(",");

const url =
  "https://graph.instagram.com/me/media" +
  `?fields=${fields}&limit=25&access_token=${encodeURIComponent(TOKEN)}`;

const res = await fetch(url);
const json = await res.json();

if (!res.ok || json.error) {
  console.error("Instagram-haku epäonnistui:", JSON.stringify(json.error || json));
  process.exit(1);
}

const items = (json.data || [])
  // Videoista käytetään pikkukuvaa; muut tyypit ohitetaan
  .map((m) => ({
    ...m,
    src: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
  }))
  .filter((m) => m.src)
  .slice(0, COUNT);

if (!items.length) {
  console.error("Rajapinta ei palauttanut yhtään kuvaa. Ei muuteta mitään.");
  process.exit(1);
}

await mkdir(IMAGE_DIR, { recursive: true });

const firstLine = (caption) =>
  (caption || "")
    .split("\n")
    .map((s) => s.trim())
    .find(Boolean) || "";

// Instagramin id on käytännössä aina pelkkiä numeroita, mutta se päätyy
// tiedostonimeen — rajataan varmuuden vuoksi turvallisiin merkkeihin, jottei
// rajapinnan poikkeava vastaus voi koskaan tuottaa polkua kansion ulkopuolelle.
const safeId = (id) => String(id).replace(/[^A-Za-z0-9_-]/g, "");

const posts = [];
for (const m of items) {
  const id = safeId(m.id);
  if (!id) {
    console.error(`Kelvoton julkaisun id (${m.id}), ohitetaan.`);
    continue;
  }
  const imgRes = await fetch(m.src);
  if (!imgRes.ok) {
    console.error(`Kuvan lataus epäonnistui (${id}), ohitetaan.`);
    continue;
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const file = `${id}.webp`;

  await sharp(buf)
    .resize(WIDTH, WIDTH, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toFile(join(IMAGE_DIR, file));

  const line = firstLine(m.caption);
  posts.push({
    id,
    image: `/instagram/${file}`,
    permalink: m.permalink,
    timestamp: m.timestamp,
    caption: line.length > 120 ? line.slice(0, 119).trimEnd() + "…" : line,
    alt: line ? `Sawusaunan Instagram-julkaisu: ${line.slice(0, 90)}` : "Sawusaunan Instagram-julkaisu",
  });
}

if (!posts.length) {
  console.error("Yhtään kuvaa ei saatu ladattua. Ei muuteta mitään.");
  process.exit(1);
}

// Siivoa kuvat jotka eivät ole enää syötteessä
const keep = new Set(posts.map((p) => p.image.split("/").pop()));
for (const f of await readdir(IMAGE_DIR)) {
  if (f.endsWith(".webp") && !keep.has(f)) {
    await unlink(join(IMAGE_DIR, f));
  }
}

const next = { updated: new Date().toISOString(), posts };

// Kirjoita vain jos sisältö oikeasti muuttui, jottei synny turhia committeja
let prev = null;
try {
  prev = JSON.parse(await readFile(JSON_PATH, "utf8"));
} catch {}

const same =
  prev &&
  JSON.stringify(prev.posts?.map(({ id, caption }) => ({ id, caption }))) ===
    JSON.stringify(posts.map(({ id, caption }) => ({ id, caption })));

if (same) {
  console.log("Syöte ei muuttunut.");
  process.exit(0);
}

await writeFile(JSON_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
console.log(`Päivitetty ${posts.length} julkaisua.`);
