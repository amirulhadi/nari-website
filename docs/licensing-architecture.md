# NARI Studio — Subscription & Licensing Architecture (recommendation)

Status: **design document only.** Nothing here is built, and nothing should be built without your approval. No payment processing, licence enforcement or subscription restriction exists in the website or the app.
Date: 2026-11-20 · Based on: the app at v0.9.0 (`D:\Projects NARI\NARI`) and the proposed plans in [subscription-feature-matrix.md](subscription-feature-matrix.md).

---

## 1. Starting point (what exists today)

| Fact (verified in the app repo) | Consequence |
|---|---|
| Tauri 2 desktop app: React/TypeScript UI in a WebView, Rust host. | Trusted logic belongs in Rust, not in the WebView JavaScript. |
| **No network access by design.** Production CSP: `connect-src 'self' ipc: http://ipc.localhost`; no telemetry. | Licensing needs an explicit, documented, opt-in network call, and a CSP/capability change. This is a privacy decision to communicate to users. |
| No accounts, backend, payments or licence code. | Everything below is new. |
| Export is planned in TypeScript (`src/export/*`) and **written by the Rust command `export_package`** (`src-tauri/src/commands/export.rs`). | Rust is the right enforcement point for export-time rules (see §6). |
| Projects are local `.nari` folders; no cloud. | Project/storage quotas are not enforceable or desirable (see the matrix). |
| Release checklist already lists signing, updater and a licence/EULA decision as "needs you". | These are prerequisites (L0). |

**Principle:** the marketing website is **not** a licensing system. It only links to a separate account/billing app. The desktop app verifies licences itself, offline, from signed data.

---

## 2. Target architecture

```
 ┌──────────────────────────┐   links    ┌──────────────────────────────┐   webhooks   ┌───────────────────────────┐
 │ Marketing website        │ ─────────► │ Account & billing portal     │ ◄──────────► │ Payment provider          │
 │ (this repo, static)      │            │ (future web app)             │              │ (Merchant of Record)      │
 │ pricing, early access    │            │ sign up/in, seats, invoices  │              │ checkout, tax, renewals,  │
 └──────────────────────────┘            └──────────────┬───────────────┘              │ upgrades, cancellation    │
                                                         │                              └───────────────────────────┘
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │ Licensing API (small backend)│
                                          │ accounts · subscriptions ·   │
                                          │ entitlements · activations   │
                                          │ signs licence tokens         │
                                          └──────────────┬───────────────┘
                                                         ▲ HTTPS: activate / refresh / deactivate
                                          ┌──────────────┴───────────────┐
                                          │ NARI Studio desktop (Tauri)  │
                                          │ Rust: token store (OS vault),│
                                          │ offline signature check,     │
                                          │ entitlement gate in export   │
                                          └──────────────────────────────┘
```

### Components and responsibilities
| Component | Responsibility | Never does |
|---|---|---|
| **Marketing website** | Pricing display (from `pricing.ts`), links to portal via `account.appUrl` | Hold secrets, verify licences, process payments |
| **Payment provider** | Checkout, tax/VAT, invoices, renewals, dunning, upgrades/downgrades, cancellation, payment history, hosted billing portal | Know about NARI features |
| **Account portal** | Sign-up/sign-in (managed auth), subscription status, seat assignment, device list, "Manage subscription" (deep link to provider portal) | Issue licences by itself |
| **Licensing API** | Source of truth for entitlements; maps provider subscription → plan; issues signed tokens; tracks activations | Handle card data |
| **Desktop app** | Stores token, verifies signature offline, enforces entitlements at export, shows plan | Trust the WebView, store the signing key |

---

## 3. Key decisions and recommendations

### 3.1 Payment processing — use a Merchant of Record
**Recommend:** Paddle or Lemon Squeezy (or similar). They are the seller of record, so they handle global sales tax/VAT, invoices, refunds, renewals and payment history, and give a hosted customer portal. This removes most tax and compliance work for a small team.
**Alternative:** Stripe Billing + Stripe Tax, which is more flexible and cheaper at scale but needs a legal entity, tax registrations and more engineering.
**Decision needed from you** (with the company/legal entity question). *Not* to be integrated yet.

