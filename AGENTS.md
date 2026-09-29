# Setka working notes

## Product and boundaries

Setka is a local-first university planner: understand today, review the academic week, and fit tasks into real free time. Keep university series, personal events, tasks, planned sessions and measured study time separate. `src/domain/` has no DOM, storage or platform dependencies. A backend, account or LLM needs a concrete product reason.

Use `README.md` for running the app; DD-001/DD-002 for import and product semantics; DD-004 for the original implementation limits; DD-010 and DD-011 for the newer behaviour. Read the documents relevant to the change, not the entire documentation tree for routine edits.

Preserve fixtures and uncertain source text/provenance. The sample JSON is partial and differs from `File.xlsx`. Never derive odd/even weeks from column widths, row halves or colors. Unknown lesson types do not generate academic tasks. Never replace real browser data to populate a screenshot; use an isolated test profile and explicit import/task controls.

## Delivery

Carry authorized work through implementation, verification and the requested delivery. Resolve routine reversible choices locally. User instructions in the current task supersede older design scope or release restrictions. Report a concrete blocker rather than treating a failed command as completion.

Stable is the default `/Setka/`; Betha is `/Setka/betha/`; Unstable is `/Setka/unstable/`. See `docs/release-channels.md` when changing build, hosting or Android. Preserve existing storage, Android package IDs and signing identity. Stable/Betha publishing uses tagged snapshots; main supplies Unstable. Never commit signing material, personal backups or `.local/`.

## Verification and delegation

Local tests use disposable profiles/fixtures and have no production write access. Run relevant checks, fix regressions and rerun affected checks without asking at each step. Domain/import/allocation changes use `node --test tests/*.test.mjs`. UI changes use the relevant `tests/*-browser.mjs` workflows against a running local server, including desktop and phone sizes. Release validation includes `npm ci`, `npm run build`, channel isolation and Android CI. Rebuild after cached assets change; the service-worker version is content-hashed. Preserve JSZip's vendored licence.

Keep architecture, product decisions, ambiguous failures and final review with GPT-6 Astra. Delegate bounded test execution, log summaries and mechanical inventory to GPT-6 Luna; use GPT-6 Sol for focused regression investigation or well-specified mechanical changes. Give each subagent a precise scope, owned files, commands and expected evidence. Use minimal relevant context; avoid duplicate tests and concurrent builds in the shared `dist/`. Review delegated changes and escalate uncertain results to Astra. Never trade away necessary validation to reduce model usage.

These concise, contextual instructions follow [OpenAI's Astra guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).
