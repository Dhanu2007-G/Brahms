# AstraPulse — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | AstraPulse — Astronaut Health Intelligence & Mission Decision Support |
| **Team** | Interstellar |
| **Event** | NASA Space Apps Challenge 2026 — *The Next Frontier* |
| **Challenge** | Create Health Monitoring Software for Astronauts on Space Missions |
| **Platform** | Web (React PWA + FastAPI) |
| **Quality bar** | Production-level prototype (not a medical device) |
| **Version** | 1.0 |

---

## 1. Overview

### 1.1 The challenge, in our words
Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity and a hostile closed environment. These can lead to immune changes, bone loss, cardiovascular events and behavioural-health problems. On long missions, astronauts carry much of the responsibility for noticing such changes in themselves. The challenge asks for **software that gathers health indicators and enables astronauts to evaluate and act on the status of their health.**

> Verify the exact wording on the official challenge page before submission and keep this section aligned with it.

### 1.2 Product vision
**Know the crew. Understand the signals. Protect the mission.**
AstraPulse gives each astronaut a clear, explainable picture of how they are changing relative to *their own* normal, tells them *why* something was flagged, suggests protocol-based next steps, and keeps working when Earth is unreachable.

### 1.3 Product principles
1. **Personal baseline over population average.** Each astronaut is compared with their own history.
2. **Explain everything.** No alert without evidence, rule, and plain-language reason.
3. **Provenance always.** Every value shows its source (manual, simulated, imported, device) and timestamp.
4. **Missing is not normal.** Absent data is displayed as unavailable, never as zero or healthy.
5. **Decision support, not diagnosis.** The software never diagnoses, prescribes, or overrides mission medical protocol.
6. **Offline-first.** Recording health data must not depend on connectivity.
7. **Privacy by default.** Behavioural and journal data are private unless the astronaut shares them.
8. **Deterministic core, optional AI.** Rules and statistics decide; an LLM may only rephrase.

---

## 2. Problem statement

Imagine a four-person crew in transit to Mars. Communication with Earth is delayed or intermittent. One astronaut's sleep shortens over several days, fatigue climbs, and resting heart rate drifts above their usual range. No single reading looks alarming, so the combined pattern is easy to miss — especially when the person noticing it is the one affected.

**Needs:**
- A unified view of scattered indicators.
- Comparison with a personal reference, not a generic one.
- Detection of *persistent* change, not just one-off outliers.
- Understandable reasons and suggested follow-up.
- A record of what was done and what happened next.
- Operation without a live link to the ground.

---

## 3. Goals and non-goals

### 3.1 Goals (G)
| ID | Goal |
|---|---|
| G1 | Collect structured physical, behavioural and environmental (radiation) indicators. |
| G2 | Maintain an individual, append-only history per astronaut with provenance. |
| G3 | Compute personal baselines and detect unusual readings and persistent trends. |
| G4 | Generate transparent, traceable, non-diagnostic alerts and a follow-up workflow. |
| G5 | Support behavioural wellness tracking with privacy controls. |
| G6 | Work offline and synchronise safely later. |
| G7 | Produce exportable mission health reports (PDF, CSV). |
| G8 | Ground the product in NASA research and clearly separate real from simulated data. |

### 3.2 Non-goals
- Clinical diagnosis, treatment recommendation, or medication guidance.
- Clinical validation or spacecraft/flight qualification.
- Custom sensor hardware (prototype accepts manual, simulated or imported readings).
- Training a deep-learning medical prediction model.
- Replacing flight surgeons or emergency mission procedures.

---

## 4. Users and personas

| Persona | Description | Primary needs |
|---|---|---|
| **Astronaut** (primary) | Crew member self-monitoring on a long mission. | Fast daily check-in, personal trends, understandable alerts, offline use, privacy. |
| **Mission health specialist** | Flight-surgeon-style reviewer with *authorised* access. | Crew overview, alert queue, evidence, history, reports, shared data only. |
| **System administrator** | Manages the demo deployment. | Accounts, rulesets, seed data, audit review. |

Demo crew (all synthetic) — mission **ARES-01**, a fictional Mars-transit mission:
| Profile | Scenario |
|---|---|
| ASTRA-001 | Normal trend |
| ASTRA-002 | Progressive sleep loss, rising fatigue, drifting resting heart rate |
| ASTRA-003 | Falling physical-activity / countermeasure adherence |
| ASTRA-004 | Declining mood, rising stress |

