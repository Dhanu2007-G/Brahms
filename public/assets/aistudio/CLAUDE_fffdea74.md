# CLAUDE.md — AstraPulse AI Coding Rules

> Copy this file to `.cursorrules`, `AGENTS.md` or `.github/copilot-instructions.md` if you use another AI coding tool.
> Read this file fully before writing or changing any code. If a request conflicts with these rules, say so and propose a compliant alternative.

---

## 1. Project snapshot

**AstraPulse** is an offline-capable web app that helps astronauts monitor health indicators, compare them with their *personal baseline*, receive *explainable* non-diagnostic alerts, and record follow-up actions. Built by Team Interstellar for the NASA Space Apps Challenge 2026 ("Create Health Monitoring Software for Astronauts on Space Missions").

- Frontend: React 19 + TypeScript (strict) + Vite + Tailwind v4 + shadcn/ui + TanStack Query + Dexie
- Backend: Python 3.12 + FastAPI + SQLAlchemy 2 + Alembic + Pydantic v2 + PostgreSQL 16
- Analytics: pure NumPy/Pandas library in `backend/app/analytics/`
- Specs: `docs/PRD.md`, `docs/TECH_STACK.md`, `docs/ANALYTICS_SPEC.md`, `docs/DATA_DICTIONARY.md`, `docs/API_SPEC.md`, `docs/TEST_PLAN.md`, `docs/SAFETY_AND_LIMITATIONS.md`, `docs/ROADMAP.md`

**Read the relevant spec before implementing a feature.** Specs are the source of truth; if code and spec disagree, update one deliberately and say which.

---

## 2. Prime directives (never violate)

1. **Provenance on every value.** Every observation has `data_source` (`manual | simulated | imported_file | imported_nasa | device`), `observed_at`, `recorded_at`. Never create or display a health value without it.
2. **Missing ≠ zero ≠ normal.** Use `None`/`NULL` for absent values. Never default, impute, or display a missing value as a normal reading. UI shows "Not recorded".
3. **No diagnoses, no prescriptions.** Neither code, UI copy, reports nor LLM output may diagnose, name a condition as present, or recommend medication or dosage.
4. **No hard-coded clinical thresholds.** Plausibility bounds live in `metric_definitions`; analytic thresholds live in versioned ruleset YAML and are labelled *demonstration parameters*. Do not invent "medical limits" in code, tests, or copy.
5. **Explainable alerts only.** Every alert stores: metric(s), baseline, latest value, deviation, persistence window, rule ID, ruleset version, and evidence observation IDs.
6. **Deterministic core.** The analytics engine is a pure function: no I/O, no clock, no randomness. An LLM may rephrase results but never decides, scores, or alters them.
7. **Synthetic data is always labelled.** Anything generated is `data_source = simulated`; UI shows a "Simulated data" banner whenever any displayed value is simulated.
8. **Privacy by default.** Journal/wellness text is `private` unless explicitly shared. Never send health data or journal text to third-party services. Never log health values or journal text.
9. **Append-only health records.** Never UPDATE or DELETE observations. Corrections are amendments (`amends_id`).
10. **Authorise every route.** Role and ownership/grant checks on every endpoint; deny by default.

---

## 3. Commands

```bash
# Database
docker compose -f infra/docker-compose.yml up -d

# Backend (from backend/, venv active)
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed --reset          # deterministic synthetic ARES-01 mission
uvicorn app.main:app --reload
pytest -v --cov=app --cov-report=term-missing
ruff check . && ruff format --check .
mypy app/analytics app/services

# Frontend (from frontend/)
npm install
npm run dev
npm run lint && npm run typecheck && npm run test && npm run build
npx playwright test
```

Run lint + type-check + tests for the area you changed **before** declaring a task done.

---

## 4. Architecture rules

- Layers: `api/v1 routers → services → repositories → models`. Routers are thin: parse, authorise, call a service, return.
- Only repositories touch the database session.
- `backend/app/analytics/` imports **nothing** from FastAPI, SQLAlchemy, or other `app` packages. Inputs and outputs are plain dataclasses/Pydantic-free types.
- Pydantic schemas (API) are separate from SQLAlchemy models (DB). Do not return ORM objects from routers.
- Frontend: pages compose components; data access only via `services/` + TanStack Query hooks; offline logic only in `offline/`.
- Shared contracts: keep Zod schemas (`frontend/src/schemas`) in sync with Pydantic schemas; update both in the same change.
- No new dependency without stating why, checking maintenance status, and pinning the version.

---

## 5. Code conventions

**Python**
- Type hints everywhere; `mypy` clean for `analytics` and `services`.
- `ruff` for lint/format. Functions < 40 lines where practical; descriptive names; docstrings for public functions describing units and edge cases.
- Use `datetime` with timezone (UTC). Never naive datetimes.
- Units are explicit in names: `resting_hr_bpm`, `sleep_hours`, `body_temp_c`.
- Raise domain exceptions in services; map to problem+json in one handler.

