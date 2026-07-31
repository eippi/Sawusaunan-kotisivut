/**
 * Uusii pitkäikäisen Instagram-tokenin.
 *
 * Token on voimassa 60 vrk ja sen voi uusia aikaisintaan 24 h myöntämisen
 * jälkeen. Jos se ehtii vanhentua, sitä EI voi enää uusia — koko valtuutus
 * on tehtävä alusta. Siksi tämä ajetaan päivittäin.
 *
 * Tulostaa uuden tokenin GitHub Actionsin output-muuttujaan ja maskaa sen
 * lokista.
 */

import { appendFile } from "node:fs/promises";

const TOKEN = process.env.INSTAGRAM_TOKEN;
if (!TOKEN) {
  console.error("INSTAGRAM_TOKEN puuttuu.");
  process.exit(1);
}

const url =
  "https://graph.instagram.com/refresh_access_token" +
  `?grant_type=ig_refresh_token&access_token=${encodeURIComponent(TOKEN)}`;

const res = await fetch(url);
const json = await res.json();

if (!res.ok || !json.access_token) {
  console.error("Tokenin uusinta epäonnistui:", JSON.stringify(json.error || json));
  console.error(
    "Jos token on jo vanhentunut, aja scripts/instagram-token.mjs uudelleen.",
  );
  process.exit(1);
}

const days = Math.round((json.expires_in || 0) / 86400);
console.log(`::add-mask::${json.access_token}`);
console.log(`Token uusittu, voimassa noin ${days} vrk.`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `token=${json.access_token}\n`);
  await appendFile(process.env.GITHUB_OUTPUT, `days=${days}\n`);
}
