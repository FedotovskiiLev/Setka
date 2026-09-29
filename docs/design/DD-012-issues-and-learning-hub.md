# DD-012 — Issue fixes and a future learning hub

2026-09-29. Owner direction supersedes the earlier promotion plan: Stable 0.4.0 remains unchanged. All issue fixes and explicitly requested improvements go to Unstable. Betha includes these changes plus optional product refinements. No new Stable version or Android release is authorized by this task.

## Current delivery

- More uses independent desktop columns, bounded form controls and separate source metadata/actions. Betha adds settings search and focused section navigation; switching sections retains fields, and ordinary re-renders preserve unsaved settings drafts.
- The B06-603 Thursday programming clarification has an explicit dismiss action. Its notice ID is saved in the channel's existing settings and backups, deduplicated, and remains dismissed after reload/reimport. Dismissal does not accept a correction or change a lesson. Source evidence remains accessible through the lesson and source review. The owner's message called the group B06-604; the existing evidence is specifically B06-603, so the correction is not extended to another group without evidence.
- An explicit browser wheel picker complements the existing native Android NumberPicker. Cancel does not edit fields; accept edits the form, not saved preferences. Keyboard-editable time inputs remain available. The browser wheels support keyboard, touch/scroll, focus return, nested form dialogs, portrait and landscape.
- My study adds daily measured-time bars, current/previous periods, subject and note search, comparable totals and editable record history. Betha also offers starting a timer from a subject summary. None of these features infers proficiency from minutes or adds scores/streaks.

Betha additionally has a feature-led three-step onboarding flow. Permissions are requested only after an explicit enable action, with denied/unsupported recovery and a later option. Android enables reminders and the optional now/next status together; the web flow explains its foreground-only limitation. The status section stays expanded in Betha settings. Its blue motion layer uses short compositor transitions on view changes and one-time dialog/dashboard entry, never repeated on minute refresh. Reduced-motion disables animation and cancels active Web Animations.

## Preparation for interactive materials

The owner wants My study to eventually support a Duolingo-like learning journey with [mipt-interactive-materials](https://github.com/FedotovskiiLev/mipt-interactive-materials), but explicitly requested no integration yet. Inspected upstream at `b6c6e8f854fcd43d1bea53ce027729340bd907dd`: its README describes static HTML/CSS/JS topic pages, exercises/self-checking, a catalog and physics lab tools. There is no established Setka progress API in that inspected public interface. The material standard separates explanation, action, independent exercise and sources.

The current preparation is a clean extension boundary:

1. `src/domain/study-dashboard.js` derives immutable view data from local measurements; it has no DOM, storage, network or material-provider dependency.
2. `src/study-dashboard.js` renders the study overview; `src/study-ui.js` owns interaction and timer/record commands. A future material/course view can join this workspace without making the timer depend on a provider.
3. Existing `measurements`, `activeStudy`, tasks and planned sessions retain their meanings and backup compatibility. Future exercise attempts/proficiency/course progress must be separate local entities. Minutes studied and task completion are not evidence that an exercise was answered correctly.

Proposed future adapter contract (a Setka proposal, not an existing upstream API): a material reference contains provider ID, stable material/unit/exercise IDs, content revision, subject and source URL; an attempt has its own idempotent ID, material reference, started/finished timestamps, explicit result and grading provenance. Revision changes invalidate only incompatible progress, never measured-time history. Subject display names are not stable foreign keys. Units such as pages, topics and problems must not be summed as one progress quantity.

Before enabling that adapter, agree the upstream catalog/result contract and content identity, decide explicit local import versus remote launch, preserve source attribution/licenses, and test offline/missing/revised material and duplicate result delivery. A browser message is not trusted without an allowed origin and validated schema. No provider is registered, no materials are fetched/embedded, no exercise results or accounts are created by this release. There are no dead “coming soon” controls in the current UI.

## Stable preservation

The exact Stable subtree from successful Pages run 36577454224 is stored as a public compressed snapshot with per-file hashes and provenance. Production restores it unchanged, verifies all 65 files and their path set, and replaces only the Betha/Unstable child directories. Stable no longer receives source-feed copies or rebuilds during these experimental deployments. Its version, APK, package ID, signature, source data, worker and cache stay unchanged.
