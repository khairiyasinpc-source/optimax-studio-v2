OPTIMAX Studio V2 — Preview + Selection + Draft Stability Patch
============================================================
Install files (REPLACE ONLY THESE FILES):
  src/Editor.jsx
  src/main.jsx

Before uploading, in the CURRENT editor click Export for GitHub ->
Download Publish Package ZIP. Save this ZIP as a backup of your CURRENT
BROWSER DRAFT, including video/GIF bytes. Do NOT reset draft or clear site data.

Changes:
  1. Preview frames stop fetching published JSON and overwriting live editor state.
  2. Canvas selection event listeners and parent communication remain stable during edits.
  3. Autosave is debounced (650ms) to reduce UI freezes when using style sliders.
  4. Iframe receives latest draft on READY/onLoad.
  5. Save now clearly says local draft, NOT live GitHub publish.

Not included: multi-user logins, automatic publishing to GitHub, cloud drafts,
full Figma features, or unrelated editor design changes.

After installation: GitHub Actions must be green. Open ?edit=1, refresh.
TEST 1: Select any text/photo directly on canvas; inspector must follow.
TEST 2: Change a heading, open Full Screen Preview; see new heading.
TEST 3: Exit preview, refresh editor; local draft persists.
TEST 4: Public URL WITHOUT ?edit=1 stays unchanged until you export the
Publish ZIP and commit site-content.json + media/ to public/ in GitHub.

If browser storage is full, the export ZIP is your safety backup. Never
clear site data before verifying the export contains your latest work.
