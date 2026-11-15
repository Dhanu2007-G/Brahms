# AstraPulse — Pitch & Submission Blueprint

Team Interstellar · NASA Space Apps Challenge 2026 · *The Next Frontier*
Challenge: **Create Health Monitoring Software for Astronauts on Space Missions**

> **Rule for this document:** text marked `[UPDATE AFTER BUILD]` must be rewritten to describe only what is *actually working* at submission. Never claim a feature that is not demonstrable.

---

## 1. Facts to verify on the official site before submitting

I could confirm the following from public pages, but **the official Space Apps site is the authority** — re-check each item:

| Item | What I found | Action |
|---|---|---|
| Event dates | Nov 14–15, 2026 | Confirm local event + time zone |
| Challenge description | Software that gathers health indicators and enables astronauts to evaluate and act on their health; hazards: radiation, isolation/confinement, altered gravity, closed environment → immune changes, bone loss, cardiovascular events, behavioural-health problems | Copy the exact official wording into the deck's problem slide |
| Results timeline | Global nominees/finalists/honourable mentions announced Dec 2026; global winners Jan 2027 (per the participant FAQ) | Note in team calendar |
| Submission form fields, deadline, file/video limits, judging criteria | **Not verified** | Read the official submission guide and your local event instructions; write limits into §11 checklist |
| Team registration | — | Ensure every member is registered and the team is linked to the challenge |

Official links: `https://www.spaceappschallenge.org/2026/` · Participant FAQs: `https://www.spaceappschallenge.org/resources/participant-faqs/`

---

## 2. Positioning

### 2.1 One-sentence pitch
**AstraPulse helps astronauts see how they are changing relative to their own normal, explains why a pattern was flagged, and keeps working when Earth is out of reach — without ever pretending to diagnose.**

### 2.2 Elevator pitch (30 seconds)
> On a Mars mission, the person most likely to notice a slow decline in sleep, mood or heart-rate patterns is the astronaut living it — and the signals are scattered. AstraPulse combines daily check-ins and indicators into one view, compares each astronaut with their *own* baseline, and raises explainable alerts that show exactly which readings triggered them. It works offline, labels every data source, protects private wellness data, and is built as a transparent decision-support tool — not a black-box diagnosis engine.

### 2.3 Landscape and differentiation
Other teams are building in this space; several public projects already show dashboards, personal baselines, rule engines and offline support. **Do not pitch "dashboard + baseline + alerts" as the novelty.** Differentiate on rigour and trust:

| Differentiator | What to show | Why it matters |
|---|---|---|
| **Provenance everywhere** | Source badge + timestamp on every value; real vs simulated visually separated; report lists source mix | Health software is only as trustworthy as its data lineage |
| **Missing ≠ normal** | Live demo of a skipped field showing "Not recorded" | Common silent failure in dashboards |
| **Explainable alerts with evidence** | Click-through from alert → rule → ruleset version → underlying observations | Judges can audit the logic |
| **Robust personal statistics** | Median/MAD with tested fallbacks; Theil–Sen trends; property tests | Scientific honesty, not a magic score |
| **Privacy by design** | Private journal; specialist access only via explicit, expiring grants; audit trail | Behavioural health is sensitive |
| **Correct offline sync** | Idempotent outbox, crash-safe, zero-dup tests; blackout simulator | Directly tied to deep-space comms limits |
| **Honest limitations** | Dedicated slide; countermeasure-adherence framing for bone loss instead of fake measurement | Credibility with NASA reviewers |
| **Evidence linking** | Each metric links to NASA HRP/OSDR sources with access dates | Grounds the build in NASA research |

Choose **two or three** of these as the story you repeat. Recommended: *Explainable + Provenance + Offline correctness.*

### 2.4 Scientific grounding (verify each link and cite with access date)
| Source | How we use it |
|---|---|
| NASA Human Research Program — Human Research Roadmap (risk pages) | Context for risks: radiation, sleep/circadian, behavioural health, cardiovascular, bone |
| NASA Open Science Data Repository (OSDR) — `https://osdr.nasa.gov/` | Dataset registry; inspect study fields/permissions before using |
| OSDR RadLab visualisation (`https://visualization.osdr.nasa.gov/radlab/`) — **verify** | Context for real radiation measurements |
| NASA HRP *Artemis II Human Research Data Methodology Challenge* winners — `https://www.nasa.gov/hrp/winners-of-nasa-hrps-artemis-ii-data-methodology-challenge/` | Supports per-astronaut (individual) modelling for tiny crews — our baseline philosophy |
| TRISH behavioural-health monitoring TechNeed listing — `https://www.yet2.com/active-projects/seeking-behavioral-health-emergency-monitoring-capabilities-and-expertise-for-spaceflight/` | Shows interest in monitoring that can operate without cloud access (supports offline-first) |
| NASA-STD-3001 (crew health standards) | Optional context only; **do not** present its values as our thresholds unless used verbatim with citation |

