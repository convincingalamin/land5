# আল-আমিন ডিজিটাল ল্যান্ড সার্ভে (Al-Amin Digital Land Survey)

Static, bilingual (Bangla / English) website with land calculators. No build step, no framework:
upload the folder to Netlify (drag & drop) and it works.

## Folder structure
```
/
├── index.html                  Home
├── 404.html                    Custom "page not found"
├── services/                   /services/ (+ porcha, namjari, khajna, dcr, mouza-map, digital-map)
├── deeds/                      /deeds/ (+ one page per deed type, old-deed-copy)
├── calculators/                land-area, faraiz, ana-gonda-hissa, deed-fee, copy-fee
├── learn/                      /learn/ (+ land-history, land-survey)
├── about/  contact/  faq/
├── assets/
│   ├── css/style.css           the only stylesheet (see the table of contents at its top)
│   ├── js/core/                app.js (header/footer/form), i18n.js (language), landmath.js (maths), report.js (print/PDF)
│   ├── js/pages/               one file per interactive page (calculators, home hadith)
│   ├── js/widgets/chatbot.js   chat assistant (lazy-loaded)
│   ├── i18n/en-dict.js         English dictionary (generated, lazy-loaded)
│   ├── img/                    logo, icons, photo, share-preview image (og-image.png)
│   └── vendor/                 html2canvas + jsPDF (only loaded when "Download PDF" is pressed)
├── tools/
│   ├── seo.py                  SEO builder (canonical, JSON-LD, sitemap.xml, robots.txt)
│   └── i18n/                   translation sources + build_dict.py
├── _redirects  _headers        Netlify: old .html URLs -> new clean URLs (301), caching + security headers
├── robots.txt  sitemap.xml  site.webmanifest  favicon.ico
```
Every page is plain HTML with English comments marking each `SECTION`. Page URLs are clean (`/services/porcha/`).
Old links such as `/porcha.html` keep working through `_redirects` (301, SEO safe).

## 1) Deploy
Netlify: drag the whole folder onto the "Deploy" box. Nothing else is needed.

## 2) SEO checklist (do these once)
1. Domain in use: `https://alamin-digital-land-survey.netlify.app` (already applied; if you move to a custom domain, rerun step 2).
2. Run `python tools/seo.py https://alamin-digital-land-survey.netlify.app` (needs only Python 3). It writes canonical URLs, Open Graph URLs,
   JSON-LD structured data (business, breadcrumbs, FAQ, calculators), `sitemap.xml` and `robots.txt`. Upload again.
3. Google Search Console: add the property, verify (tip: `GSC_TOKEN=xxxx python tools/seo.py https://YOUR-DOMAIN`
   adds the verification tag), then submit `https://YOUR-DOMAIN/sitemap.xml`. Do the same in Bing Webmaster Tools.
4. Create a Google Business Profile (name: আল-আমিন ডিজিটাল ল্যান্ড সার্ভে, phone +880 1745-473151, service area Bangladesh).
5. Share a link on Facebook once and use the Facebook Sharing Debugger ("Scrape Again") so the preview image refreshes.
6. Keep the same name/phone on Facebook, YouTube, LinkedIn pages and link back to the site (backlinks help ranking).
7. Add real content regularly (FAQ answers, short guides). Each page already has a unique title, description and one H1.

See `SEO.md` for the keyword plan per page.

## 3) Contact form (email)
`assets/js/core/app.js` contains the Web3Forms access key (`KEY`). It is a public key by design.
In the Web3Forms dashboard restrict it to your domain. Submitting sends an email to the address registered for the key.

## 4) Languages and theme
- Bengali is the source text in the HTML. English is a dictionary: `tools/i18n/translations.json`
  (`"Bengali text": "English"`). After editing run `python tools/i18n/build_dict.py`.
- A new Bengali sentence without an English entry simply shows in Bengali in English mode.
- Dark/light theme follows the visitor's system and is remembered.

## 5) Calculators
All maths lives in `assets/js/core/landmath.js` (the home-page example and the calculators use the same functions).
Fee calculators (`calc-fees.js`) have editable rates on the page because government rates change.

## Opening the site
Open it from the live link or a local server (`python -m http.server` inside this folder, then http://localhost:8000).
Opening `index.html` directly from phone/computer storage shows an unstyled page because asset paths start with `/assets/`; the pages show a warning banner in that case.

## Credits
Division/district/upazila names: github.com/nuhil/bangladesh-geocode (MIT licence), stored in `assets/data/bd-geo.json`.
