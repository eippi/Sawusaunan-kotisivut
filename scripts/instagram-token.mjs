/**
 * Hakee Instagramin pitkäikäisen (60 vrk) tokenin.
 *
 * Aja tämä KERRAN omalla koneella, kun Meta-sovellus on pystyssä.
 * Token ei saa päätyä chattiin, sähköpostiin eikä repoon — vie se suoraan
 * GitHubin repo-asetuksiin: Settings -> Secrets and variables -> Actions.
 *
 * Käyttö:
 *   node scripts/instagram-token.mjs auth   <app-id> <redirect-uri>
 *   node scripts/instagram-token.mjs token  <app-id> <app-secret> <redirect-uri> <code>
 */

const [, , cmd, ...args] = process.argv;

const die = (msg) => {
  console.error("\n  " + msg + "\n");
  process.exit(1);
};

if (cmd === "auth") {
  const [appId, redirectUri] = args;
  if (!appId || !redirectUri) {
    die("Käyttö: node scripts/instagram-token.mjs auth <app-id> <redirect-uri>");
  }
  const url =
    "https://www.instagram.com/oauth/authorize" +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&response_type=code" +
    "&scope=instagram_business_basic";

  console.log("\n1. Avaa tämä osoite selaimessa ja hyväksy oikeudet:\n");
  console.log("   " + url + "\n");
  console.log("2. Selain ohjautuu redirect-osoitteeseen. Kopioi osoiteriviltä");
  console.log("   ?code=... -parametrin arvo (ilman lopun #_ -merkkejä).");
  console.log("   Koodi on voimassa tunnin ja sen voi käyttää vain kerran.\n");
  console.log("3. Aja sitten:\n");
  console.log("   node scripts/instagram-token.mjs token <app-id> <app-secret> <redirect-uri> <code>\n");
  process.exit(0);
}

if (cmd !== "token") {
  die(
    "Tuntematon komento.\n" +
      "  node scripts/instagram-token.mjs auth  <app-id> <redirect-uri>\n" +
      "  node scripts/instagram-token.mjs token <app-id> <app-secret> <redirect-uri> <code>",
  );
}

const [appId, appSecret, redirectUri, code] = args;
if (!appId || !appSecret || !redirectUri || !code) {
  die("Käyttö: node scripts/instagram-token.mjs token <app-id> <app-secret> <redirect-uri> <code>");
}

// 1) authorization code -> lyhytikäinen token
const form = new URLSearchParams({
  client_id: appId,
  client_secret: appSecret,
  grant_type: "authorization_code",
  redirect_uri: redirectUri,
  code: code.replace(/#_$/, ""),
});

const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: form,
});
const shortJson = await shortRes.json();

if (!shortRes.ok || !shortJson.access_token) {
  die(
    "Lyhytikäisen tokenin haku epäonnistui:\n  " +
      JSON.stringify(shortJson) +
      "\n\n  Tavallisimmat syyt: koodi on jo käytetty, se on yli tunnin vanha, " +
      "tai redirect_uri ei täsmää sovelluksen asetuksiin merkittyyn.",
  );
}

// 2) lyhytikäinen -> pitkäikäinen (60 vrk)
const longUrl =
  "https://graph.instagram.com/access_token" +
  "?grant_type=ig_exchange_token" +
  `&client_secret=${encodeURIComponent(appSecret)}` +
  `&access_token=${encodeURIComponent(shortJson.access_token)}`;

const longRes = await fetch(longUrl);
const longJson = await longRes.json();

if (!longRes.ok || !longJson.access_token) {
  die("Pitkäikäisen tokenin vaihto epäonnistui:\n  " + JSON.stringify(longJson));
}

const days = Math.round((longJson.expires_in || 0) / 86400);

console.log("\n  Valmis. Token on voimassa noin " + days + " vuorokautta.\n");
console.log("  Vie tämä arvo GitHubiin nimellä INSTAGRAM_TOKEN:");
console.log("  Settings -> Secrets and variables -> Actions -> New repository secret\n");
console.log("  " + longJson.access_token + "\n");
console.log("  Älä liitä tokenia chattiin, sähköpostiin tai koodiin.\n");
