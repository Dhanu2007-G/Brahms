# AstraPulse — Health Intelligence Engine Specification

Version 1.0 · Implements PRD §7.4 (ENG-01 … ENG-11)

> **All thresholds in this document are demonstration parameters for a prototype. They are not clinical limits and are not validated for medical use.**

---

## 1. Design goals
1. Personal, robust, explainable — no black boxes.
2. Pure and deterministic: `evaluate(observations, ruleset, as_of) → result`.
3. Safe with sparse, noisy, or missing data.
4. Every output traceable to input observations and a ruleset version.

---

## 2. Pipeline

```
raw observations
   → [1] validate & normalise
   → [2] select baseline window
   → [3] personal baseline (median + robust scale)
   → [4] deviation (modified z-score, direction-aware)
   → [5] trend (Theil–Sen slope, rolling median)
   → [6] persistence & rules (single, persistent, combined)
   → [7] explanation + evidence
   → EvaluationResult
```

---

## 3. Stage 1 — Validation and normalisation

| Check | Behaviour |
|---|---|
| Missing value (`NULL`) | Excluded from statistics; reported in completeness. **Never imputed.** |
| Zero vs missing | Zero is a real value *only* where plausible for the metric (e.g., exercise = 0); for HR/SpO₂/temp, 0 is rejected as implausible. |
| Plausibility bounds | Reject values outside bounds (table below). These are **data-entry sanity bounds**, not clinical thresholds. |
| Duplicates | Same `(crew_id, metric_code, observed_at, value, source)` → keep one. |
| Timestamps | UTC; reject future timestamps beyond tolerance (default 5 min). |
| Units | Convert to canonical units (°F→°C, kPa→mmHg if imported). Preserve raw value and raw unit. |
| Amendments | Use the latest non-rejected amendment in the chain; originals retained. |

**Plausibility bounds (editable in `metric_definitions`)**
| Metric code | Unit | Min | Max |
|---|---|---|---|
| `resting_hr_bpm` | bpm | 20 | 250 |
| `bp_systolic_mmhg` | mmHg | 50 | 260 |
| `bp_diastolic_mmhg` | mmHg | 30 | 160 |
| `spo2_pct` | % | 50 | 100 |
| `body_temp_c` | °C | 30 | 45 |
| `respiratory_rate_bpm` | breaths/min | 4 | 60 |
| `sleep_hours` | h | 0 | 24 |
| `sleep_quality` | 1–5 | 1 | 5 |
| `mood` | 1–5 (5 = best) | 1 | 5 |
| `fatigue` | 1–5 (5 = worst) | 1 | 5 |
| `stress` | 1–5 (5 = worst) | 1 | 5 |
| `exercise_minutes` | min | 0 | 600 |
| `resistive_exercise_minutes` | min | 0 | 600 |
| `radiation_dose_rate_usv_h` | µSv/h | 0 | 10000 |

Rejected values are stored with `status = rejected` and a reason; they never reach statistics.

---

## 4. Stage 2–3 — Personal baseline

**Window:** observations with `observed_at` in `(as_of − window_days, as_of − exclude_recent_days]`.
Defaults: `window_days = 14`, `min_observations = 7`, `exclude_recent_days = 0` (configurable; excluding the most recent days prevents a developing trend from contaminating its own reference).

**Median baseline**

$$B = \operatorname{median}(x_1,\dots,x_n)$$

**Robust scale** (σ-equivalent):

$$\operatorname{MAD} = \operatorname{median}(|x_i - B|), \qquad s = \frac{\operatorname{MAD}}{0.6745}$$

Fallback chain when MAD = 0 (many identical values):
1. `s = IQR / 1.349` if IQR > 0
2. else `s = scale_floor` (per-metric, from ruleset)

Always apply `s = max(s, scale_floor)` so tiny natural variability cannot produce absurd z-scores.

**Baseline states**
| State | Condition | UI text |
|---|---|---|
| `insufficient_data` | fewer than `min_observations` valid values | "Not enough history to establish a personal baseline yet." |
| `baseline_forming` | `min_observations` ≤ n < `target_observations` (default 10) | "Baseline is still forming (n of N)." |
| `ready` | n ≥ `target_observations` | — |

