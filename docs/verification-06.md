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

Local verification: npm ci and both experimental builds passed; all 83 domain/import/storage tests passed. Browser checks cover dismissal/reload, the original timer flows, the expanded dashboard, native-input drafts and browser wheels, a 61-second refresh while a wheel is open, responsive settings and Betha onboarding. Viewports include 1440, 1024, 320, 390 and 844px landscape where relevant. Onboarding tests include grant/reload, denial/retry, unsupported APIs, save failures, explicit permission requests and reduced motion.

Before deployment, all 65 public Stable files matched the frozen manifest by size and SHA-256 at the canonical `/Setka/` path. The lowercase `/setka/` path returned 404 during verification; links use the working case-sensitive path.

The first new native wheel test exposed a case-sensitive test locator: Android renders its buttons as `ОТМЕНА`/`ВЫБРАТЬ`. The test now matches their labels without case sensitivity. The picker itself had returned the expected scrolled hour/minute in the failure evidence.

Final preflight evidence on `f31c6c2`:

- [Pages PR gate](https://github.com/FedotovskiiLev/Setka/actions/runs/36588679045): all domain tests, legacy and new browser suites, experimental assembly, exact Stable verification and channel isolation passed.
- [Unstable signed Android](https://github.com/FedotovskiiLev/Setka/actions/runs/36588684657): API 35 and 36 passed the picker, native layout, import, background reminders, export, reinstall, timer/status and reboot checks.
- [Betha signed Android](https://github.com/FedotovskiiLev/Setka/actions/runs/36588676467): the same API 35/36 checks passed, including explicit notification/status enablement through the new onboarding.

Release tags `v0.5.0-unstable.2` and `v0.5.0-betha.2` repeat the signed Android gates before publication. Their source differs from this verified preflight only by this evidence record and removing local agent instructions from Git tracking. The release and issue closure records link the final publication runs. Stable has no new tag or APK in this delivery.
