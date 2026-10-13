# OPTIMAX Visual Editor V2 — Clean Demo Repository

This is the **clean source for the EXISTING V2 design/editor** supplied in `Optimax-main.zip`.
The old V1 copy and nested `(2)` folders are deliberately excluded. The editor UI is not redesigned.

## File structure

```text
.github/workflows/deploy.yml  # GitHub Pages deployment
src/                         # website and original V2 editor
public/site-content.json      # PUBLISHED design content
index.html
package.json
vite.config.js
tests/                       # basic content-schema tests
```

## Put this project in a NEW GitHub repository

1. Create a **new PUBLIC** GitHub repository (suggested name: `optimax-studio-v2`). Do NOT delete the old `Optimax` repository.
2. Extract this ZIP on Mac. Upload **the contents** of the extracted folder to the **root** of the new repo, NOT the folder itself. Ensure `.github/workflows/deploy.yml` is present in the repo (in Finder: Cmd+Shift+. shows hidden `.github`).
3. Commit to branch `main`.
4. Under **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
5. Check the **Actions** tab. When `Deploy OPTIMAX V2 Demo` completes successfully, open:
   - Website: `https://USERNAME.github.io/REPO-NAME/`
   - Editor: `https://USERNAME.github.io/REPO-NAME/?edit=1`

The deploy workflow automatically uses the new repository name for the URL base path; you do not need to manually change `/Optimax/` references.

## Important: existing drafts

This project includes only `public/site-content.json` from the GitHub ZIP you uploaded, not browser-local drafts. If you have unsaved design changes in your old V2 editor, go to the OLD editor, **Export for GitHub** and keep that `site-content.json`. Import it into the NEW editor, review, then export and publish through the new repo `public/` directory.

Drafts are intentionally scoped by repository base path so drafts from the old `Optimax` URL do not silently overwrite your new demo preview.

## Current V2 features (implemented)

- Editable homepage, Layers sidebar, Properties inspector, section order, visibility and locking.
- Text, image, logo, icon and button controls.
- Gradient editor for **hero only** (not universal gradient yet).
- Responsive canvas, in-editor preview, undo/redo.
- Browser-local draft and import/export of `site-content.json`.

## Features PLANNED, not yet built here

- 3 designer logins, shared online drafts, secure one-click Save & Publish.
- Multi-page builder, add new reusable blank/template sections.
- Universal gradient on every suitable element.
- Upload/host MP4, GIF and video backgrounds, plus media usage monitor.
- Editor dark/light mode and independent website full-screen preview.
- Final website/source/assets ZIP handoff to OPTIMAX IT.

These features must be built, tested and integrated incrementally before team members can use them. Do **not** tell designers that this V2 ZIP already supports collaborative real-time editing or publishing.

## Publishing in this current V2

1. Open `?edit=1`, edit and preview.
2. Click **Export for GitHub** and download `site-content.json`.
3. Replace `public/site-content.json` in your NEW repository and commit.
4. Wait for GitHub Actions to show **success**; refresh the website link.

**Security:** `?edit=1` is NOT private, and browser draft is NOT shared across team members. Do not store credentials or patient data here. Anyone with the link can edit their own local preview, but they cannot commit changes without repo write access. This is a demo tool, not production healthcare software.

**Demo content:** The original site contains external stock photos, placeholders, medical copy and a demo mailto enquiry form. Verify all approved content before handing it over to IT or deploying on the official company domain.

## Development and tests

```bash
npm install
npm run test:logic
npm run dev
npm run build
```

Building the React website requires installing dependencies. The included logic tests were run against the source package; full Vite build verification depends on npm packages being available. The GitHub workflow performs both tests and the build.

## Final handoff to IT (later)

When the design is approved, deliver source code, the approved `public/site-content.json`, locally hosted/exported images and videos, and tested built assets (`dist/`) alongside a note on URL base, page links, forms, and external services. **The current source ZIP does not yet contain every image/video locally**; images are currently also loaded from external Unsplash URLs and data URLs. Handoff packaging is a future phase.
