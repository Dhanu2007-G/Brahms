# AstraPulse

**Astronaut Health Intelligence & Mission Decision Support**
*Know the crew. Understand the signals. Protect the mission.*

Built by **Team Interstellar** for the **NASA Space Apps Challenge 2026** — challenge: *Create Health Monitoring Software for Astronauts on Space Missions*.

> AstraPulse is a research-informed decision-support prototype. It uses clearly labelled simulated data, is not clinically validated, is not a medical device, and does not provide medical diagnosis or treatment advice.

---

## What it does
- Daily check-ins for vitals, sleep, activity, mood, fatigue, stress, symptoms and radiation context
- **Personal baselines** (median/MAD) and robust deviation and trend detection
- **Explainable alerts** with baseline vs latest, persistence, rule ID, ruleset version and linked evidence
- Review, comment and follow-up workflow
- Behavioural wellness with **private-by-default** journal and consent-based specialist access
- **Offline-first PWA** with idempotent synchronisation
- Mission health reports (PDF/CSV) with provenance and disclaimers

## Documentation map

| File | Purpose |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | AI coding rules and prime directives (copy to `.cursorrules` if needed) |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, user stories, acceptance criteria |
| [`docs/TECH_STACK.md`](docs/TECH_STACK.md) | Architecture, stack, security, offline design, ADRs |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phased implementation plan with exit criteria and kickoff prompts |
| [`docs/ANALYTICS_SPEC.md`](docs/ANALYTICS_SPEC.md) | Algorithms, rules, ruleset YAML, reference code, test invariants |
| [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) | Tables, enums, constraints, provenance and missing-data rules |
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | REST contract, auth, errors, examples |
| [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) | Test strategy, case catalogue, release gates |
| [`docs/SAFETY_AND_LIMITATIONS.md`](docs/SAFETY_AND_LIMITATIONS.md) | Language rules, AI safety, privacy, limitations, disclosures |
| [`docs/SUBMISSION.md`](docs/SUBMISSION.md) | Pitch, deck outline, demo script, Q&A, claims audit, checklists |

## Suggested reading order
1. `PRD.md` → 2. `TECH_STACK.md` → 3. `ROADMAP.md` → 4. `CLAUDE.md` → then use the phase kickoff prompts in the roadmap.

## How to use with an AI coding assistant
1. Place this folder's contents in your repo root (`CLAUDE.md` at root, the rest in `docs/`).
2. Start each phase with the **kickoff prompt** in `docs/ROADMAP.md`.
3. Require the assistant to read the relevant spec, write tests first, and run the verification commands in `CLAUDE.md` §3.

## Quick start (after Stage 1 foundation)
```bash
docker compose -f infra/docker-compose.yml up -d
cd backend && source .venv/bin/activate && alembic upgrade head && uvicorn app.main:app --reload
cd frontend && npm run dev
```

## Data and attribution
Demo crew (ARES-01: ASTRA-001…004) is entirely fictional and synthetic. Any NASA/NOAA data used is cited in the in-app Evidence library with source URL and access date.

## Licence
Choose an OSI-approved licence (MIT or Apache-2.0 recommended) before publishing.
