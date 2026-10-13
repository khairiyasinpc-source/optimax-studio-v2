# Release activation status

Release candidate 2.1.0. This is not yet an activated, fully verified team release.

- Original content/model tests: pass locally and in GitHub Actions.
- Added move/style/gradient/responsive regressions: pass locally and in GitHub Actions.
- Three-account authentication, session, CSRF, conflicts, uploads, logout and rate-limit API tests: pass locally and in GitHub Actions.
- Atomic publishing/idempotency/repository-conflict tests: pass locally and in GitHub Actions with simulated GitHub responses.
- Production website build: pass locally and in GitHub Actions.
- Worker deployment compilation: pass locally.
- Interactive browser: selection, current draft/full preview, direct image upload, reorder, designer login and shared save have been exercised successfully.
- Full repeatable browser suite: in progress; failures are being resolved before release.
- Hosted Cloudflare account/D1, assigned designer credentials and publishing secret: not activated.
- Hosted three-designer / real one-click Pages publish smoke test: pending activation.
- Main branch/public release: baseline preserved; release work is in PR #1.

No paid service has been provisioned. The Cloudflare owner sign-in is required to activate infrastructure. Designers do not require GitHub or ChatGPT accounts.
