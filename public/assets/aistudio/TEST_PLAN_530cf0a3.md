# AstraPulse — Test Plan

Version 1.0 · Verifies [PRD.md](PRD.md) requirements and the prime directives in [CLAUDE.md](../CLAUDE.md)

---

## 1. Strategy

| Level | Tooling | Scope | Target |
|---|---|---|---|
| Unit — analytics | pytest, Hypothesis | Baseline, deviation, trend, rules, explanations | ≥ 90 % line coverage |
| Unit — backend | pytest | Services, validation, repositories | ≥ 80 % overall backend |
| API / integration | pytest + httpx + Postgres | Routers, authz, idempotency, transactions | Every endpoint |
| Frontend unit/component | Vitest + Testing Library | Components, hooks, form validation | Critical components |
| End-to-end | Playwright | Full user flows incl. offline | All demo-script steps |
| Accessibility | axe-core (Playwright) | Each page | 0 serious/critical violations |
| Security | pip-audit, npm audit, authz matrix, header checks | Whole app | No high/critical findings |
| Performance | Lighthouse CI, simple API timing | Dashboard, API reads | Budgets in §8 |

**Test data:** deterministic synthetic scenarios (ARES-01, fixed seed) shared by seed script and tests. Tests never use real personal data.

---

## 2. Safety / prime-directive tests (`SAF-*`)

| ID | Directive | Test | Expected |
|---|---|---|---|
| SAF-01 | Provenance | Insert observation without `data_source` | DB/API rejects |
| SAF-02 | Missing ≠ zero | Submit check-in with `mood: null` | Stored `status=missing`, value NULL; dashboard shows "Not recorded" |
| SAF-03 | Missing ≠ zero | Compute baseline with `None`s interspersed | Baseline equals baseline without them |
| SAF-04 | Zero handling | Submit `resting_hr_bpm = 0` | Rejected as implausible |
| SAF-05 | No diagnosis | Scan all explanation templates, protocol library, UI strings against denylist (diagnos*, "you have", medication/dose terms, condition names as findings) | No matches |
| SAF-06 | No hard-coded thresholds | Static scan of `app/` (excluding `rulesets/`, `metric_definitions` seed) for threshold-like constants in rules | None found |
| SAF-07 | Explainability | Every generated alert row | Has rule_id, ruleset_version, explanation JSON, ≥ 1 evidence row |
| SAF-08 | Deterministic core | `evaluate()` twice with same inputs | Identical output |
| SAF-09 | Simulated label | Any response containing simulated data | `data_sources` includes `simulated`; UI banner visible (e2e) |
| SAF-10 | Privacy | Specialist requests private journal via every route | 403/404; zero content in response |
| SAF-11 | Privacy | Log capture during check-in and journal create | No health values or journal text in logs |
| SAF-12 | Append-only | Attempt UPDATE/DELETE on `observations` as app role | Fails |
| SAF-13 | LLM isolation (if enabled) | Explain input payload | Contains no journal text or identifiers; output passes denylist; fallback used on failure |

---

## 3. Analytics tests (`ANA-*`)

| ID | Test | Expected |
|---|---|---|
| ANA-01 | Worked example `[72,74,75,73,76,74,75]` | median 74, MAD 1, floor applied (s = 2.0), z(85) = 5.5 |
| ANA-02 | MAD = 0 (all identical) | IQR fallback or floor; no division by zero |
| ANA-03 | IQR = 0 and MAD = 0 | `scale_method = floor` |
| ANA-04 | Fewer than `min_observations` | `insufficient_data`; no alert above `info` |
| ANA-05 | Between min and target | `baseline_forming` |
| ANA-06 | Direction `low` | Negative z yields positive adverse deviation |
| ANA-07 | Direction `both` | Absolute value used |
| ANA-08 | Theil–Sen robustness | One outlier does not flip slope sign on a monotone series |
| ANA-09 | Persistence | 3 of 5 days above `z_watch` → watch; 2 of 5 → none |
| ANA-10 | Single spike | Only `info` (`R-SINGLE`) |
| ANA-11 | Combined pattern | 3 metrics, ≥ 2 categories at watch persistence → `R-COMBINED` |
| ANA-12 | Data gap | No data 3+ days after ready → `R-DATA-GAP` info |
| ANA-13 | Auto-resolve | Rule false for `resolve_after_days` → resolved_auto |
| ANA-14 | Duplicate observations | Collapsed before statistics |
| ANA-15 | Amendment chain | Latest valid amendment used |
| ANA-16 | Timezones | Observations near midnight UTC bucket into correct day |
| ANA-17 | Property: constant shift | median shifts, scale unchanged |
| ANA-18 | Property: order permutation | Baseline unchanged |
| ANA-19 | Property: scale > 0 | Always |
| ANA-20 | Golden: ASTRA-001 | No `watch`/`review_required` on day 24 |
| ANA-21 | Golden: ASTRA-002 | `R-COMBINED` review_required by day 24 |
| ANA-22 | Golden: ASTRA-003 | Activity `R-PERSIST-WATCH` |
| ANA-23 | Golden: ASTRA-004 | Wellness persistence alert per ruleset |
| ANA-24 | Idempotent alerts | Running analytics 3× → exactly one alert per `(crew, rule, window_end)` |

