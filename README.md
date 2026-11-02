# Apex Frames — Gjeneruesi i preventivave

Aplikacion web statik (HTML + CSS + JavaScript, pa server dhe pa instalim) për preventivat e Apex Frames:
dritare, dyer, grila, tenda, aksesorë, shërbime dhe çdo kombinim i tyre në një dokument të vetëm.

## Çfarë bën
- Seksione të lira (Dritare, Dyer, Grila, Tenda, Aksesorë, Shërbime, Të tjera), secili me tabelën e vet.
- Çdo rresht ka njësi çmimi: **m²** (gjerësi × lartësi × sasi), **ml**, **copë** ose **shërbim**, plus rresht specifikimi (profili, ngjyra, xhami).
- Nëntotal, zbritje (% ose shumë), transport, montim dhe shërbime të tjera; total përfundimtar me fjalë.
- Plan pagese me faza: 50/50, 50/30/20, 20/80, 100% ose faza të lira. Çdo fazë tregon shumën dhe shumën me fjalë (parapagimi, pagesa finale).
- Monedha EUR ose ALL.
- Eksport **PDF** (vektorial, me tekst të zgjedhshëm) dhe **Word (.docx)** i redaktueshëm.
- **Ruaj / Hap** preventivin si skedar `.json`; drafti ruhet automatikisht në shfletues.
- Dizajn i qetë gri/i zi; blu vetëm te logoja. Çmimet janë përfundimtare, pa zbërthim TVSH (Apex Frames nuk është subjekt TVSH).

## Arkivi (faqja kryesore)
- Çdo preventiv ruhet vetë në arkiv dhe renditet sipas **vitit dhe muajit** (sipas datës së preventivit), me totalet për çdo vit/muaj.
- **Foldera për kompanitë**: çdo kompani ka kod (p.sh. `DRIT`), kontakt, adresë dhe shënime për bashkëpunimin. Preventivi i ri në një folder plotëson vetë klientin.
- **Numërimi automatik** `AF-VVVV-KOD-NR` (p.sh. `AF-2026-DRIT-01`, `-02`…), pa përsëritje; nëse shkruan një numër që ekziston, shfaqet paralajmërim.
- **Statuset e procesit**: Draft → Dërguar → Pranuar → Në prodhim → Montuar → Mbyllur (ose Refuzuar), të ndryshueshme direkt nga lista.
- Kërkim sipas numrit, klientit ose projektit; filtër sipas statusit dhe folderit.
- **Kopje rezervë / Rikthe**: arkivi ruhet në shfletuesin ku punohet. Për ta kaluar në pajisje tjetër (ose si mbrojtje) shkarko kopjen rezervë dhe rikthe e atje; bashkimi nuk fshin asgjë.

## Certifikata e garancisë (verifikim online)
Arkivi → **Garancitë** → **+ Certifikatë e re** (ose nga hapi i fundit i një preventivi). Numri jepet nga serveri: **AF-VVVV-875**, pastaj 876, 877… (vazhdon pa përsëritje).
Certifikata del në A4 me kod QR dhe adresën `app.apexframes.co/v/AF-2026-875`; klienti e verifikon online (faqja `verifiko.html`: e vlefshme, e anuluar ose e pa gjetur).
Faqja publike tregon emrin e klientit pjesërisht (p.sh. `Te** Kl**** SH**`) për privatësi. Një certifikatë mund të anulohet nga paneli.

**Vendosja në Netlify (një herë):**
1. Sajti duhet të publikohet nga repo-ja në GitHub (Add new site → Import from Git), jo me drag-and-drop, që funksionet të ndërtohen.
2. Site configuration → Environment variables → shto `CERT_ADMIN_TOKEN` me një fjalëkalim të gjatë sekret.
3. Hap aplikacionin → Garancitë → fut të njëjtin çelës te “Çelësi i administratorit”. Vetëm kush e ka çelësin krijon ose anulon certifikata; verifikimi është publik.

Certifikatat ruhen në Netlify Blobs (`netlify/functions/cert.mjs`), kështu që i sheh nga çdo pajisje. Provë lokale pa Netlify: `CERT_ADMIN_TOKEN=test node dev/server.mjs` → http://localhost:8124, dhe `npm test`.

## Si përdoret
Aplikacioni është formular me 5 hapa; totali live shfaqet anash (në celular, poshtë):
1. **Klienti** — numri i preventivit, data, vlefshmëria, monedha, klienti dhe projekti.
2. **Zërat** — seksione (Dritare, Dyer, Grila…) me karta për çdo zë; m², ml, copë ose shërbim.
3. **Çmimi dhe pagesa** — zbritje, transport, montim dhe plani i pagesës.
4. **Kushtet** — përfshirja, garancia, termat (të plotësuara me tekstin standard).
5. **Rishikim dhe eksport** — kontroll i fushave të munguara, pamje paraprake dhe shkarkimi i **PDF** ose **Word (.docx)**.

PDF: te dritarja e printimit zgjidh *Save as PDF* dhe fik "Headers and footers". Me **Ruaj / Hap** ruan ose rihap një preventiv si `.json`; drafti ruhet vetë në shfletues.

## Publikimi në GitHub Pages
1. Krijo një repo (p.sh. `oferte`) dhe ngarko të gjithë përmbajtjen e kësaj dosjeje në degën `main`.
2. Repo → **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `/ (root)`**.
3. Pas 1–2 minutash aplikacioni hapet te `https://<llogaria>.github.io/<repo>/`.

## Struktura
```
index.html            faqja kryesore
css/app.css           dizajni i formularit
css/doc.css           stili i dokumentit (pamja paraprake dhe PDF)
js/core.js            llogaritjet, numrat me fjalë, preset-et, teksti standard
netlify/functions    serveri i certifikatave (Netlify Function + Blobs)
verifiko.html         faqja publike e verifikimit
js/cert.js            certifikatat e garancisë (lista, krijimi, PDF)
js/store.js           arkivi: foldera, numërimi, statuset, grupimi
js/archive.js         faqja kryesore (arkivi) dhe routeri
js/app.js             formulari me hapa dhe dokumenti për PDF
js/export-docx.js     eksporti në Word
js/assets.js          logoja (PNG) për Word
vendor/docx.iife.js   biblioteka docx (MIT), e përfshirë që aplikacioni të punojë pa internet
assets/               logoja (SVG/PNG)
```

## Ndryshime të shpeshta
- Teksti standard (garancia, përfshirja, termat, afatet) dhe plani i pagesës parazgjedhës: `defaultState()` te `js/core.js`.
- Të dhënat e shoqërisë (NUIS, adresa, administratori): kokat te `js/app.js` dhe `js/export-docx.js`.
- Numërimi i referencës: formati `AF-VVVV-KLIENT-NR`, plotësohet me dorë te titulli i dokumentit.

Draftet ruhen vetëm në shfletuesin ku punohet; për t'i kaluar në pajisje tjetër përdor **Ruaj** dhe **Hap**.
