# Verification — issue closure and experimental channels

2026-09-29. Target: Unstable 0.5.0-unstable.2 and Betha 0.5.0-betha.2; Stable remains 0.4.0 with exact deployed bytes.

The owner confirmed the physical Android checks as “да всё норм” in response to a question listing locked/background notifications, reboot and force-stop/reopen. This is owner-reported evidence, not an agent-observed device run. Model, OS and APK hash were not supplied in that confirmation; no device is attached to ADB. Existing CI evidence remains separately attributable to API 35/36 emulators.

Issue evidence:

| Issue | Resolution and verification |
| --- | --- |
| #2 signing / Android QA | Retained signing identity, signed API 35/36 upgrade/coexistence, native layouts, export, notifications and reboot tests; owner confirmation above. Legacy 0.2.0 migration limitations remain documented. |
| #3 study timer/statistics | Separate measured-time entity; pause/restart/correction/deduplication/progress tests; expanded daily/period/subject/history view. |
| #4 optional now/next | Existing opt-in transition lifecycle, Stop, quiet hours and reboot checks; owner confirmation above. Force-stop requires reopening as documented. |
| #5 individual study plans | Source-backed choices, explicit own-lesson replacement, reviewable diffs, undo, attendance and off-parity regression. No broader registration system is introduced. |
| #6 task flows / polish | Repeats, deadline reminders, planned-work edits, personal exceptions; desktop More geometry corrected. |
| #7 time wheels | Existing native Android NumberPicker plus browser wheel fallback, cancellation/focus/keyboard/scroll/form preservation checks. |

Final local and published run evidence is recorded below when complete.