---

## 3. Submission text (drafts — update after build)

### 3.1 Project title
**AstraPulse — Astronaut Health Intelligence & Mission Decision Support**

### 3.2 Short summary (≈ 60 words) `[UPDATE AFTER BUILD]`
AstraPulse is an offline-capable web platform that lets astronauts record health indicators, compare them with their own personal baseline, and understand why a pattern was flagged. Explainable alerts link to the underlying measurements, data provenance is shown everywhere, wellness data stays private by default, and check-ins sync safely after connectivity returns. It is a decision-support prototype, not a diagnostic system.

### 3.3 Detailed description `[UPDATE AFTER BUILD]`
**The challenge.** On long missions, astronauts face radiation, isolation and confinement, altered gravity and a closed environment, with potential cardiovascular, immune, bone and behavioural-health effects. Astronauts must often recognise changes in themselves, with delayed or unavailable support from Earth.

**Our solution.** AstraPulse unifies daily check-ins (vitals, sleep, activity, mood, fatigue, stress, symptoms) and environmental context (radiation) into one explainable view. Instead of generic cut-offs, it builds a *personal baseline* for each astronaut and detects statistically unusual readings and *persistent* trends.

**How it works.** A deterministic analytics engine validates data, computes robust baselines (median and MAD with documented fallbacks), measures direction-aware deviations, detects trends (Theil–Sen), and applies versioned demonstration rules for single, persistent and combined patterns. Each alert states what changed, compares baseline with latest, shows persistence, cites the rule and ruleset version, and links to the underlying observations. Astronauts can review, comment and record follow-up observations.

**Mission realism.** An offline-first PWA stores check-ins locally and synchronises idempotently when a link returns; a communication-blackout simulator demonstrates this. Behavioural wellness data is private by default with explicit, expiring, auditable sharing.

**Scientific honesty.** Demo data is synthetic and labelled. Missing data is never shown as normal. NASA HRP and OSDR resources provide context and a dataset registry. We do not claim clinical validity, diagnosis, or flight qualification.

**Technology.** React + TypeScript, FastAPI, PostgreSQL, NumPy/Pandas, PWA with IndexedDB, Docker, automated tests (unit, property, e2e, accessibility).

**Impact.** A transparent, privacy-conscious blueprint for self-monitoring tools that remain useful when communication with Earth cannot be guaranteed.

### 3.4 Feasibility statement `[UPDATE AFTER BUILD]`
Feasible as a software-only application using open-source tools and publicly accessible NASA resources; no custom hardware is required for the prototype. Where suitable astronaut measurements are unavailable, clearly labelled synthetic telemetry and manual entries demonstrate behaviour. Clinical validation, flight qualification, and integration with certified hardware are outside this prototype's scope and are documented as future work.

### 3.5 Future work
Phase-aware baselines (mission phase, circadian effects), wearable integration, validated clinical protocol library with flight-surgeon input, multi-crew specialist console, communication-delay simulation, verified space-weather overlays, formal security review and clinical evaluation.

---

## 4. Pitch deck — 12 slides with speaker notes

