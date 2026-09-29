# DD-011 — Everyday workspace and three release channels

2026-09-29. The owner requested a product review, promotion of the Unstable features to Stable, and a third channel named **Betha**, including signed GitHub Android releases. This supersedes the earlier Unstable-only scope and promotion restriction in DD-010.

## Product decisions

The main loop remains timetable → available interval → task → planned or measured work. The desktop workspace has a restrained blue/neutral shell, preserving Setka’s blue brand; lesson colors retain consistent semantic meanings in Today and Week. Today puts the compact study action near the heading, adds a seven-day date strip, and keeps the current/next block above the timetable. Mobile layouts preserve the study action beside Today and a bottom navigation clear of the safe area. The academic Week grid, zoom, expanded mode and landscape print remain available.

Tasks are ordered by deadline date/time, then priority and title. Groups distinguish overdue, today, the next seven days, later and undated work. Search matches all query words across title, subject and notes; the manual-origin filter and reversible completion remain. Presentation ordering does not change allocation or stored estimates. Fully allocated tasks display `В плане`; future manual plans default to the configured day start. Today shows the nearest deadlines in its queue.

Settings gain direct links to timetable, day rhythm, follow-ups, notifications and data. Each channel identifies itself and links to the other PWAs and Android releases. There is no automatic cross-channel data transfer.

The catalog displays a loading state and a retry/local-file recovery path. Closing the dialog abandons its UI update. Errors and statuses raised while a dialog is open are displayed inside that dialog: a document-level toast cannot reliably appear over a native top-layer dialog. Setup buttons share one width rather than overflowing their content column.

## Feature continuity

Study measurements, pause/resume/recovery, corrections and statistics remain separate from estimates/plans. Repeating tasks, personal event exceptions, recommendation exclusions, individual cross-source selections, source correction history and Android now/next status remain supported. Known uncertain source records remain reviewable; no parser certainty is invented to make a release pass.

## Delivery and evidence

`release-channels.json` defines the three web/Android versions and monotonically increasing Android codes. Stable keeps its existing identities, Betha uses new isolated identities, and Unstable retains its existing identities. Pages publishes one combined artifact: Stable and Betha are built from their release tags, Unstable from main. The source feed is refreshed for all three without copying main's application code into frozen snapshots.

The dynamic catalog browser test now checks the rendered grid against the imported workbook's own bells. Fixed-workbook tests continue to assert the original ФАКТ 10:45 bell; a changing official workbook must not be mistaken for a fixed fixture.

See `docs/verification-05.md` for actual results and remaining device limitations. No emulator result is a claim about a physical phone or its battery policy.
