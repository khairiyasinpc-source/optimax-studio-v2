OPTIMAX STUDIO V2 - VISUAL BUILDER CORE (DESIGNER BETA)
13 OCT 2026

This patch is for the existing root-level optimax-studio-v2 repository.
It preserves the current OPTIMAX homepage, public/site-content.json,
three-panel editor structure, GitHub Actions deployment, and arrow icon fix.

INSTALL WITHOUT OVERWRITING LIVE CONTENT:
1. On GitHub save a backup (Code -> Download ZIP).
2. Extract this patch ZIP. Upload its CONTENTS into the ROOT of optimax-studio-v2.
   src/ files go to src/, tests/ file goes to tests/, package.json at root.
   IMPORTANT: Do not upload an extra enclosing folder or remove other repo files.
   IMPORTANT: This patch deliberately DOES NOT contain site-content.json.
3. Commit changes and wait for GitHub Actions to turn GREEN.
4. Refresh https://khairiyasinpc-source.github.io/optimax-studio-v2/?edit=1
   (Command+Shift+R on Mac).
5. Do not publish unfinished test data. Test using local draft before export.

WHAT IS BUILT:
- Left sidebar Elements palette (Text, Image, Video, Button, Icon, Spacer).
  Click to add or drag into a CUSTOM section in the website canvas.
- Add blank/custom section; new elements can be dragged and reordered in
  custom sections. Use section arrow controls to position custom sections
  between legacy Homepage sections (Hero, Treatments, etc.).
- Blank image/video placeholder contains native upload picker; selected
  existing media also exposes Replace control on the canvas.
- Selected custom elements have a resize handle (lower-right corner).
- Properties include per-element width/height, background, color,
  corner radius, opacity, shadow, four padding and four margin sides.
- Section Properties include columns, gap, left/right/top/bottom padding.
- Copy/duplicate, delete, undo/redo, desktop/tablet/mobile previews.
- Data schema and exported JSON preserve styles and reordered sections.
- Existing page manager, gradient, dark/light mode and full preview remain.
- Media is bounded by current editor size limits. Videos/GIF export in
  publish ZIP, not as inline video data in localStorage.

SAFETY / HONEST LIMITATIONS:
- This is a Figma-like CORE BUILDER, NOT full Figma parity.
  Placement inside legacy hard-coded sections is still template-based;
  arbitrary X/Y free-positioning and nested Auto Layout are NOT built yet.
- NO shared 3-designer login, online drafts or automatic publishing yet.
- Existing Save Draft uses this browser only. Export for GitHub remains manual.
- Direct canvas upload is for blank/new media blocks or selected media.
- Full React build + browser interaction are NOT verified in this environment;
  npm install was unavailable. GitHub Actions / real browser UAT are required.
- Never give public ?edit=1 as a password-protected team editor.

MINIMUM DESIGNER TEST:
A. In editor: Layers > Add Section > Blank section.
B. Open Elements > drag Image into the blank section (or click Image).
C. Click image placeholder > pick JPG/WebP > picture immediately appears.
D. Select picture > drag the lower-right resize handle.
E. Properties > change padding left/right and background; verify in canvas.
F. Add a Text and Button, drag to reorder. Try 2 columns in Section tab.
G. Move custom section above another homepage section using left-layer arrows.
H. Toggle Mobile and Full Preview; save browser draft.
I. For publish use Export for GitHub, and upload content/media separately.

Rollback: restore the old source files from the backup ZIP.
