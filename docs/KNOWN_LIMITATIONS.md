# AstraPulse — Known Limitations & Scope Boundaries (`KNOWN_LIMITATIONS.md`)

**Product:** AstraPulse — Astronaut Health Intelligence & Mission Decision Support  
**Team:** Zenitsu · **Event:** NASA Space Apps Challenge 2026

1. **Simulated Telemetry by Default:** All astronaut telemetry for crew members `ASTRA-001` through `ASTRA-004` on mission `ARES-01` is deterministically generated synthetic data (`data_source = simulated`) and is always accompanied by the `SIMULATED` banner and provenance badges.
2. **Statistical Decision Support, Not Medical Diagnosis:** The Health Intelligence Engine computes personal median/MAD baselines, modified z-scores, and Theil–Sen slopes relative to each astronaut's own history. A statistical deviation or alert is never a clinical diagnosis.
3. **Demonstration Parameters Only:** Plausibility bounds and ruleset parameters (`ruleset_version: "1.0.0-demo"`) are demonstration parameters chosen to exercise the analytics pipeline and must be replaced by flight-surgeon-approved clinical protocols before any operational use.
4. **Indirect Tracking of Bone Loss & Immune Status:** Daily self-report cannot directly measure bone mineral density (DXA) or cellular immune alterations. AstraPulse tracks resistive countermeasure exercise adherence (`resistive_min`) and optional lab/imaging imports with provenance, and explicitly states this distinction in the UI.
5. **NASA Dataset Access Boundaries:** Public NASA Human Research Program (HRP) risk references and ISS RadLab environmental radiation reference series are cited and linked with access dates. Controlled-access human physiological studies in NASA OSDR require formal DUA/IRB approval and are documented as `access_level: controlled` in the Dataset Registry rather than fabricated.
6. **Experimental Camera Pulse & Microphone Tools:** Optical fingertip pulse estimation and ambient cabin noise sampling in the Measure Lab are marked `Experimental` / `Approximate`, enforce a signal-quality confidence gate (`quality >= 0.4`), and never auto-save without explicit astronaut confirmation.
7. **Container Runtime Architecture:** In the AI Studio container environment, the full-stack application runs an Express `/api/v1` server (`server.ts`) paired with Firebase Authentication, Cloud Firestore (`firestore.rules`), and client-side Dexie/IndexedDB offline storage.