No alerts of level `watch` or higher are produced when the baseline state is `insufficient_data`.

---

## 5. Stage 4 — Deviation

**Modified z-score**

$$Z_r = \frac{0.6745\,(x - B)}{\operatorname{MAD}} = \frac{x - B}{s}$$

**Direction awareness.** Each metric has `direction` ∈ {`high`, `low`, `both`}. Define the *adverse deviation*:
- `high`: $d = Z_r$
- `low`: $d = -Z_r$
- `both`: $d = |Z_r|$

| Metric | Direction | Rationale (design choice) |
|---|---|---|
| resting_hr_bpm | both | Rising or falling away from personal norm is informative |
| bp_systolic / diastolic | both | |
| spo2_pct | low | Lower is the concern |
| body_temp_c | both | |
| respiratory_rate_bpm | both | |
| sleep_hours | low | Shortening sleep |
| sleep_quality | low | |
| mood | low | |
| fatigue | high | |
| stress | high | |
| exercise_minutes | low | Drop in activity |
| resistive_exercise_minutes | low | Countermeasure adherence drop |
| radiation_dose_rate_usv_h | high | Context, not personal-physiology |

---

## 6. Stage 5 — Trend

For the last `trend_window` days (default 7) with at least `trend_min_points` (default 5) valid values:

**Theil–Sen slope** (robust to outliers):

$$\hat{m} = \operatorname{median}\left\{ \frac{y_j - y_i}{t_j - t_i} : i<j \right\}$$

Report slope in unit/day, plus the **net change** over the window and the **rolling median** (3-point) series for charts.
Trend direction is `adverse` if the sign of the slope matches the adverse direction and `|slope × window_days| ≥ trend_min_change` (per-metric, from ruleset).

---

## 7. Stage 6 — Rules

All rule parameters come from the ruleset file (see §10).

| Rule ID | Level | Condition |
|---|---|---|
| `R-SINGLE` | `info` | One reading with adverse deviation $d \ge z_{watch}$. Message: "Single unusual reading noted." No action required. |
| `R-PERSIST-WATCH` | `watch` | Adverse deviation $d \ge z_{watch}$ on ≥ `m` of the last `n` days (default 3 of 5). |
| `R-PERSIST-REVIEW` | `review_required` | Adverse deviation $d \ge z_{review}$ on ≥ `m` of the last `n` days **and** trend is adverse. |
| `R-COMBINED` | `review_required` | ≥ `k` distinct metrics (default 3) simultaneously at `watch` persistence, across ≥ 2 categories (e.g., sleep + wellness + cardiovascular). |
| `R-DATA-GAP` | `info` | No valid observation for a metric for ≥ `gap_days` (default 3) after baseline was ready. Message: "No recent data for X." |

**Precedence:** highest level wins per metric; combined alerts reference the member metrics' evidence. Only one open alert per `(crew_id, rule_id, window_end)`.

**Cool-down / de-escalation:** an open alert auto-resolves to "condition no longer met" when the rule has been false for `resolve_after_days` (default 2), preserving history.

---

## 8. Stage 7 — Explanation

Deterministic templates fill from structured fields. Example for `R-COMBINED`:

> **Review suggested — combined change from your recent baseline**
> Over the last 5 days: sleep duration is lower than your baseline (7.5 h → 5.2 h), fatigue is higher (2 → 4), and resting heart rate is higher (74 → 83 bpm). This is a statistical comparison with your own history, not a diagnosis.
> **Suggested follow-up:** review your recent sleep schedule, record how you feel, and consider following your mission wellness protocol.
> *Rule R-COMBINED · ruleset demo_v1 · Simulated data · Evidence: 15 observations*

Every explanation includes: metric(s), baseline value, latest value, deviation, persistence (m of n), rule ID, ruleset version, data-source mix, evidence IDs, and the non-diagnostic footer.

---

## 9. Output contract