### 3.2 Authentication
- Managed identity provider for the portal (e.g. Clerk, Auth0, Supabase Auth, or the provider's own customer accounts).
- **Desktop sign-in through the system browser** using OAuth 2.0 authorisation code + **PKCE** and a custom-scheme or loopback redirect. The app never shows a password field and never sees the password.
- Social/SSO login for individuals; **SAML/OIDC SSO for the portal** is an Enterprise feature.

### 3.3 Licence format — signed entitlement token
A compact token (JWT-like or a custom CBOR/JSON envelope) signed with **Ed25519**:

```json
{
  "v": 1,
  "sub": "acct_123",            // account id (opaque)
  "plan": "pro",                // free | pro | team | enterprise
  "seat": "seat_456",           // for Team/Enterprise
  "device": "sha256(device-id)",// bound to this installation
  "features": { "exportBadge": false, "formats": ["html","scorm12","scorm2004"] },
  "iat": 1790000000,
  "refreshAfter": 1790604800,   // ask the server again after ~7 days
  "expires": 1792592000,        // hard expiry ~30 days after issue
  "kid": "2026-11"              // signing-key id for rotation
}
```
- The **private key lives only on the licensing server** (KMS/HSM or secrets manager). The **public key (with spare `kid`s) is embedded in the app**. Rotation = ship a new public key before switching.
- Features are **entitlement flags**, not plan names, so plans can change without an app update.

### 3.4 Device activation
- On first sign-in the app sends: account token, a **random installation id** stored in the OS credential vault (not hardware fingerprints, which are brittle and privacy-sensitive), app version, OS.
- Server counts activations per seat (Pro: 2 devices). Users deactivate from the portal or app. Replacing a machine never needs support.

### 3.5 Offline behaviour
| Situation | Behaviour |
|---|---|
| Normal | Token verified locally on start; app refreshes silently when `refreshAfter` has passed and the network is reachable |
| Offline up to `expires` | Fully works. Typical grace: **~30 days** after issue |
| Past `expires` and offline | Behaves as **Free** until the next successful refresh. Editing and opening projects are **never** blocked |
| Air-gapped sites (Enterprise) | **Offline licence file**: a signed, longer-lived, device-bound token delivered by the vendor; renewed by a new file |
| Clock tampering | Store last-seen time in the vault; if the clock moves backwards beyond a tolerance, treat as expired |

### 3.6 Subscription expiry and downgrade
- Lapse → entitlements fall back to Free (badge returns, commercial licence ends per the EULA). **Projects remain fully usable.**
- Already-exported courses are not touched.
- Payment failure → provider "dunning" period first; the licensing API keeps issuing tokens during the grace window configured with the provider.

### 3.7 Enforcement, honestly
A desktop app can always be patched by a determined user. The goal is **honest-user friction and clear licensing, not DRM**. Practical rules:
- **Enforce at export, in Rust.** Today the TypeScript layer builds the package plan and Rust `export_package` writes it. Move badge injection and format gating into Rust (`export_package` checks the verified entitlement, then adds or omits the badge in the written `index.html`/player), because WebView JS is easy to modify.
- Keep **editing, saving and previewing unrestricted** on every plan.
- No heavy obfuscation, no hardware locking, no phoning home on each launch.
- Server-side limits (AI/TTS credits, cloud storage) are enforced **on the server**, where they are real.

### 3.8 Usage limits and storage
- **Projects, slides:** no limits, deliberately (see the matrix).
- **Storage:** only for future cloud features, enforced server-side per account/team.
- **Seats and devices:** counted by the licensing API.
- **AI/TTS credits (future):** metered per account by the API that proxies the provider; never put provider keys in the app.

### 3.9 Privacy
The licence check sends only: account id, hashed installation id, app version, OS. No project content, no usage analytics. This must be stated in the privacy policy and in the app, and the existing "no telemetry" claim reworded accurately: "no usage tracking; the only network call is licence verification when you sign in to a paid plan". **The Free plan should work without any network call.**

---

## 4. Required changes in the desktop app (later)
| Area | Change |
|---|---|
| `tauri.conf.json` CSP | Add the licensing API origin to `connect-src` (or make requests from Rust only, leaving the WebView CSP untouched, **preferred**) |
| Rust | New `licence` module: token parse + Ed25519 verify (`ed25519-dalek`), secure storage (`keyring`), HTTP client (`reqwest` with rustls), commands `licence_status`, `licence_sign_in`, `licence_refresh`, `licence_sign_out` |
| Rust `export_package` | Read verified entitlements; inject/omit badge; gate formats |
| Deep links | `tauri-plugin-deep-link` (or loopback server) for the sign-in redirect |
| UI | Account section in About/Settings: plan, status, sign in/out, "Manage subscription" (opens the portal in the system browser), clear "Free mode" messaging when expired |
| Updates and signing | `tauri-plugin-updater`, a code-signing certificate (already on the release checklist) |
| Tests | Rust tests for signature verification (valid, tampered, wrong key, expired, clock rollback), export tests per entitlement |

---

## 5. Data model (licensing API)
```
accounts(id, email, created_at)
organisations(id, name, owner_account_id)            -- Team/Enterprise
subscriptions(id, account_or_org_id, provider, provider_subscription_id,
              plan, status, seats, period_end, cancel_at_period_end)
seats(id, subscription_id, account_id, assigned_at)
activations(id, seat_or_account_id, installation_hash, first_seen, last_seen, revoked_at)
entitlement_overrides(id, subject_id, flags_json, reason, expires_at)   -- support, pilots
webhook_events(id, provider, payload_hash, processed_at)                -- idempotency
```
Webhook handling: verify the provider signature, process idempotently, map provider plan IDs to NARI plans in configuration, never trust client-supplied plan data.

---

## 6. Website entry points (prepared, switched off)
The website already contains the switches (`src/config/site.ts`):

| Entry point | Config | Today |
|---|---|---|
| Sign in | `accountUrl("signIn")` | Not rendered (`accountsEnabled: false`, `account.appUrl: null`) |
| Sign up / Get started | `accountUrl("signUp")` | Not rendered; primary CTA is early access |
| Start free trial | `accountUrl("startTrial")` | Not rendered; no trial terms decided |
| Manage account / Manage subscription | `accountUrl("manageAccount")`, `accountUrl("manageSubscription")` | Not rendered |

Switching on = set `account.appUrl` to the portal origin and `accountsEnabled: true`. These are plain links to the portal; the website holds no session, secrets or billing logic. The site test fails the build if an account link appears while accounts are disabled.

Pricing numbers, plan contents, trial length and the annual saving are all in `src/config/pricing.ts`; publishing prices is a config change plus `pricingPublished: true`. When prices are published, the pricing FAQ entries ("When will pricing be announced?", trials, education discount) must be revised.

---

## 7. Roadmap (all require your approval to start)
| Stage | Scope | Depends on |
|---|---|---|
| **L0 — Prerequisites** | Legal entity/company name, EULA and privacy policy, code-signing certificate, auto-update, decision on payment provider | Owner decisions |
| **L1 — Accounts & checkout** | Provider products/prices (after pricing approval), account portal with managed auth, webhook receiver, subscriptions table | L0, approved prices |
| **L2 — Licensing API & desktop activation** | Key pair + signer, activate/refresh/deactivate endpoints, Rust licence module, sign-in flow, plan display, **export enforcement**, offline grace | L1 |
| **L3 — Teams** | Organisations, seat assignment, admin roles, invoices | L2 |
| **L4 — Enterprise** | Offline licence files, portal SSO, volume/PO billing, security documentation | L3 |
| **L5 — Cloud features (optional)** | Review links, shared libraries, cloud storage, AI/TTS credits with server-side metering | L2, product decision |

## 8. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Users object to any network call in an offline-first tool | Free works with zero network calls; paid check is infrequent, minimal and documented |
| Piracy by patching | Accept; keep the honest path easy; enforce server-side where value is server-side |
| Support burden from device limits | Self-service deactivation; 2 devices on Pro; generous overrides in the portal |
| Lock-in anxiety | Lapse never blocks editing or project access; open, documented project format |
| Provider lock-in | Keep provider specifics in one adapter; entitlements are NARI's own model |
| Key compromise | Key ids and rotation procedure; short-lived tokens limit the blast radius |

## 9. Decisions requested
1. Payment provider approach: Merchant of Record (recommended) vs Stripe.
2. Legal entity / company name, and who issues the EULA and privacy policy.
3. Confirm the principle: **editing is never blocked; only paid export options change on lapse**.
4. Confirm the **Free plan makes zero network calls**.
5. Offline grace length (30 days suggested) and Pro device count (2 suggested).