---

## 5. Challenge-to-feature coverage

| Challenge hazard | What we can responsibly track | Module |
|---|---|---|
| Space radiation | Dose-rate / cumulative dose readings (simulated, plus real NASA/NOAA context where verified) | Dashboard, Analytics, Evidence |
| Isolation & confinement | Mood, stress, sleep, optional journal, social-contact self-report | Wellness |
| Altered gravity — cardiovascular | Resting HR, BP, SpO₂, temperature, symptoms | Check-in, Analytics |
| Altered gravity — bone loss | **Countermeasure adherence** (resistive exercise minutes). We do *not* claim to measure bone density. | Check-in, Analytics |
| Immune changes | Optional lab-panel entry/import (e.g., white-cell counts) shown with source and reference provenance | Evidence, Check-in (P3) |
| Behavioural health | Mood, fatigue, stress, sleep trends; private journal | Wellness |
| Closed environment | Symptom log; optional environmental notes | Check-in |

---

## 6. User stories

| ID | As a… | I want to… | So that… | Priority |
|---|---|---|---|---|
| US-01 | Astronaut | log in securely | only I can see my data | P0 |
| US-02 | Astronaut | submit a daily check-in in under a minute | I keep a consistent record | P0 |
| US-03 | Astronaut | see today's status and recent trends | I know how I'm doing | P0 |
| US-04 | Astronaut | see how today compares with my own baseline | I spot meaningful change | P0 |
| US-05 | Astronaut | get an alert that tells me what changed, why, and what to do | I can act early | P0 |
| US-06 | Astronaut | mark an alert reviewed, comment, and log a follow-up | there is a record of action | P0 |
| US-07 | Astronaut | see each value's source and time | I trust what I'm reading | P0 |
| US-08 | Astronaut | record data while offline | disconnection doesn't stop me | P1 |
| US-09 | Astronaut | keep my journal private | I control who sees it | P1 |
| US-10 | Astronaut | export a report | I can share it with the medical team | P1 |
| US-11 | Specialist | review authorised crew and the alert queue | I can prioritise attention | P1 |
| US-12 | Specialist | see the evidence behind an alert | I can assess it quickly | P1 |
| US-13 | Admin | seed and reset the synthetic mission | demos are repeatable | P1 |
| US-14 | Astronaut | read NASA references for a metric | I understand why it matters | P2 |
| US-15 | Astronaut | get a plain-language explanation of an alert | it is easy to understand | P3 |

---

## 7. Functional requirements

Priority: **P0** must-have core · **P1** must-have intelligence/mission · **P2** differentiator · **P3** stretch.

### 7.1 Authentication & access (AUTH)
| ID | Requirement | Pri |
|---|---|---|
| AUTH-01 | Email + password login; Argon2id hashing; short-lived access token with refresh rotation. | P0 |
| AUTH-02 | Role-based access: astronaut, specialist, admin. | P0 |
| AUTH-03 | Astronaut can read/write only their own records. | P0 |
| AUTH-04 | Specialist sees only crew who have an active access grant; private journals excluded unless explicitly shared. | P1 |
| AUTH-05 | Login rate limiting and lockout back-off. | P1 |
| AUTH-06 | Audit log of logins, reads of another user's data, alert actions, exports, grants. | P1 |

### 7.2 Health Command Dashboard (DASH)
| ID | Requirement | Pri |
|---|---|---|
| DASH-01 | Show crew ID, mission, mission day, last check-in time. | P0 |
| DASH-02 | Cards for HR, BP, SpO₂, temperature, sleep, activity, mood, fatigue, stress, radiation. Each shows value, unit, timestamp, source badge, and delta vs baseline. | P0 |
| DASH-03 | Missing data shows "Not recorded" with timestamp of last value — never a normal-looking value. | P0 |
| DASH-04 | Trend chart with baseline band; selectable 7/14/30-day range. | P0 |
| DASH-05 | Unreviewed alerts panel. | P0 |
| DASH-06 | Data-status indicator: online, offline, N pending sync. | P1 |
| DASH-07 | Global "Simulated data" banner whenever any displayed value is simulated. | P0 |