```python
@dataclass(frozen=True)
class MetricEvaluation:
    metric_code: str
    baseline: Baseline | None
    baseline_state: Literal["insufficient_data", "baseline_forming", "ready"]
    latest_value: float | None
    latest_observed_at: datetime | None
    adverse_deviation: float | None
    trend: Trend | None
    level: Literal["none", "info", "watch", "review_required"]
    triggered_rules: tuple[str, ...]
    evidence_observation_ids: tuple[str, ...]

@dataclass(frozen=True)
class EvaluationResult:
    as_of: datetime
    ruleset_version: str
    metrics: tuple[MetricEvaluation, ...]
    alerts: tuple[AlertCandidate, ...]
    completeness: dict[str, float]    # fraction of expected days with data
```

---

## 10. Ruleset file (`rulesets/demo_v1.yaml`)

```yaml
ruleset: demo_v1
description: >
  DEMONSTRATION PARAMETERS ONLY. Not clinical thresholds. Chosen to exercise
  the analytics pipeline on synthetic data.
baseline:
  window_days: 14
  min_observations: 7
  target_observations: 10
  exclude_recent_days: 0
trend:
  window_days: 7
  min_points: 5
persistence:
  window_days: 5
  min_days: 3
levels:
  z_watch: 2.0
  z_review: 3.0
combined:
  min_metrics: 3
  min_categories: 2
gap_days: 3
resolve_after_days: 2
metrics:
  resting_hr_bpm:            {category: cardiovascular, direction: both, scale_floor: 2.0, trend_min_change: 5.0}
  bp_systolic_mmhg:          {category: cardiovascular, direction: both, scale_floor: 4.0, trend_min_change: 10.0}
  bp_diastolic_mmhg:         {category: cardiovascular, direction: both, scale_floor: 3.0, trend_min_change: 8.0}
  spo2_pct:                  {category: cardiovascular, direction: low,  scale_floor: 1.0, trend_min_change: 2.0}
  body_temp_c:               {category: physiology,     direction: both, scale_floor: 0.2, trend_min_change: 0.5}
  sleep_hours:               {category: sleep,          direction: low,  scale_floor: 0.5, trend_min_change: 1.0}
  sleep_quality:             {category: sleep,          direction: low,  scale_floor: 0.5, trend_min_change: 1.0}
  mood:                      {category: wellness,       direction: low,  scale_floor: 0.5, trend_min_change: 1.0}
  fatigue:                   {category: wellness,       direction: high, scale_floor: 0.5, trend_min_change: 1.0}
  stress:                    {category: wellness,       direction: high, scale_floor: 0.5, trend_min_change: 1.0}
  exercise_minutes:          {category: activity,       direction: low,  scale_floor: 10.0, trend_min_change: 20.0}
  resistive_exercise_minutes: {category: activity,      direction: low,  scale_floor: 10.0, trend_min_change: 20.0}
  radiation_dose_rate_usv_h: {category: environment,    direction: high, scale_floor: 0.5, trend_min_change: 1.0, personal: false}
protocol_library: protocols/demo_protocols.yaml   # placeholder, labelled text
```

Changing any value requires a **new ruleset version** (`demo_v2.yaml`); old alerts keep their original version string.

---

## 11. Reference implementation (core functions)

```python
"""app/analytics/baseline.py and deviation.py — reference implementation."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Literal, Sequence

import numpy as np

MAD_TO_SIGMA = 0.6745          # z = 0.6745 * (x - B) / MAD
IQR_TO_SIGMA = 1.349


@dataclass(frozen=True)
class Baseline:
    median: float
    scale: float
    n: int
    scale_method: Literal["mad", "iqr", "floor"]


def compute_baseline(
    values: Iterable[float | None],
    *,
    min_observations: int,
    scale_floor: float,
) -> Baseline | None:
    """Median baseline with robust scale. Returns None if too little data.

    Missing values (None/NaN) are dropped, never imputed.
    """
    x = np.array(
        [v for v in values if v is not None and np.isfinite(v)], dtype=float
    )
    if x.size < min_observations:
        return None

    med = float(np.median(x))
    mad = float(np.median(np.abs(x - med)))

    if mad > 0:
        scale, method = mad / MAD_TO_SIGMA, "mad"
    else:
        q25, q75 = np.percentile(x, [25, 75])
        iqr = float(q75 - q25)
        if iqr > 0:
            scale, method = iqr / IQR_TO_SIGMA, "iqr"
        else:
            scale, method = scale_floor, "floor"

    if scale < scale_floor:
        scale, method = scale_floor, "floor"
    return Baseline(median=med, scale=scale, n=int(x.size), scale_method=method)


def robust_z(value: float, baseline: Baseline) -> float:
    """Modified z-score: (x - B) / s, equivalent to 0.6745*(x-B)/MAD."""
    return (value - baseline.median) / baseline.scale


def adverse_deviation(z: float, direction: Literal["high", "low", "both"]) -> float:
    if direction == "high":
        return z
    if direction == "low":
        return -z
    return abs(z)


def theil_sen_slope(y: Sequence[float]) -> float | None:
    """Median of pairwise slopes for equally spaced daily values (unit/day)."""
    arr = np.asarray(y, dtype=float)
    n = arr.size
    if n < 3:
        return None
    i, j = np.triu_indices(n, k=1)
    return float(np.median((arr[j] - arr[i]) / (j - i)))


def persistence_met(
    deviations: Sequence[float | None], *, threshold: float, min_days: int
) -> bool:
    """True if at least `min_days` of the supplied recent daily deviations
    meet or exceed `threshold`. Missing days (None) do not count."""
    return sum(1 for d in deviations if d is not None and d >= threshold) >= min_days
```

