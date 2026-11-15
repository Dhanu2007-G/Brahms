# AstraPulse — Architectural & Specification Decisions (`DECISIONS.md`)

**Product:** AstraPulse — Astronaut Health Intelligence & Mission Decision Support  
**Team:** **Zenitsu**  
**Event:** NASA Space Apps Challenge 2026  

---

## 1. Resolution of the Five Known Specification Conflicts

### Conflict A: Team Name (`Interstellar` vs `Zenitsu`)
- **Conflict:** Older Markdown documents (`PRD.md`, `CLAUDE.md`, `SUBMISSION.md`, UI/UX Guide header) reference "Team Interstellar", whereas the authoritative Master Prompt specifies **Team Zenitsu**.
- **Resolution:** **Team Zenitsu** overrides "Interstellar" across all UI screens, headers, footers, reports, seed data, documentation, and submission materials.

### Conflict B: Home Screen Architecture (Card Grid vs Crew Core)
- **Conflict:** Version 1 of `PRD.md` (§7.2) and `TECH_STACK.md` (§6) described a traditional grid of metric cards on the home dashboard, whereas `AstraPulse Mission Deck — Complete UI/UX Design Guide v2.0` explicitly replaces the card-grid home screen with the **Crew Core** (`/`).
- **Resolution:** The home route (`/`) implements the **Crew Core** (living front/back SVG Body Twin with 10 hotspots, 5-node orbiting Hazard Ring, 3 concentric Vitality Rings with confidence encoding, Now/Next strip, Compact Alert stack, Ground mini panel, and bottom Time Conductor scrubber). Individual `MetricCard` components are preserved inside the **System Drawer** (`/system/:id` — Now tab), Vitality Ring breakdowns, and **Insights** (`/insights`).

### Conflict C: Safety Language & Guidance Stance (Blanket Ban vs Three Guidance Tiers)
- **Conflict:** Earlier versions of `SAFETY_AND_LIMITATIONS.md`, `PRD.md`, and `CLAUDE.md` banned all treatment or countermeasure guidance. UI/UX Guide v2.0 §0.2 revises this to answer the NASA challenge brief ("provides guidance on treatments and health improvements") using **Three Guidance Tiers**:
  - **Tier 1 — Self-care and countermeasures:** Non-drug, evidence-linked actions from a clearly labelled demonstration protocol library (e.g., resistive exercise session, fixed sleep window, hydration, breathing guide, rest and re-measure).
  - **Tier 2 — Crew-medical checklist:** Measurement and verification steps framed as *"per your mission protocol"* (e.g., seated BP re-check 1 minute apart).
  - **Tier 3 — Escalation:** Asynchronous communication workflow with the flight surgeon or crew medical officer via Ground Link, including one-way light-time delay and attached evidence bundles.
- **Permanently Prohibited (Enforced by Automated Denylist Tests):**
  - Definitive medical diagnosis or claiming *"you have <condition>"*
  - Medication names, drug recommendations, or dosages
  - Emergency clinical instructions beyond *"follow your approved mission emergency procedures"*
  - Unverified AI-generated medical advice
  - Presenting demonstration protocols as flight-surgeon-approved
- **Mandatory Protocol Label:** Every guidance item displays: *"Demonstration content — requires replacement/approval by qualified flight medical personnel before real use."* Factors are presented as **Possible contributors**, never diagnoses.

### Conflict D: Analytics Ruleset Version & Thresholds (`demo_v1` vs `1.0.0-demo`)
- **Conflict:** `ANALYTICS_SPEC.md` §10 defines `demo_v1` (`z_watch: 2.0`, `z_review: 3.0`, combined = 3 metrics across 2 categories), whereas `AstraPulse Part 2.pdf` §6.4–6.5 defines `ruleset_version: "1.0.0-demo"` with single-reading thresholds (`noted: 2.5`, `review: 4.0`), persistence rules (`windowDays: 5`, Watch = `z >= 2.0` on 3 of 5 days; Review = `z >= 2.0` on 4 of 5 days OR `z >= 3.0` on 3 of 5 days with adverse trend), sleep override (`windowDays: 7`, `low_only`), combined pattern (2+ co-occurring metrics at ≥ Noted + persistence on ≥ 1), and data-gap rules (Noted at 2 days, Watch at 3 days).
- **Resolution:** We adopt the comprehensive **Part 2 v1.0.0-demo YAML** (`ruleset_version: "1.0.0-demo"`) loaded from `src/analytics/ruleset_v1_0_0_demo.yaml` (and mirrored for backend routes) while supporting both intra-region and cross-system combined patterns so that **ASTRA-002** (sleep ↓ + fatigue ↑ + resting HR ↑) deterministically triggers `R-COMBINED` (`review_required` / `Review suggested`), **ASTRA-001** triggers no watch/review alerts, **ASTRA-003** triggers `R-PERSIST-WATCH` on activity/countermeasures, and **ASTRA-004** triggers wellness persistence (`R-PERSIST-REVIEW` / `R-PERSIST-WATCH`). Every alert stamps `ruleset_version: "1.0.0-demo"`.

### Conflict E: NASA Data Availability & Runtime Stack Adaptation
- **Conflict:** Some NASA OSDR physiological datasets are controlled-access, and the AI Studio container runtime runs Node.js/TypeScript (`Express + Vite` on port 3000) with provisioned **Firebase Firestore + Firebase Auth** (after Cloud SQL eligibility returned `NO_VALID_PROJECT` in this sandbox environment).
- **Resolution:**
  1. **NASA Data Honesty:** Publicly verifiable NASA HRP risk references and ISS RadLab environmental radiation reference series are included with explicit citations, accession numbers, and access dates in the Evidence Library and Dataset Registry. Controlled human physiological datasets are marked `"access_level": "controlled"` / `"used_in_app": false` with honest limitations, and never fabricated.
  2. **Runtime Architecture Disclosure:** In the AI Studio container environment, the full-stack application runs an Express `/api/v1/*` backend (`server.ts`) paired with **Firebase Firestore & Firebase Authentication** (`firebase-applet-config.json` + hardened `firestore.rules`) and **Dexie / IndexedDB** on the client, plus a pure, zero-I/O deterministic analytics engine (`src/analytics/engine.ts`) that implements the exact median/MAD/IQR/floor baseline, modified z-score, Theil–Sen slope, and YAML-driven rule evaluation specified in `ANALYTICS_SPEC.md` and `AstraPulse Part 2.pdf`.
