# Pricing memo — outline (to complete before any price is published)

Status: **outline only. No prices are proposed here.** Prices are set only after you approve a completed memo.
Where prices go once approved: `src/config/pricing.ts` (`monthly`, `annual`, `annualSavingPercent`, `trialDays`) plus `site.flags.pricingPublished = true`. No page redesign is needed.

## 1. Inputs still needed
| Input | Why | Owner |
|---|---|---|
| Current list prices of comparable authoring tools (desktop and cloud), with source and date | Positioning and ceiling | Research (I can gather with sources when you ask) |
| Target customer segments and willingness to pay (survey or early-access interviews) | Validate Pro and Team | You / early access |
| Cost to serve: payment-provider fees, support time, hosting for the licensing/portal stack, signing certificate | Floor and margin | You |
| Tax and currency approach (Merchant of Record handles tax; display currency and regional pricing) | Price presentation | You |
| Business model target (number of paying users, revenue goal, time frame) | Sizing | You |

## 2. Questions the memo must answer
1. **Value metric.** Pro per user per year, Team per seat per year, Enterprise by volume: confirm.
2. **Price points and anchors.** Pro, Team (and Team minimum), and the Enterprise starting point. Show the reasoning against competitors and cost.
3. **Annual vs monthly.** Annual discount (the config supports `annualSavingPercent`), and whether monthly is offered for Team.
4. **Trial.** Pro and Team trial length (14 days suggested in the matrix) or none.
5. **Launch offers.** Early-access discount or founder pricing: only if you want it, and with clear terms.
6. **Education and non-profit.** Discount, verification and eligibility.
7. **Regional pricing.** Whether to localise prices.
8. **Upgrade, downgrade, refund and cancellation terms.** Proposed behaviour is in the [licensing architecture](licensing-architecture.md) §3.6; refund period to be decided.
9. **Price-change policy.** How existing subscribers are treated when prices change.

## 3. Memo structure
1. Summary recommendation (one table: plan, price per month billed annually and monthly).
2. Competitor reference table (with sources and retrieval dates).
3. Unit economics and break-even.
4. Sensitivity: price ±20% against conversion.
5. Risks and an experiment plan (for example waitlist survey, then a limited paid beta).
6. Decision list for you.

## 4. Website changes when prices are approved (about 30 minutes)
1. Fill the numbers in `pricing.ts`.
2. Set `pricingPublished: true`; optional `annualSavingPercent` and `trialDays`.
3. Rewrite the FAQ entries "When will pricing be announced?", "free trial" and "education discount".
4. Update the plan summary on the homepage text and the Pricing page title/description (remove "announced at launch").
5. Add `Offer` structured data only for prices that are live and checkout-ready.
6. Run `npm run build && npm run test:site`.
