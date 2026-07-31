# Instagram-syötteen kytkeminen

Etusivun tapahtumaosio näyttää Sawusaunan uusimmat Instagram-julkaisut, kun
tämä on tehty. Siihen asti osio näyttää tapahtumajulisteet — sivusto ei ole
missään vaiheessa rikki.

Koodi on valmis. Alla on vain ne vaiheet, jotka vaativat Instagram-tunnukset.

---

## Ennen aloitusta

**Tarvitset:** pääsyn @sawusauna-tiliin ja noin 20 minuuttia.

**Päätä ensin:** Creator vai Business. Molemmat toimivat. Yhdistykselle Business
on luontevampi, mutta Business-tileillä **musiikkikirjasto on rajoitettu** —
jos teette reelsejä musiikilla, valitse Creator.

**Tee Meta-sovellus mieluiten kerhon yhteisellä tunnuksella**, ei omalla
henkilökohtaisella. Hallitus vaihtuu, ja sovellus katoaa tilin mukana.

---

## 1. Instagram-tili ammattitiliksi

Instagram-sovelluksessa tilillä @sawusauna:

1. Profiili → **☰** → **Tilin tyyppi ja työkalut**
2. **Vaihda ammattitiliksi**
3. Kategoria esim. "Yhteisöorganisaatio", tyypiksi Creator tai Business
4. Kun se kysyy Facebook-sivua, voit painaa **Ohita** — sitä ei tarvita

Ilmainen, ei vaikuta seuraajiin tai julkaisuihin, voi vaihtaa takaisin.

## 2. Meta-sovellus

1. **developers.facebook.com** → kirjaudu → vahvista kehittäjätili
2. **My Apps → Create App** → käyttötapaus **Other** → tyyppi **Business**
3. Nimi esim. "Sawusauna kotisivut"
4. Hallintapaneelissa etsi **Instagram** → **Set up**
5. Valitse **Instagram API setup with Instagram login**
6. **Business login settings** → lisää *Redirect URI*: `https://localhost/`
7. Lisää @sawusauna sovelluksen Instagram-tiliksi ja hyväksy kutsu
   Instagramin puolelta (Asetukset → Verkkosivustojen käyttöoikeudet)

Koska käytätte vain omaa tiliänne, **Standard Access riittää** eikä Metan
App Review -prosessia tarvita.

Ota talteen **Instagram App ID** ja **Instagram App Secret**.

## 3. Token

Repon juuressa, kun `npm install` on ajettu:

```bash
node scripts/instagram-token.mjs auth <app-id> https://localhost/
```

Skripti tulostaa osoitteen. Avaa se selaimessa ja hyväksy oikeudet. Selain
ohjautuu osoitteeseen `https://localhost/?code=...` — sivu ei lataudu, se on
odotettua. Kopioi `code=` -parametrin arvo osoiteriviltä.

Koodi on voimassa **tunnin** ja toimii vain kerran.

```bash
node scripts/instagram-token.mjs token <app-id> <app-secret> https://localhost/ <code>
```

Tulostaa 60 vuorokautta voimassa olevan tokenin.

## 4. Token GitHubiin

> **Älä liitä tokenia chattiin, sähköpostiin tai koodiin.** Se on salasanan
> veroinen. Jos et ole repon jäsen, pyydä kutsu — älä lähetä tokenia toiselle.

Repossa `eippi/Sawusaunan-kotisivut`:

**Settings → Secrets and variables → Actions → New repository secret**

| Nimi | Arvo |
| --- | --- |
| `INSTAGRAM_TOKEN` | edellisen vaiheen token |

## 5. Automaattinen uusinta (suositeltu)

Token vanhenee 60 vrk:ssa, **eikä vanhentunutta voi enää uusia** — silloin
vaiheet 3–4 on tehtävä alusta. Workflow uusii tokenin päivittäin, mutta
tallentaakseen uuden arvon se tarvitsee oikeuden kirjoittaa salaisuuksia.

1. GitHub → oma profiili → **Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token**
2. Repository access: **vain** `eippi/Sawusaunan-kotisivut`
3. Permissions → Repository permissions → **Secrets: Read and write**
4. Lisää repon salaisuudeksi nimellä `INSTAGRAM_TOKEN_PAT`

Ilman tätä syöte toimii, mutta lakkaa päivittymästä 60 vrk kuluessa. Workflow
antaa siitä varoituksen joka ajolla.

---

## Testaus

GitHubissa **Actions → Instagram-syöte → Run workflow**.

Onnistuessaan se committaa `instagram.json` ja kuvat kansioon
`public/instagram/`.

## Jos jokin menee pieleen

| Oire | Syy |
| --- | --- |
| `Lyhytikäisen tokenin haku epäonnistui` | Koodi käytetty, yli tunnin vanha, tai redirect-osoite ei täsmää |
| `Instagram-haku epäonnistui` | Token vanhentunut tai tili ei ole ammattitili |
| Workflow varoittaa PAT:sta | Vaihe 5 tekemättä |
| Syöte ei päivity | Katso Actions-välilehden lokit |

## Miten se toimii

- Kuvat **ladataan repoon**, koska Instagramin osoitteet ovat allekirjoitettuja
  ja vanhenevat muutamassa päivässä
- Kuvat pakataan 640 px WebP-muotoon, jottei sivuston keveys kärsi
- Token elää vain GitHubin salaisuutena, ei koskaan selaimessa
- Jos haku epäonnistuu, edelliset kuvat jäävät voimaan
