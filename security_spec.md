# AstraPulse — Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny**: All unmapped paths are denied (`allow read, write: if false`).
2. **Verified Identity**: Write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Owner Isolation**: Every `checkins`, `observations`, `journals`, `grants`, and `messages` document must have `ownerUid == request.auth.uid` on creation.
4. **Append-Only Observations**: `observations` cannot be updated or deleted once created; corrections must be new documents referencing `amendsId`.
5. **Private Journal Protection**: `journals` can only be read by `ownerUid == request.auth.uid` (or when `visibility == 'shared'` by an authorized user).
6. **Strict Schema & Bounds**: All strings and arrays have explicit `.size()` bounds and `.hasOnly()` key allowlists to prevent Shadow Updates and Denial-of-Wallet attacks.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: `auth = null` attempting `create` on `/observations/obs1` → `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth.token.email_verified = false` attempting `create` on `/users/u1` → `PERMISSION_DENIED`.
3. **Identity Spoofing**: `auth.uid = 'u1'` creating `/observations/obs1` with `ownerUid: 'u2'` → `PERMISSION_DENIED`.
4. **Shadow Field Injection**: Adding `isVerified: true` to `/checkins/chk1` → `PERMISSION_DENIED` (`hasOnly` check).
5. **Observation Mutation (Anti-Append-Only)**: Attempting `update` or `delete` on `/observations/obs1` → `PERMISSION_DENIED`.
6. **Journal Privacy Breach**: `auth.uid = 'specialist1'` reading `/journals/j1` where `visibility == 'private'` and `ownerUid == 'astra1'` → `PERMISSION_DENIED`.
7. **Privilege Escalation on User Profile**: User creating `/users/u1` with `role: 'admin'` without admin email → `PERMISSION_DENIED`.
8. **Resource Poisoning (ID > 128 chars)**: Creating document with 500-char ID → `PERMISSION_DENIED` (`isValidId`).
9. **Oversized Journal Body (> 4000 chars)**: Creating `/journals/j1` with 10,000-char `body` → `PERMISSION_DENIED`.
10. **Invalid Data Source Enum**: Creating `/observations/obs1` with `dataSource: 'hacked'` → `PERMISSION_DENIED`.
11. **Missing Provenance**: Creating `/observations/obs1` without `dataSource` or `observedAt` → `PERMISSION_DENIED`.
12. **Unauthorized Grant Modification**: Non-owner attempting to update `revoked` on `/grants/g1` → `PERMISSION_DENIED`.
