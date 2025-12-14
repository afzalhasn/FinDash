# Collaboration Plan & Trigger Commands

Use this plan to coordinate between team members (or agents) by following the agreed workflow and by issuing consistent commands when requesting work from Codex.

## Sequential Workflow
1. **Review** – Before any coding, read the relevant docs (`docs/architecture-flow.md`, `docs/api-design.md`, `docs/roadmap.md`) and inspect affected files. Confirm assumptions or raise questions.
2. **Plan** – Outline steps (usually 2–4) for the task. If the task is trivial, skip the plan; otherwise keep it updated after each major step.
3. **Implement** – Modify code or docs using `apply_patch` or targeted commands. Keep edits scoped to the agreed plan.
4. **Validate** – Run needed tests/lints or explain why validation was skipped (e.g., unavailable tooling).
5. **Summarize & Next Steps** – Report changes referencing files/lines and suggest logical follow-up actions.

## Trigger Commands (examples)
Use these phrases when asking Codex to start specific work:
1. `Codex, start Backend Phase 1 Task 1` – kicks off scaffolding for the backend app.
2. `Codex, continue with Backend Phase 3 Auth Epic` – resumes work on authentication endpoints.
3. `Codex, run Frontend Phase C Transaction Integration` – switches focus to wiring transactions to the API.
4. `Codex, document findings for API Design updates` – requests doc-only updates.
5. `Codex, pause current task and summarize status` – halts work and reports progress.
6. `Codex, verify tests for <module>` – triggers validation without new code changes.

Feel free to add more commands as new recurring tasks emerge; keeping phrasing consistent makes collaboration smoother.
