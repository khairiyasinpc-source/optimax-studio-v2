# OPTIMAX Homepage + Pages CMS

**Design-locked static website**. Homepage output (`index.html`, `assets/style.css`, `assets/site.js`) remains **byte-for-byte identical** to the approved static homepage provided on 14 October 2026 when CMS fields have not been edited. No Visual Editor, React, npm dependencies or runtime CMS script. The public site contains HTML/CSS/JS only.

## For designers (first-time setup)

1. Keep the existing live demo unchanged until you are happy with this package. Back up current `optimax-studio-v2` repository if replacing its contents.
2. Upload the **contents** of this project to the root of a GitHub repository (not the containing folder), including hidden `.pages.yml` and `.github/workflows/deploy.yml`. Remove the old React editor files from the destination repository when fully replacing the old project, or create a clean project repository. Do not upload `node_modules` or secrets.
3. From the repository **Settings → Pages → Source**, choose **GitHub Actions**. Once the workflow finishes successfully, the demo will show the unchanged static homepage.
4. Owner visits <https://app.pagescms.org>, signs in using GitHub, and installs/authorizes **Pages CMS** for this repository. Pages CMS detects root `.pages.yml` automatically.
5. In Pages CMS, select **02 · Hero → Replace Hero Image**, upload a new PNG/JPG/WebP and press Save. Pages CMS commits the edited JSON and uploaded media; the GitHub workflow rebuilds and deploys the demo automatically.
6. For your team of **three designers in total**, invite the other two as Pages CMS collaborators using their email addresses in Pages CMS. They do not need GitHub accounts or ChatGPT subscriptions to edit fields. Only repo owner/GitHub maintainer can change `.pages.yml` or manage invitations.

**Important:** Pages CMS isn't a Figma-style visual editor. It edits only the explicitly configured content and media fields. Website layout, spacing, fonts, colors, and CSS are intentionally locked to avoid changing the design.

## What can be edited

11 tabs / 84 fields: Site Settings (logo/header CTA/meta), Hero image and optional background video, trust statistics, What We Do text and 4 treatment card images/text, Why Optimax image and copy, Doctors image and copy, Awards heading, Partners and Media copy, Reviews summary/rating, Patient Journey heading, Contact image and copy.

**Existing Unsplash images intentionally remain unchanged** until you upload replacements. Empty `Replace ... Image` fields mean keep the original image. The original external image URLs live in `scripts/original-media.json`. The external demo images have not been bundled; replace them with approved OPTIMAX photography before company IT handover.

### Recommended asset size

- Hero photo: WebP 300–500 KB, ideally below 2 MB.
- Card/section photo: WebP or JPG 100–300 KB, ideally below 2 MB.
- Logo: SVG or transparent PNG; SVG ideally below 100 KB.
- GIF: ideally below 1 MB; avoid heavy animated banners.
- Optional hero MP4: H.264, 5–10 sec, muted loop, ideally 3–5 MB, max recommendation 20 MB. Autoplay on mobile is subject to browser and device restrictions.
- These are recommendations, not enforced platform limits. GitHub also has file-size/traffic limits.

## Publishing & repo structure

| Location | Purpose |
| --- | --- |
| `.pages.yml` | Pages CMS tabs/fields and media uploader |
| `content/*.json` | Only edit these through Pages CMS |
| `media/` | Uploaded photos, logos, GIF and videos |
| `templates/index.html` | Exact locked original HTML design with placeholders |
| `templates/style.css` | Exact locked original CSS design with media placeholders |
| `assets/site.js` | Exact original mobile-navigation JavaScript |
| `scripts/build.mjs` | Dependency-free Node 22 renderer |
| `scripts/fields.json` | Renderer field definitions |
| `scripts/original-media.json` | Original demo photos for untouched images |
| `.github/workflows/deploy.yml` | Test and deploy after CMS saves to main |
| `dist/` | Compiled static website, ready for IT |

Run locally with Node 22:

```bash
node scripts/build.mjs
node tests/check.mjs
```

No `npm install` needed. GitHub Actions uses the same two commands, uploads a downloadable **optimax-homepage-static-site** ZIP artifact, and deploys only after tests pass. Actions do not deploy a pull-request branch.

## Final IT handover

Give IT the latest **optimax-homepage-static-site** artifact from GitHub Actions (Actions → latest green run → Artifacts). It contains the rendered HTML, CSS, JavaScript and **all CMS-uploaded media**, without needing Pages CMS for visitor access. Or run `node scripts/build.mjs` on a checkout of the latest committed content and zip the `dist/` directory.

The corporate hosting, real domain, appointment forms and data handling are **not** part of this demo. Don't collect patient data on this static page. Replace placeholder imagery, review medical/award/location claims and check official links before the corporate launch. Review/remove `<meta name="robots" content="noindex, nofollow">` only when officially launching.

## Known limits & scope

- Hosted Pages CMS/GitHub integration still requires **owner authorization**. This package cannot sign in or grant access for you. Team invitations are added in the Pages CMS UI, not `.pages.yml`.
- The demo uses the same remote demo imagery until replaced; a completely offline bundle requires uploading local photos.
- The frozen page keeps exactly its current fixed structure; CMS doesn't add sections or move elements.
- The original homepage output passed a byte-for-byte HTML/CSS/JS comparison. Browser screenshot automation wasn't accessible in the build environment; verify in the published GitHub staging site before approving/merging.
- Current `?edit=1` is intentionally ignored — no editor is shipped.