---

## 4. API / backend tests (`API-*`)

| ID | Test | Expected |
|---|---|---|
| API-01 | Unauthenticated access to each protected route | 401 |
| API-02 | Astronaut accesses another astronaut's data | 403/404 |
| API-03 | Specialist without grant requests crew data | 403 |
| API-04 | Specialist with expired/revoked grant | 403 |
| API-05 | Idempotent replay of `POST /checkins` | Same response; one row |
| API-06 | Implausible value | 422 with field-level error |
| API-07 | Future timestamp beyond tolerance | 422 |
| API-08 | Amend observation | New row with `amends_id`; original unchanged |
| API-09 | Import CSV with mixed good/bad rows | Report lists rejected rows; good rows stored with `imported_file` |
| API-10 | Login rate limit | 429 after threshold; back-off enforced |
| API-11 | Refresh rotation | Old refresh token rejected after use |
| API-12 | Audit | Cross-user read creates audit row without health values |
| API-13 | Sync batch with duplicate + invalid item | Per-item results; valid items stored |
| API-14 | Report generation | PDF contains disclaimer, ruleset version, source mix; excludes private journal |
| API-15 | Error format | RFC 7807 body; no stack traces |
| API-16 | Migrations | `upgrade head` then `downgrade base` then `upgrade head` succeeds |

---

## 5. Frontend tests (`FE-*`)

| ID | Test | Expected |
|---|---|---|
| FE-01 | `MetricCard` with null value | "Not recorded", grey style, last-known time |
| FE-02 | `MetricCard` source badge | Shows data source and timestamp |
| FE-03 | Check-in form with all fields blank | Allowed; submits nulls |
| FE-04 | Check-in form invalid number | Inline accessible error |
| FE-05 | `AlertCard` | Shows what/why/baseline/latest/follow-up/evidence link/disclaimer |
| FE-06 | Level not colour-only | Icon + text present |
| FE-07 | Chart data-table alternative | Present and matches series |
| FE-08 | `SyncStatus` states | online / offline / pending N / error |

---

## 6. End-to-end scenarios (`E2E-*`) — mirror the demo script

| ID | Flow | Expected |
|---|---|---|
| E2E-01 | Login → dashboard (ASTRA-002) | Simulated banner; alert panel shows combined-pattern alert |
| E2E-02 | Open alert → evidence → review with comment → log follow-up check-in | Action timeline updated |
| E2E-03 | Submit normal check-in as ASTRA-001 | Dashboard updates; no alert |
| E2E-04 | Go offline → submit check-in | "Saved locally — pending sync"; appears in list as pending |
| E2E-05 | Reconnect | Auto-sync; status → synced; no duplicate |
| E2E-06 | Close tab mid-sync, reopen | Remaining items sync; no loss/duplication |
| E2E-07 | Journal private → specialist login | Entry invisible; share → visible; revoke → invisible |
| E2E-08 | Generate PDF + CSV report | Files download; contents verified |
| E2E-09 | Keyboard-only navigation of check-in and alert review | All actions reachable |
| E2E-10 | Mobile viewport (390 × 844) | No horizontal scroll; check-in usable |

---

## 7. Security tests (`SEC-*`)

| ID | Check |
|---|---|
| SEC-01 | Security headers present (CSP, nosniff, referrer policy) |
| SEC-02 | CORS only allows configured origins |
| SEC-03 | No secrets in repo (secret scanner in CI) |
| SEC-04 | `pip-audit` / `npm audit` — no high/critical |
| SEC-05 | SQL injection attempts via filters return validation errors, no leakage |
| SEC-06 | Oversized / malformed import files rejected safely |
| SEC-07 | Cookies: `HttpOnly`, `Secure`, `SameSite=Strict` for refresh token |
| SEC-08 | Passwords stored with Argon2id parameters meeting policy |

---

## 8. Performance and accessibility budgets

| Item | Budget |
|---|---|
| Dashboard LCP (cached, laptop) | < 2.5 s |
| API `GET /analytics/summary` p95 (demo data) | < 300 ms |
| Check-in submit round trip | < 500 ms |
| JS bundle (initial) | < 300 KB gzip (lazy-load charts and heavy routes) |
| Lighthouse accessibility | ≥ 95 |
| axe violations | 0 serious/critical |

---

## 9. Release gates (all must pass before submission)

1. CI green on `main`: lint, type-check, unit, integration, e2e.
2. All `SAF-*` tests pass.
3. Coverage gates met (analytics ≥ 90 %, backend ≥ 80 %).
4. Authz matrix tests pass for every route.
5. Offline suite (`E2E-04…06`) passes 10 consecutive runs.
6. Deployed demo passes smoke test: login, dashboard, check-in, alert, report.
7. Secret scan and dependency audit clean.
8. Claims audit completed ([SUBMISSION.md](SUBMISSION.md) §10).
9. Demo video recorded from the final build.

---

## 10. Defect handling
Severity: **S1** data loss, privacy breach, or unsafe wording → fix before anything else. **S2** wrong analytics result or broken core flow. **S3** UI defects. **S4** polish. Every S1/S2 fix ships with a regression test.
