# AstraPulse — Safety, Ethics and Limitations

Version 1.0 · Applies to product copy, code, reports, the deck and the demo.

---

## 1. Statement of purpose
AstraPulse is a **research-informed decision-support prototype** built for the NASA Space Apps Challenge. It helps a user *notice and understand changes relative to their own history*. It is **not** a medical device, has **not** been clinically validated, and is **not** qualified for spacecraft use.

---

## 2. Safety principles
1. **No diagnosis.** The system describes statistical differences; it never names a condition as present.
2. **No treatment advice.** No medication names, doses, or procedures. Follow-up suggestions point to the astronaut's *mission protocol* and *medical support channels*.
3. **Transparent uncertainty.** Show sample size, baseline state, and data source; say when data is insufficient.
4. **Human authority.** Mission medical protocol and qualified clinicians override the software.
5. **Fail visible.** Missing data, sync failures, and engine errors are shown, never hidden or defaulted to "normal".
6. **Least data, most privacy.** Collect only what each feature needs; behavioural data private by default.
7. **Honest labelling.** Simulated data is always labelled; design choices are not presented as NASA or clinical standards.

---

## 3. Language guide

| Use | Avoid |
|---|---|
| "differs from your recent baseline" | "abnormal", "unhealthy" |
| "review suggested" | "warning: you are ill" |
| "sustained change over 5 days" | "you have <condition>" |
| "consider following your mission wellness protocol" | any medication, dose, or treatment |
| "not recorded" | "normal", "0" for missing |
| "statistical comparison with your own history" | "clinically significant", "risk of <disease>" |
| "demonstration parameters" | "medical thresholds" |

**Mandatory footers**
- Alerts/reports with simulated data: *"Decision-support prototype using simulated data. Not a medical diagnosis."*
- Real-data context (if any): *"Reference information from <source>. Not a personal medical assessment."*

**Mental-health wording:** supportive, plain, non-clinical. Never label a person (e.g., "depressed"). Always point to mission support channels rather than offering counselling. If a user writes distress-related content in a journal, the system does **not** analyse it automatically; the UI keeps a permanent link to mission support resources in the Wellness page.

---

## 4. AI safety (optional Explain layer)
- Deterministic explanation is always generated first and displayed.
- The LLM receives only the structured alert (no journal text, no identifiers) and may only rephrase.
- Output validation: denylist scan (diagnosis, medication, certainty claims), numeric consistency check (only provided numbers), length limit.
- On any validation failure or outage → show deterministic text only.
- The LLM never changes levels, creates alerts, suppresses alerts, or sees raw time series.
- Every AI-rephrased text is labelled "AI-assisted wording of the rule-based result".

---

## 5. Data ethics and privacy
- **Synthetic by default.** The demo contains no real people's data. Crew names are fictional; identifiers are pseudonymous (`ASTRA-001`).
- **Consent model.** Specialist access requires an explicit, scoped, expiring, revocable grant. Journal sharing is per entry.
- **Audit.** Cross-user reads, grants, exports and alert actions are logged (without health values).
- **No third-party leakage.** No health data or journal text to external analytics/AI services.
- **Real NASA data.** Use only public data, comply with each dataset's licence/terms, cite sources, and never present derived results as NASA findings.
- **Retention.** Demo data is disposable; any real deployment would require a retention and deletion policy.

---

## 6. Limitations (to state in README, deck and Q&A)

1. All astronaut telemetry in the demo is **simulated**; results show pipeline behaviour, not clinical accuracy.
2. The analytics are **statistical comparisons with personal history**; a deviation is not a diagnosis.
3. Thresholds and persistence rules are **demonstration parameters** chosen by the team.
4. No clinical validation, sensitivity/specificity, or regulatory evaluation has been performed.
5. Small personal samples limit baseline stability; robust statistics mitigate but do not eliminate this.
6. NASA research datasets may lack the continuous, daily measurements the dashboard displays; datasets are used as context where fields allow, not as live feeds.
7. Bone loss and immune changes **cannot be measured by daily self-report**; the app tracks countermeasure adherence and optional lab entries and says so.
8. Radiation values in the demo are simulated unless explicitly labelled as real public data.
9. Offline mode reduces dependence on connectivity but does not replace secure backup and verified synchronisation.
10. The prototype has not been security-audited by a third party.
11. Mission-phase, circadian and workload effects are not modelled.
12. The software does not replace professional medical judgement or emergency mission procedures.

---

## 7. Review checklist (use before every release)
- [ ] No diagnosis/treatment language anywhere (run denylist test `SAF-05`).
- [ ] Every alert/report has the footer and shows data-source mix.
- [ ] Missing data never displayed as normal.
- [ ] Simulated banner visible wherever simulated data appears.
- [ ] Private journal inaccessible to specialists without a share.
- [ ] README, deck and abstract limitations section matches §6.
- [ ] Any real NASA data is cited with accession/URL and access date.

---

## 8. Paste-ready disclosure texts

**README / site footer**
> AstraPulse is a research-informed decision-support prototype developed for the NASA Space Apps Challenge. It uses clearly labelled simulated data, is not clinically validated, is not a medical device, and does not provide medical diagnosis or treatment advice. Always follow mission medical protocols and consult qualified professionals.

**Deck limitations slide (short)**
> Simulated data · Statistical (not diagnostic) · Demonstration parameters · Not clinically validated · Software-only prototype · Offline ≠ secure backup

**In-app info tooltip on alerts**
> This alert compares recent readings with your own earlier readings. It does not diagnose anything. Review the evidence and follow your mission protocol.