### 7.3 Daily Check-in (CHK)
| ID | Requirement | Pri |
|---|---|---|
| CHK-01 | Capture optional: resting HR, BP (sys/dia), temperature, SpO₂, respiratory rate. | P0 |
| CHK-02 | Capture: sleep hours, sleep quality (1–5), exercise minutes, resistive-exercise minutes. | P0 |
| CHK-03 | Capture: mood, fatigue, stress (1–5), symptoms (controlled list), free-text note. | P0 |
| CHK-04 | Every field optional; skipped fields stored as *missing*, not zero. | P0 |
| CHK-05 | Client + server validation against plausibility bounds; clear error messages. | P0 |
| CHK-06 | Observation time editable (back-fill) with `recorded_at` stored separately. | P1 |
| CHK-07 | Corrections create an *amendment* record; originals are never overwritten. | P1 |
| CHK-08 | CSV/JSON import with provenance label and validation report. | P1 |
| CHK-09 | Optional lab-panel entry (e.g., WBC, lymphocyte %). | P3 |

### 7.4 Health Intelligence Engine (ENG)
| ID | Requirement | Pri |
|---|---|---|
| ENG-01 | Validate, de-duplicate, and normalise units; keep raw values. | P0 |
| ENG-02 | Personal baseline = median over configurable window (default 14 days) with ≥ minimum valid observations (default 7). | P1 |
| ENG-03 | Robust deviation (modified z-score) with MAD → IQR → floor scale fallback. | P1 |
| ENG-04 | Direction-aware per metric (high, low, or both matter). | P1 |
| ENG-05 | Trend detection (Theil–Sen slope + rolling median). | P1 |
| ENG-06 | Persistence rule: deviation on ≥ *m* of last *n* days. | P1 |
| ENG-07 | Combined-pattern rule across metrics (e.g., sleep ↓ + fatigue ↑ + HR ↑). | P1 |
| ENG-08 | States: `insufficient_data`, `baseline_forming`, `no_significant_deviation`, `watch`, `review_required`. | P1 |
| ENG-09 | All thresholds from a **versioned ruleset file**, labelled as demonstration parameters. | P1 |
| ENG-10 | Engine is a pure function of (observations, ruleset, as-of time) → reproducible. | P1 |
| ENG-11 | Experimental Isolation Forest, shown separately and never auto-alerting. | P3 |

### 7.5 Alerts & Decision Support (ALR)
| ID | Requirement | Pri |
|---|---|---|
| ALR-01 | Each alert shows: what changed, baseline vs latest, persistence, rule + ruleset version, suggested follow-up, evidence link. | P0 |
| ALR-02 | Actions: acknowledge/review, comment, record follow-up observation, view underlying measurements. | P0 |
| ALR-03 | Suggested follow-ups come from a configurable *protocol library* (placeholder protocol text, clearly labelled). | P1 |
| ALR-04 | Alerts are idempotent: re-running analytics does not create duplicates. | P1 |
| ALR-05 | Alert history and outcome timeline preserved. | P1 |
| ALR-06 | Every alert/UI string passes the safety copy rules (no diagnosis language). | P0 |
| ALR-07 | Optional "Explain" rewrite by LLM, grounded on the structured alert only. | P3 |

### 7.6 Behavioural Wellness (WEL)
| ID | Requirement | Pri |
|---|---|---|
| WEL-01 | Sleep, mood, fatigue, stress trends vs baseline. | P1 |
| WEL-02 | Private journal, default `private`. | P1 |
| WEL-03 | Sharing is explicit, per entry or per time window, revocable, audited. | P1 |
| WEL-04 | Journal text is never used by analytics or sent to third-party AI. | P1 |
| WEL-05 | Supportive, non-clinical wording; always reference mission-protocol support channels. | P1 |

### 7.7 Mission Reports (RPT)
| ID | Requirement | Pri |
|---|---|---|
| RPT-01 | Report for a period: indicators, baseline comparison, alerts, follow-ups, completeness, provenance. | P1 |
| RPT-02 | Export PDF and CSV. | P1 |
| RPT-03 | Report footer carries disclaimer, ruleset version, generated-at, data-source mix. | P1 |
| RPT-04 | Excluding private journal content by default. | P1 |

### 7.8 Research & Evidence (EVD)
| ID | Requirement | Pri |
|---|---|---|
| EVD-01 | Evidence library: NASA HRP risks, OSDR studies, papers; each with URL, access date, what it supports. | P2 |
| EVD-02 | Each metric/alert links to relevant evidence. | P2 |
| EVD-03 | Dataset registry: accession, variables, units, subjects, access restrictions, limitations. | P2 |
| EVD-04 | Real vs synthetic data is visually distinct everywhere. | P0 |

