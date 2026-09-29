# Verification — workspace and three channels

Candidate date: 2026-09-29. Stable 0.4.0, Betha 0.5.0-betha.1, Unstable 0.5.0-unstable.1.

## Local evidence

- Locked dependency installation and shared web build completed using the bundled Node runtime and repository npm CLI.
- The final 77-test domain/import/storage suite passed, including the alternating-week replacement regression.
- Desktop/browser workflows passed for XLSX/import/update, notification permission/deduplication, PWA installability, all eight catalog sources, personal edits, Week zoom/print, study recovery, recommendation feedback, recurring tasks/plans and individual choices.
- New workspace tests passed task search/grouping, completion/reopening, reminder validation with draft retention, slow-catalog dismissal, future-plan default time, disabled fully allocated planning and desktop/phone/landscape overflow.
- Three-channel tests passed storage/cache/manifest/worker isolation and offline persistence in one browser context.
- The first 320px Today check exposed insufficient space above the timetable; spacing was corrected. The 320/360/390px and active-timer/landscape checks then passed.

## Corrections found during review

- Own-group lessons were hidden even on weeks when an alternate-group replacement did not occur. Hiding now follows resolved replacement occurrences.
- Editing a repeating task's duration did not update its future estimate. Explicit duration changes now update the repeat template; title-only edits preserve it.
- Editing an entire weekly event from a later occurrence could move the series start. Switching to series scope now loads its original date/time and identifies the date as the first event.
- The live ФАКТ catalog test hardcoded a bell time from an older workbook. Dynamic rendering is now checked against the imported bell schedule; frozen fixture assertions remain unchanged.
- A late workbook download could replace a newer import candidate after its dialog was dismissed. Import results now belong to their active dialog; a browser regression delays the old download, reviews a different source and verifies that the chosen source is applied.

## Release evidence

- Pre-publication Android API 35/36 checks passed for [Stable](https://github.com/FedotovskiiLev/Setka/actions/runs/36576219764), [Betha](https://github.com/FedotovskiiLev/Setka/actions/runs/36576227112) and [Unstable](https://github.com/FedotovskiiLev/Setka/actions/runs/36576233028), including signing identity, old-Stable data retention, coexistence, keyboard/layout, import/planning/export, background notification, reinstall, study/status and reboot checks.
- The final import-cancellation regression passed locally and in the [final PR browser run](https://github.com/FedotovskiiLev/Setka/actions/runs/36577065700).
- [Production Pages deployment](https://github.com/FedotovskiiLev/Setka/actions/runs/36577454224) succeeded. Public `channel.json` endpoints confirmed Stable 0.4.0 and Betha 0.5.0-betha.1 at `308a389`, and Unstable 0.5.0-unstable.1 at `c01939d`. All three pages opened in the browser; Stable settings showed the correct version and channel links.
- Tagged [Betha](https://github.com/FedotovskiiLev/Setka/actions/runs/36577422327) and [Unstable](https://github.com/FedotovskiiLev/Setka/actions/runs/36577421924) passed both Android API gates and published their signed APKs as GitHub prereleases.
- The [Stable tagged run](https://github.com/FedotovskiiLev/Setka/actions/runs/36577422918) passed API 35 and 36 and published [Setka 0.4.0](https://github.com/FedotovskiiLev/Setka/releases/tag/v0.4.0) as Latest. Its initial API 36 job failed while downloading the emulator system image (`Error on ZipFile unknown archive`), before any app test. Only that job was retried and it passed in full.
- GitHub confirmed uploaded APK assets for all three releases, Stable as a regular Latest release and Betha/Unstable as prereleases. SHA-256: Stable `1b275e715e8d3f8d0dda65837111c78b4991ec64219f652adfceee4b370f8f7f`; Betha `8bf799627171b9dab8df3e76222871c43d6fffdefd733df460c9fd08c29cb88b`; Unstable `8d47bffa8382c97b00185de6d941b34cf7432e0d2a6b8bbb97a426ba5bf83877`.

No physical handset was attached for this work. Keyboard/safe-area/native notification/upgrade evidence from CI is emulator evidence. Background battery policies, force-stop and physical phone checks retain the limitations in `docs/unstable-device-check.md`; PWA closed-app reminders are not promised.
