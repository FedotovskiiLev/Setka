# Setka 0.4.0 — Stable

The everyday planner now includes the Unstable feature set in the default edition, with a clearer desktop and phone workspace.

- Compact Today, quick navigation across the week, consistent lesson colors and a study action near the heading.
- Searchable tasks grouped by deadlines; repeating tasks, reversible completion and editable planned work.
- Recoverable study timer, pause/resume, editable measured time and local subject statistics.
- Individual timetable choices across groups, reviewable source updates, correction history and personal event exceptions.
- Recommendation minimums/exclusions and optional Android now/next status.
- Clearer settings, catalog loading/retry, and errors shown inside open forms.
- Stable, Betha and Unstable have separate data and installation identities.

[Open Stable](https://fedotovskiilev.github.io/Setka/). The signed APK updates the existing Stable package `io.setka.app.release` using the same certificate. Keep the app installed and use the ordinary update flow; export a backup before moving data between editions. Old 0.2.0 users retain the separate migration procedure in `docs/android-release.md`.

Android publication is gated on API 35/36 integration checks, including old-Stable data retention, planning/export, notifications, timer recovery, status transitions and reboot restoration. Physical-device battery restrictions and force-stop remain platform constraints. PWA reminders are not guaranteed with the app closed. No cloud account or synchronization is introduced.