| # | Slide | Content | Speaker notes (≈ 20–30 s each) |
|---|---|---|---|
| 1 | **Title** | AstraPulse · Team Interstellar · tagline "Know the crew. Understand the signals. Protect the mission." · challenge name | Introduce team and the one-sentence pitch. |
| 2 | **The problem** | Official challenge hazards; image of Mars-transit crew; "Who notices the slow change?" | Astronauts carry responsibility for noticing changes in themselves; signals are scattered; Earth may be delayed. |
| 3 | **A story** | Sleep ↓ + fatigue ↑ + HR ↑ mini chart across 5 days | No single reading alarms; the *pattern* matters. |
| 4 | **Our solution** | Six modules icon row | One platform: collect, compare, explain, act, protect privacy, report. |
| 5 | **How it thinks** | Pipeline diagram: validate → baseline → deviation → trend → rules → explanation | Deterministic and testable; no black box; AI optional and never decides. |
| 6 | **Explainable alert** | Screenshot of alert with baseline/latest/why/follow-up/evidence link | Show exactly what triggered it and which readings back it. |
| 7 | **Trust by design** | Provenance badge, "Not recorded", simulated banner, audit | Every value has a source; missing is never normal. |
| 8 | **Privacy & wellness** | Private journal, consent grants, specialist view | Behavioural data is sensitive; the astronaut controls sharing. |
| 9 | **Offline-first** | Sync sequence diagram + blackout demo thumbnail | Works without a link; no loss, no duplicates (tested). |
| 10 | **NASA grounding** | HRP risk mapping table; OSDR registry; Artemis II individual-modelling context | Which hazards we cover, how, and where we are honest about limits. |
| 11 | **Live demo / video** | 90–120 s walkthrough | See §6 script. |
| 12 | **Limits, impact, next steps** | Limitations strip; future work; thank-you + repo/demo QR | Prototype with synthetic data; roadmap to validation; invite questions. |

