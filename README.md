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

## Si përdoret
1. Hape `index.html` (ose faqen e publikuar në GitHub Pages).
2. Plotëso fushat direkt mbi dokument. Shumat llogariten vetë.
3. **Eksporto PDF** → në dritaren e printimit zgjidh *Save as PDF* dhe fik "Headers and footers" (Safari: hiq shenjën te *Print headers and footers*).
4. **Eksporto Word** shkarkon skedarin `.docx`.

## Publikimi në GitHub Pages
1. Krijo një repo (p.sh. `oferte`) dhe ngarko të gjithë përmbajtjen e kësaj dosjeje në degën `main`.
2. Repo → **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `/ (root)`**.
3. Pas 1–2 minutash aplikacioni hapet te `https://<llogaria>.github.io/<repo>/`.

## Struktura
```
index.html            faqja kryesore
css/app.css           dizajni dhe stili i printimit
js/core.js            llogaritjet, numrat me fjalë, preset-et, teksti standard
js/app.js             editori (ndërfaqja)
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
