# Stable, Betha and Unstable

The owner authorized promotion and the additional Betha release channel on 2026-09-29. Canonical hosting uses capital **`/Setka/`**; `/setka/` is a different path and currently returns 404. The account is now **FedotovskiiLev**.

| Channel | PWA | Android identity | Version |
| --- | --- | --- | --- |
| Stable, recommended | https://fedotovskiilev.github.io/Setka/ | `io.setka.app.release` | 0.4.0 |
| Betha, release candidate | https://fedotovskiilev.github.io/Setka/betha/ | `io.setka.app.betha` | 0.5.0-betha.1 |
| Unstable, development | https://fedotovskiilev.github.io/Setka/unstable/ | `io.setka.app.unstable` | 0.5.0-unstable.1 |

## Snapshots and publishing

`release-channels.json` is the source of channel versions and Android version codes. `package.json` identifies the development checkout. A normal `npm run build` produces Unstable. Set `SETKA_CHANNEL=stable` or `betha` for the corresponding build. Unknown channels and mismatched prerelease names are rejected. `channel.json` records the actual checkout commit, version and channel.

Pages checks out `v<stable version>` and `v<betha version>` independently, installs locked dependencies, and builds each tagged application. Unstable is built from main. Official MIPT data is refreshed every six hours and copied into all three builds; main application code never replaces a tagged snapshot. One combined artifact is deployed, serialized by `pages-channels`. Failed checks leave the previous site available. Pull requests build all three from the candidate checkout for preview/isolation checks and cannot deploy.

`node scripts/assemble-channels.mjs _stable _betha` verifies the independently built metadata/tag commits and assembles Stable at the root plus two child directories. With no arguments it builds all three locally from the current checkout, for testing only. Start `node server.mjs` with `BASE_PATH=/Setka/` and `PORT=4175` to test the combined site.

To release, update the channel version and increment that channel's Android code, write release notes, verify the candidate, then create the matching `v...` tag. Run the Android workflow on the candidate branch with its channel input before tagging when desired. Both API 35 and 36 checks must pass before a signed APK is published. Stable releases become Latest; Betha and Unstable use prerelease and `latest=false`. Main pushes produce CI artifacts rather than published releases. Do not move published release tags; use a new version for a repair.

## Personal data and offline boundaries

Stable retains `setka.v1`, `setka.notifications.delivered`, the `setka-` cache prefix and its existing Android package/certificate. Unstable retains `setka.unstable.*` and `setkaUnstable-`. Betha uses `setka.betha.*` and `setkaBetha-`. Manifest identities and worker scopes are relative to each channel; Stable's root worker ignores both child paths. The distinct experimental cache prefixes also survive old Stable workers' `setka-` cleanup. Build identity is never imported from backups or guessed from URL paths.

These PWAs share an origin, so site permissions, quota and the browser's clear-all-site-data action remain shared. Namespaces prevent application interference, not hostile same-origin code. Android editions have separate OS sandboxes and FileProvider authorities. All signed releases use the retained protected certificate; no key is regenerated.

No channel automatically reads or copies another's data. To transfer, export a full backup from the source edition, open the destination, and deliberately restore it after reviewing the replacement confirmation. Back up the destination first. Do not restore newer data into obsolete versions blindly. Keep older Android apps installed until transfer is verified.

## Evidence

`tests/channels-browser.mjs` exercises all three editions in one isolated browser profile, creates distinct tasks through the UI, checks manifests/storage/ledgers/workers/caches, and verifies offline persistence. Android CI installs published Stable 0.3.2, creates a sentinel, verifies an in-place Stable upgrade or experimental side-by-side install, then checks planning/export, background notifications, reinstall retention, study recovery and reboot status. See `docs/verification-05.md` for the actual run record.

Historical physical evidence: the owner confirmed Unstable.1 coexistence on Samsung S23 on 2026-09-08. OS version was not supplied. It does not establish physical behaviour of the new releases, battery restrictions or all notification lifecycles. Current physical checks are in `docs/unstable-device-check.md`.