**TypeScript / React**
- `strict: true`; no `any` (use `unknown` + narrowing). Use `import type` for types.
- Function components + hooks; one component per file; props typed.
- No data fetching in components — use hooks in `services/`/`hooks/`.
- Accessibility: semantic HTML, labels for all inputs, focus states, `aria-live` for status changes.
- Tailwind with design tokens (`bg-graphite`, `bg-navy`, `text-telemetry`, `text-signal`); no raw hex in components.

**API**
- Versioned under `/api/v1`. Nouns, plural resources. Errors as RFC 7807. Pagination via `limit`/`cursor`. Mutating endpoints accept `Idempotency-Key`.

**Database**
- Every schema change is an Alembic migration with a down-revision that works. Never edit applied migrations.
- Add indexes for `(crew_id, metric_code, observed_at)` and other query paths you introduce.

**Git**
- Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`). Small, focused commits. Never commit `.env`, secrets, or real personal data.

---

## 6. Workflow for any task

1. **Restate** the task and name the spec sections it implements.
2. **Plan** briefly: files to touch, tests to add, risks. For anything > ~3 files, share the plan first.
3. **Write tests first** (or alongside) — especially for analytics, validation, authorisation, and sync.
4. **Implement** the smallest change that satisfies the spec.
5. **Verify**: run the commands in §3; show results. Do not claim success without running them.
6. **Update docs** (spec, data dictionary, API spec) if behaviour or contracts changed.
7. **Summarise**: what changed, what was verified, what is not done, any assumptions.

Prefer vertical slices (UI → API → DB → test) over building one layer completely.

---

## 7. Testing rules

- Analytics: unit tests with hand-computed expected values, property tests (Hypothesis) for invariants (e.g., adding a constant shifts the baseline by that constant; scale never zero), and golden tests on the four ARES-01 scenarios.
- Each Prime Directive has at least one automated test (see `docs/TEST_PLAN.md` IDs `SAF-*`).
- Authorisation tests: every endpoint has an "unauthenticated → 401", "wrong role → 403", and "other user's data → 403/404" test.
- Offline/sync tests: duplicate submit, interrupted sync, reconnect ordering.
- Do not weaken or delete a failing test to make it pass; fix the cause or explain why the test is wrong.
- Coverage gates: analytics ≥ 90 %, backend ≥ 80 %.

---

## 8. UI copy rules (see `docs/SAFETY_AND_LIMITATIONS.md`)

Allowed: "differs from your recent baseline", "review suggested", "sustained change", "consider following your mission protocol".
Forbidden: "you have…", "diagnosis", "disease/condition names as findings", "dangerous/critical" as a medical judgement, medication names or doses, "normal" for missing data.
Every alert and report shows: *"Decision-support prototype using simulated data. Not a medical diagnosis."* where applicable.

---

## 9. Security rules

- Never put secrets, tokens, or passwords in code, tests, fixtures, logs, or docs. Use env vars.
- Validate all input server-side even if validated client-side.
- Hash passwords with Argon2id only. Do not write custom crypto.
- Do not widen CORS, disable CSRF/cookie flags, or skip authz "for the demo".
- Treat imported files as untrusted: size/type limits, schema validation, no formula execution, no path traversal.

---

## 10. Ask a human before

- Changing a Prime Directive, the data model's provenance fields, or authorisation logic.
- Adding any call to an external AI/analytics service.
- Using real NASA data fields not yet recorded in `docs/DATA_DICTIONARY.md` (dataset registry).
- Deleting data, rewriting migrations, or force-pushing.
- Adding a dependency with a non-permissive licence.

---

## 11. Reusable prompt templates

**Implement a feature**
> Implement `<FR-ID>` from `docs/PRD.md`. Read `docs/<relevant spec>.md` first. Give a short plan, write tests first, implement, run lint/type/tests, and summarise. Obey CLAUDE.md prime directives.

**Add an analytics rule**
> Add rule `<rule_id>` to the ruleset (`demo_v1.yaml` → bump to `demo_v2.yaml`). Update `ANALYTICS_SPEC.md`, add unit + golden tests, and ensure the explanation template names the evidence. Do not hard-code thresholds in Python.

**Add an endpoint**
> Add `<METHOD /api/v1/...>` per `docs/API_SPEC.md`. Include Pydantic schemas, service + repository methods, authz tests (401/403/ownership), OpenAPI docs, and audit logging if it reads another user's data.

**Review my diff**
> Review the diff against CLAUDE.md prime directives, layering rules, and the test plan. List violations first, then risks, then nits.

---

## 12. Anti-patterns (reject on sight)

- Filling missing values with 0, mean, or "normal".
- A "risk score" or label without stored evidence and rule ID.
- LLM text shown without the deterministic explanation beside it.
- Thresholds embedded in components, services, or SQL.
- Mixed real and simulated data without labels.
- Silent catch/ignore of sync failures.
- Logging request bodies on health endpoints.
- Large refactors bundled with feature work.
