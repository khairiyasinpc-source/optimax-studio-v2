# OPTIMAX Studio V2 — IT handover

The public website remains at https://khairiyasinpc-source.github.io/optimax-studio-v2/. The authenticated team editor is served by a separate Cloudflare Worker so designers need only a browser. The existing website content, visual design and three-panel editor remain the baseline.

## Release activation

Cloud hosting must be activated and tested before this can be called a complete production release. The Work agent handles deployment after the owner signs in. No designer needs GitHub, Node, an installation, or a ChatGPT subscription.

Owner-only infrastructure setup (these commands are for IT/automation, not designers):

1. Sign into Cloudflare and keep the Workers account on the Free plan. Do not enable paid Workers, R2 or paid add-ons.
2. Authenticate Wrangler with the owner's Cloudflare account. Create a D1 database named `optimax-studio-v2`; store its ID in `wrangler.jsonc`. Apply `server/schema.sql` using `wrangler d1 execute optimax-studio-v2 --remote --file server/schema.sql`.
3. Generate three independent random passwords with `node scripts/provision-designers.mjs <private-output-path>`, piping stdout directly to `wrangler secret put DESIGNER_CREDENTIALS_JSON`. Never commit or include that private credentials file in the release archive.
4. Configure `GITHUB_TOKEN` as a Worker secret. Use an owner-managed fine-grained token limited to this repository: Contents read/write and Actions read. Designers must never receive this token. Rotate it before expiry; delete sessions when rotating designer passwords.
5. Build with `VITE_TEAM_MODE=true npm run build:team`, then `npm run deploy:team`. The Worker assets and APIs share one HTTPS origin. Configure the public Pages build's `VITE_STUDIO_URL` to the verified Worker URL. This redirects the public `?edit=1` entry to the team sign-in page.
6. Test all three accounts from independent browser sessions. Save a draft, reopen it in a second session, verify shared media, reject a stale save from a third session, publish unchanged approved content, and verify a successful Pages workflow and public URL.

## Designer workflow

Sign in with the assigned designer account. Edit content, add custom sections and elements, choose desktop/tablet/mobile canvas sizes, upload media, preview, and save the shared draft. Shared autosave waits briefly after changes; the status line distinguishes local backup from shared save. Publish makes one atomic commit containing JSON and media, then waits for the existing Pages workflow. A successful commit is not reported as a successful deployment until the build succeeds.

Shared editing uses optimistic revisions rather than simultaneous live cursor editing. If someone else saved first, save is refused. Export the local ZIP backup, then reload the shared draft. Local recovery copies remain available if an older offline draft differs from the server version. Reopening the editor never silently overwrites the shared draft with an older local version.

## Security

Three accounts only; PBKDF2-SHA256 password hashes; random session tokens stored as hashes; Secure, HttpOnly, SameSite=Strict host cookies; eight-hour session expiry; origin validation on mutations; server-side authorization on every draft/media/publish endpoint. Login attempts are rate limited. GitHub credentials remain server-only. Asset paths are immutable; checksum verification precedes shared save. Repository changes during publish cause a conflict rather than a force push.

The original published content and website assets are public, as before. Editing a local copy is not repository access. Without a configured team URL, the GitHub Pages copy remains a local editing workspace; it must not be distributed as the secure team service.

## RM0 operation and limits

Use Cloudflare Workers Free, D1 Free and the existing public GitHub Pages repository. No R2 or metered paid service is required. Free-service quotas are finite. The application stops on quota/size failures; it never activates a paid plan automatically. The application additionally caps shared uploads at 100 immutable assets / 200 MiB, with 20 MiB per video and 1.8 MiB per serialized draft. Upload reservations also count toward the storage cap. Images are compressed to WebP; SVG icons are rasterized. IT must archive unreferenced uploads when limits are reached. Do not delete assets referenced by saved drafts or retained backups.

Cloudflare references: https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/d1/platform/pricing/ . Public-repository GitHub Actions: https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions . Confirm plans remain Free in the owner account.

## Build, tests and rollback

Node 24 is used for release CI. `npm ci` uses the committed dependency lockfile. `npm run test:logic` runs original-schema, model, security and publishing regressions. `npm run build -- --base=/optimax-studio-v2/` builds Pages, including explicit page routes. `npm run test:browser` exercises the production editor in Chromium. Build a team bundle with `VITE_TEAM_MODE=true npm run build:team -- --outDir dist-team`, then `npm run test:team` to exercise separate designer sessions with a local SQLite adapter and a simulated GitHub transport. CI also compiles the Worker with a deployment dry run.

Local SQLite and simulated GitHub tests are not proof of hosted Cloudflare D1 behavior or a real production publish. Hosted smoke tests are a separate release gate.

Before deployment, back up the current main commit and any existing browser drafts using their editor export. The baseline source commit is `d6a565d42a1d57e74f24c26a18967959ce4ba970`. Roll back with a reviewed revert commit; do not force push. Cloudflare D1 retains the shared draft independently of the website deployment. Export it before changing schema or credentials.

## Existing content behavior

The enquiry form retains its original mailto demo behavior and copy. Placeholder partner logos and existing content remain unchanged. Stock photos/fonts referenced by the original website remain external; the asset ledger records them. The editor provides grid/flow placement in custom sections, cross-section moves, resize and per-device overrides. Legacy sections remain structured templates; this is not full Figma feature parity or arbitrary editing of every DOM node.