**Design rules:** dark theme with tokens (#101820, #142B45, #38BDF8, #A3E635); one idea per slide; ≤ 25 words of body text; every image licensed or self-made (do **not** reuse scraped web images).

---

## 5. Pitch-day talk track (3 minutes, adjust to the official limit)

| Time | Beat |
|---|---|
| 0:00–0:20 | Hook: the five-day pattern no single reading reveals |
| 0:20–0:50 | Problem + challenge framing |
| 0:50–1:20 | Solution overview + differentiators (pick three) |
| 1:20–2:20 | Live or recorded demo (§6) |
| 2:20–2:45 | Science, honesty, limitations |
| 2:45–3:00 | Impact + close with tagline |

---

## 6. Demo video script (target ≈ 2–3 min — check official length limit)

Prepare: seeded `ARES-01`, logged in as **ASTRA-002**, browser at 1440×900, notifications off, screen recorder at 1080p, rehearsed three times. Record from the **deployed build** and keep a local fallback.

| # | Scene | Action | Narration |
|---|---|---|---|
| 1 | Dashboard | Show mission day, metric cards, simulated banner | "This is ASTRA-002 on a fictional Mars transit. Every value shows its source and time." |
| 2 | Not recorded | Point to a card with no mood entry | "Missing data stays missing — never shown as normal." |
| 3 | Check-in | Submit today's check-in (skip one field) | "A full check-in takes under a minute; every field is optional." |
| 4 | Alert appears | Open the new combined-pattern alert | "Sleep is down, fatigue up, resting heart rate drifting — the pattern across five days triggered this." |
| 5 | Explainability | Expand baseline vs latest, rule ID, ruleset version, evidence | "Nothing is hidden: rule, version, and the exact readings." |
| 6 | Action | Mark reviewed, add comment, record follow-up | "The astronaut records what they did; the timeline keeps it." |
| 7 | Offline | Toggle blackout → submit check-in → show "Pending sync" | "Deep-space links drop. The entry is safe on-device." |
| 8 | Reconnect | Toggle online → sync → status synced, no duplicates | "When the link returns it syncs once — no loss, no duplicates." |
| 9 | Privacy | Journal entry private → specialist view shows nothing → share → visible | "Wellness notes belong to the astronaut. Sharing is explicit and revocable." |
| 10 | Report | Generate PDF | "A mission report with provenance, ruleset version and disclaimer." |
| 11 | Evidence + limits | Evidence page; limitations strip | "Grounded in NASA research, honest about limits: simulated data, not a diagnosis." |
| 12 | Close | Logo + tagline | "AstraPulse: know the crew, understand the signals, protect the mission." |

---

## 7. Anticipated judge questions and answers

| Question | Suggested answer |
|---|---|
| Is this real astronaut data? | No. Demo crew data is synthetic and labelled. NASA datasets are used as context where fields allow; we inspect each dataset's variables and permissions first. |
| How do you know your thresholds are right? | They are demonstration parameters in a versioned ruleset, not clinical limits. The framework is built so flight-surgeon-validated protocols can replace them. |
| Why not just use machine learning? | With very small, unlabeled astronaut datasets, transparent statistics are more trustworthy. An Isolation Forest experiment is shown separately and never raises alerts. |
| What does the LLM do? | Optionally rephrases a deterministic result. It never decides, scores, or sees journal text. |
| How is this different from a fitness dashboard? | Personal baselines, persistence and combined-pattern logic, evidence-linked explanations, provenance, privacy grants, and offline sync correctness. |
| Can it detect bone loss or immune changes? | Not directly from daily check-ins. We track countermeasure adherence and accept optional lab entries, and we say so. |
| How does offline sync avoid duplicates? | Client-generated IDs plus server idempotency keys; observations are immutable; tested including mid-sync closure. |
| What about privacy? | Private by default, scoped expiring grants, audit logs, no health data to third parties, no health values in logs. |
| Could this work on a real spacecraft? | It is a prototype. Flight use would need hardware integration, security assurance, validation and regulatory approval. |
| What would you do next? | Phase-aware baselines, validated protocol library with clinicians, wearable integration, communication-delay simulation. |
| How did you test it? | Unit/property tests for analytics, API authz matrix, offline e2e, accessibility audits; golden scenarios for four crew profiles. |
| What happens when data is sparse? | Baseline states (`insufficient_data`, `baseline_forming`) suppress alerts above info and tell the user why. |

---

## 8. Claims audit (complete before submitting)

For each sentence in the deck/description, mark one: **Built & demonstrated**, **Designed (future work)**, **Cited fact**, or **Remove**.

| Claim | Status | Evidence / source |
|---|---|---|
| Personal baselines (median/MAD) | | `ANALYTICS_SPEC.md`, tests `ANA-01…` |
| Persistent and combined alerts | | tests `ANA-09…11`, demo scene 4 |
| Offline sync without duplicates | | tests `E2E-04…06` |
| Specialist cannot see private journal | | test `SAF-10`, `E2E-07` |
| PDF/CSV reports | | `API-14` |
| NASA OSDR dataset used | | dataset registry entry + inspected date |
| ML anomaly detection | | only if Phase 12.1 done and labelled experimental |
| LLM explanations | | only if Phase 12.2 done and validated |
| "Production-quality" wording | | Prefer "production-grade engineering practices in a prototype" |

---

## 9. Repository and README requirements

- Public GitHub repo `astrapulse-astronaut-health-monitoring` with an OSI-approved licence (e.g., MIT or Apache-2.0).
- README: pitch, screenshots/GIFs, architecture diagram, features, **limitations section (from SAFETY doc §8)**, quick start (≤ 5 commands), demo credentials (synthetic only), test commands, data/source attribution, team and acknowledgements.
- No secrets, no real personal data, no copyrighted images.
- `docs/` folder contains PRD, TECH_STACK, ANALYTICS_SPEC, DATA_DICTIONARY, API_SPEC, TEST_PLAN, SAFETY_AND_LIMITATIONS, ROADMAP.
- Release tag `v1.0-submission` on the exact commit used for the video.

---

## 10. Asset checklist

| Asset | Status |
|---|---|
| Logo and wordmark (own design) | ☐ |
| 8–10 clean screenshots (dark theme, synthetic data banner visible) | ☐ |
| Architecture + pipeline + sync diagrams (Mermaid export or SVG) | ☐ |
| Deck (PDF + source) | ☐ |
| Demo video (MP4, captions on) | ☐ |
| Deployed URL + fallback local instructions | ☐ |
| Dataset registry screenshot | ☐ |
| Team photo / bios (if requested) | ☐ |

---

## 11. Final submission checklist

1. ☐ Official wording of challenge and rules re-read; limits recorded here: ______________
2. ☐ All release gates in `TEST_PLAN.md` §9 pass.
3. ☐ Claims audit complete; deck and description match the build.
4. ☐ Demo video recorded from final build; plays on another device.
5. ☐ Deployed URL tested from a different network/device; fallback ready.
6. ☐ Repo public, licence added, secrets scan clean, tag created.
7. ☐ Submission form filled; every required field and link verified by a second teammate.
8. ☐ Confirmation saved (screenshot + email).
9. ☐ Team members registered and linked to the project.
10. ☐ Calendar reminder for December 2026 (nominee/finalist announcements) and January 2027 (global winners), per the FAQ — verify dates.

---

## 12. Presentation-day contingency
- Offline copy of deck (PDF) and video on a USB/phone.
- Local `docker compose up` stack seeded and tested.
- One teammate owns the clicker, one owns the demo, one owns Q&A.
- If live demo fails: switch to video within 10 seconds without apologising at length — continue the story.
