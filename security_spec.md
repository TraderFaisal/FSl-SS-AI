# Security Specification & Threat Model — FSL TRADER PRO
## Architecture: Attribute-Based Access Control (ABAC) with Zero-Trust Firestore Security

### 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created by an authenticated user matching `request.auth.uid`. No user can escalate their own role to `ADMIN` or `SUPER_ADMIN`.
2. **Admin Source of Truth**: Admin permissions are exclusively verified via the existence of a trusted document at `/admins/$(request.auth.uid)` or verified superadmin email. Client claims or self-asserted fields are forbidden.
3. **License Tamper-Resistance**: License keys stored in `/licenses/{licenseId}` can only be generated or modified by verified administrators. Standard users can only redeem an existing active license.
4. **Signal Integrity**: Signals stored in `/signals/{signalId}` are institutional quantitative outputs. They can only be created or published by verified administrators or authenticated system engines.
5. **Audit Trail Immutability**: Documents in `/audit_logs/{logId}` are strictly append-only. Once written with a server timestamp `request.time`, they can never be updated or deleted by anyone.
6. **Path & ID Hardening**: All document keys must satisfy `isValidId(id)` (`^[a-zA-Z0-9_\\-]+$` up to 128 characters) to prevent ID injection attacks.
7. **Size & Type Protection**: Every string property must be bounded by a `.size() <= MAX` check to neutralize denial-of-wallet payload attacks.

---

### 2. The "Dirty Dozen" Threat Payloads
These payloads represent malicious exploits that MUST return `PERMISSION_DENIED`:

1. **Payload 1 (Privilege Escalation on Signup)**:
   - Target: `POST /users/attacker-uid`
   - Data: `{ "id": "attacker-uid", "email": "attacker@evil.com", "role": "SUPER_ADMIN" }`
   - Expected: `PERMISSION_DENIED` (cannot self-assign ADMIN/SUPER_ADMIN).

2. **Payload 2 (User ID Spoofing)**:
   - Target: `POST /users/victim-uid` as `attacker-uid`
   - Data: `{ "id": "victim-uid", "email": "victim@domain.com", "role": "USER" }`
   - Expected: `PERMISSION_DENIED` (UID mismatch with `request.auth.uid`).

3. **Payload 3 (Admin Registry Self-Insertion)**:
   - Target: `POST /admins/attacker-uid` as unverified non-admin
   - Data: `{ "userId": "attacker-uid", "grantedBy": "self", "role": "ADMIN" }`
   - Expected: `PERMISSION_DENIED` (only existing admin can create admin).

4. **Payload 4 (Ghost Field Injection / Shadow Update)**:
   - Target: `PATCH /users/my-uid`
   - Data: `{ "activeLicenseKey": "FSL-UNLIMITED", "isBypassed": true, "evilShadowKey": "hack" }`
   - Expected: `PERMISSION_DENIED` (unrecognized fields blocked by schema validation).

5. **Payload 5 (Unauthenticated License Generation)**:
   - Target: `POST /licenses/FSL-FAKE-KEY-9999` as anonymous or standard user
   - Data: `{ "key": "FSL-FAKE-KEY-9999", "plan": "ENTERPRISE", "status": "ACTIVE" }`
   - Expected: `PERMISSION_DENIED` (admin-only creation).

6. **Payload 6 (License Expiration Tampering)**:
   - Target: `PATCH /licenses/FSL-PRO7-9821-4321-8899` as standard user
   - Data: `{ "expiresAt": "2099-12-31T23:59:59Z", "status": "ACTIVE" }`
   - Expected: `PERMISSION_DENIED` (non-admin cannot edit licenses).

7. **Payload 7 (Audit Log Deletion / Erasure)**:
   - Target: `DELETE /audit_logs/LOG-17898012` as any user
   - Expected: `PERMISSION_DENIED` (audit logs are immutable and permanent).

8. **Payload 8 (Audit Log Modification)**:
   - Target: `PATCH /audit_logs/LOG-17898012`
   - Data: `{ "action": "CLEARED_RECORD" }`
   - Expected: `PERMISSION_DENIED` (no update allowed).

9. **Payload 9 (Oversized Payload / Denial of Wallet)**:
   - Target: `POST /users/my-uid`
   - Data: `{ "id": "my-uid", "email": "legit@test.com", "name": "A".repeat(1000000) }`
   - Expected: `PERMISSION_DENIED` (string size exceeds 100 characters limit).

10. **Payload 10 (Document ID Poisoning)**:
    - Target: `POST /signals/../../passwords%00bad`
    - Expected: `PERMISSION_DENIED` (ID fails `isValidId()` regex check).

11. **Payload 11 (Signal Tampering by User)**:
    - Target: `POST /signals/SIG-HACK` as standard trader
    - Data: `{ "symbol": "BTC/USD", "direction": "BUY", "confluenceScore": 100 }`
    - Expected: `PERMISSION_DENIED` (signals are admin/engine created).

12. **Payload 12 (Blanket Query / User List Scraping)**:
    - Target: `GET /users` without UID filter by standard user
    - Expected: `PERMISSION_DENIED` (users cannot list arbitrary accounts).

---

### 3. Test Runner Design
The rules will be verified against these invariants and deployed to the provisioned Firestore database instance.