### 7.9 Offline & Sync (OFF)
| ID | Requirement | Pri |
|---|---|---|
| OFF-01 | Installable PWA; app shell cached. | P1 |
| OFF-02 | Check-ins saved to IndexedDB when offline; shown as *Pending sync*. | P1 |
| OFF-03 | Idempotent sync (client-generated UUIDs / idempotency keys); no duplicates after retries. | P1 |
| OFF-04 | Recovery after app close/crash mid-queue. | P1 |
| OFF-05 | Local cache of last N days for read-only viewing. | P1 |
| OFF-06 | Simulated "communication blackout" mode for demos. | P2 |

---

## 8. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Dashboard interactive < 2.5 s on a mid-range laptop (cached); API p95 < 300 ms for reads at demo scale. |
| NFR-02 | Reliability | Zero data loss for submitted check-ins, including offline→online transitions. |
| NFR-03 | Security | OWASP ASVS L1 baseline: input validation, authz on every route, secure headers, no secrets in repo. |
| NFR-04 | Privacy | Minimal data collection; no health data to third-party services; logs contain no health values. |
| NFR-05 | Accessibility | WCAG 2.2 AA contrast and keyboard navigation; charts have text alternatives. |
| NFR-06 | Responsiveness | Usable from 360 px to desktop widths. |
| NFR-07 | Testability | Analytics ≥ 90 % line coverage; overall backend ≥ 80 %; critical flows covered by e2e tests. |
| NFR-08 | Observability | Structured logs, request IDs, health/readiness probes. |
| NFR-09 | Reproducibility | One-command local setup; deterministic seed (fixed random seed). |
| NFR-10 | Documentation | Every public API documented (OpenAPI); data dictionary maintained. |

---

## 9. Data and provenance requirements

- Each observation carries: `metric_code`, `value` (nullable), `unit`, `observed_at`, `recorded_at`, `data_source`, `source_ref`, `status`.
- `data_source` ∈ `manual | simulated | imported_file | imported_nasa | device`.
- Simulation and real data are never merged without labels; reports state the source mix.
- Records are append-only; corrections are amendments linked to the original.
- Full definitions: see [DATA_DICTIONARY.md](DATA_DICTIONARY.md).

---

## 10. Success metrics

**Product**
| Metric | Target |
|---|---|
| Check-in completion time | ≤ 60 s for a full entry |
| Alert explainability | 100 % of alerts show evidence + rule + ruleset version |
| Offline durability | 0 lost or duplicated records in the offline test suite |
| Scenario detection | Seeded sleep-loss and mood-decline scenarios flagged; normal scenario produces no `review_required` |
| Test health | All release gates in [TEST_PLAN.md](TEST_PLAN.md) green |

**Challenge**
| Metric | Target |
|---|---|
| End-to-end demo | Completes the demo script without manual fixes |
| Scientific grounding | Every claim in the deck traceable to a source or labelled as our design choice |
| Clarity | Judges can state in one sentence what AstraPulse does |

---

## 11. Assumptions, constraints, risks

**Assumptions:** Synthetic data is acceptable for demonstration if clearly labelled; judges value clarity, feasibility and scientific honesty.

**Constraints:** Software-only; open-source stack; no clinical thresholds presented as authoritative.

| Risk | Impact | Mitigation |
|---|---|---|
| Scope creep | Unfinished product | Strict priority tiers; vertical slices first |
| Many similar public solutions exist | Weak differentiation | Lean into provenance, explainability, privacy, offline sync correctness, evidence linking |
| Overclaiming medical value | Credibility loss | Safety copy rules; limitations slide |
| NASA dataset lacks needed fields | Blocked feature | Dataset registry; use as context, not as core input |
| Offline sync bugs | Data loss/duplication | Idempotency keys, tests, append-only model |
| LLM hallucination | Unsafe text | LLM optional, grounded, never decides |

---

## 12. Out of scope for this release
Native mobile apps, wearable device integrations, multi-mission tenancy, real flight-data ingestion, clinical decision rules validated against outcomes.

---

## 13. Glossary
**Baseline** — personal reference value from recent history. **MAD** — median absolute deviation. **Modified z-score** — robust standardised deviation. **Persistence** — repeated deviation over consecutive observations. **Provenance** — the origin and handling history of a data value. **Ruleset** — versioned file of demonstration thresholds and rules. **Amendment** — a correction record linked to an original observation.
