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

## Release evidence

Android API 35/36 runs and Pages deployment must complete successfully before these candidates are reported as published. The final run URLs and outcomes are appended when available.

No physical handset was attached for this work. Keyboard/safe-area/native notification/upgrade evidence from CI is emulator evidence. Background battery policies, force-stop and physical phone checks retain the limitations in `docs/unstable-device-check.md`; PWA closed-app reminders are not promised.
