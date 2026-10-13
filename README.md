# OPTIMAX Studio V2

This release preserves the existing OPTIMAX website content, design and V2 editor layout. It adds editor stability fixes, custom grid sections, cross-section drag/reorder, media upload/replacement, responsive properties, gradients, dark editor mode, full-screen draft preview, multi-page editing and backups.

A separate Cloudflare Worker provides three browser-only designer accounts, shared drafts with revision protection, private shared media and atomic GitHub Pages publishing. Team hosting requires owner account activation and server secrets. The GitHub Pages copy alone is not a secure shared editor.

See [IT handover](docs/IT-HANDOVER.md) for deployment, security, designer workflow, RM0 limits, verification and rollback. Live activation status and verification evidence are recorded in `docs/RELEASE-STATUS.md`.

Development: Node 24, `npm ci`, `npm run test:logic`, `npm run dev`, `npm run build -- --base=/optimax-studio-v2/`. The `Verify OPTIMAX release` workflow runs real Chromium editor and team-session regressions before release.

Original `public/site-content.json` is preserved. Existing content includes its original external assets and mailto enquiry form. Designer uploads become local IndexedDB media and are uploaded to the private service before shared saving; publishing commits their bytes to the existing public repository.