**Worked example (hand-checkable test fixture)**
Resting HR history `[72, 74, 75, 73, 76, 74, 75]`:
- Sorted: `72, 73, 74, 74, 75, 75, 76` → median `B = 74`.
- Absolute deviations: `[2, 0, 1, 1, 2, 0, 1]` → sorted `0, 0, 1, 1, 1, 2, 2` → `MAD = 1`.
- Raw scale `s = 1 / 0.6745 ≈ 1.4826`, which is **below** the `resting_hr_bpm` floor of `2.0`, so the floor applies: `s = 2.0`, `scale_method = "floor"`.
- A reading of `85` gives `z = (85 − 74) / 2.0 = 5.5`. Without the floor it would be `≈ 7.4`.

Tests must cover both the floor-applied case (above) and a case with larger natural variability where `scale_method = "mad"`.

---

## 12. Invariants (property tests)
1. Adding a constant `c` to all values shifts the median by `c` and leaves `scale` unchanged.
2. Multiplying all values by `a > 0` multiplies `scale` by `a` (when above the floor).
3. `scale > 0` always; `robust_z` never returns NaN/inf for finite input.
4. Permuting input order never changes the baseline.
5. Adding `None` values never changes the baseline.
6. `evaluate` called twice with identical inputs returns identical results.
7. With fewer than `min_observations` values, no alert above `info` is produced.

---

## 13. Synthetic scenario definitions (for seed + golden tests)

| Crew | Days 1–14 (baseline) | Days 15–24 behaviour | Expected result at day 24 |
|---|---|---|---|
| ASTRA-001 | Stable with small noise | Same | No `watch`/`review_required` |
| ASTRA-002 | Sleep ≈ 7.5 h, HR ≈ 74, fatigue ≈ 2 | Sleep declines ~0.3 h/day, fatigue +, HR + | `R-COMBINED` review_required |
| ASTRA-003 | Exercise ≈ 60 min, resistive ≈ 30 | Declines to ≈ 15 / 5 | `R-PERSIST-WATCH` (activity) |
| ASTRA-004 | Mood ≈ 4, stress ≈ 2 | Mood ↓, stress ↑ | `R-PERSIST-WATCH` → `review_required` per ruleset |

Noise is generated with a fixed seed; scenarios live in `scripts/scenarios.py` and are shared by seed and tests.

---

## 14. Optional experiment — Isolation Forest (P3)
- Run on a standardised feature matrix of recent days per astronaut.
- Output is an *experimental anomaly score*, displayed in a separate "Experimental" panel with caveats (tiny samples; no labelled ground truth).
- It never creates alerts, never changes levels, and is excluded from reports unless explicitly enabled.

---

## 15. Known limitations
- Small personal samples; robust statistics reduce but do not remove instability.
- Population-level reference ranges are not used; context from NASA literature is displayed as evidence only.
- Simulated data cannot demonstrate clinical sensitivity or specificity.
- Seasonal/circadian and mission-phase effects are not modelled (future work: phase-aware baselines).
