# MEOWAVE Demo Reward System

**Prototype whitepaper — version 1.0**

## Important disclosure

The MEOWAVE reward system described here is a product simulation. Demo SOL is an in-game accounting unit and is **not real cryptocurrency**. It has no guaranteed monetary value, cannot be traded, and creates no right to receive SOL, money, tokens, or any other asset.

The prototype performs no on-chain balance verification, makes no blockchain transaction, requests no wallet signature, and distributes no real reward. Its purpose is to demonstrate game-economy pacing and a possible withdrawal-interface flow without moving funds.

## 1. System purpose

MEOWAVE connects skilled runner gameplay to a small, understandable demo balance. Players can try the complete runner before enrolling in the reward simulation. Once enrolled, careful movement and consistent collection gradually add Demo SOL to a local-first browser ledger.

The design has four goals:

1. Keep the runner enjoyable before any account-like step.
2. Reward active play rather than background time.
3. Make the earliest threshold possible after 2 active hours, while calibrating normal competent play to approximately 3 active hours.
4. State clearly that every balance, eligibility result, and withdrawal is simulated.

## 2. Definitions

- **Reward Note:** One physical, collectible SOL-shaped game object placed on the track.
- **Simulated lamport:** The smallest integer unit in the local demo ledger. It is only named for an intuitive SOL-like display and is not an on-chain lamport.
- **Demo SOL:** One billion simulated lamports shown as a readable gameplay balance.
- **Trial Mode:** Play before the simulated eligibility gate is complete. Trial pickups affect the run experience but do not enter the persistent Demo SOL ledger.
- **Eligible Play:** Active gameplay after a valid public-address format and the clearly labeled simulated holding check have passed.
- **Simulated Withdrawal:** A local ledger operation that demonstrates a withdrawal user flow without transferring an asset.

## 3. Enrollment and simulated eligibility

Players may begin in Trial Mode without providing an address. To start eligible play, the prototype asks for a Solana-format **public address only**. It never asks for a seed phrase, private key, or signature.

The browser is the authority for the displayed prototype balance. When the optional `/api/rewards` service is available, the public address, simulated eligibility state, aggregate run telemetry, credits, and withdrawal receipts are also sent to the site's configured database as a best-effort demo mirror. No private key, seed phrase, wallet signature, wallet balance, or real transaction is sent.

After local address-format validation, the interface presents a mock MWAVE holding result above **$10.00**. This value is explicitly marked **Simulated**. It is not fetched from a wallet, RPC provider, token-price service, exchange, or blockchain. Passing this demo gate enables future Reward Notes to enter the local ledger.

Trial pickups are not retroactive. Notes collected before eligibility remain trial gameplay data and are never added to the Demo SOL balance later.

## 4. Reward supply and pacing

The reusable track contains 14 segments of 20 meters each:

`14 segments × 20 m = 280 m per track cycle`

Exactly five Reward Notes appear in each 280-meter cycle. The pacing model assumes repeated four-minute runs, a reasonable survival window for an active average player. Applying the game's 10.5 m/s starting speed, 0.085 m/s per-second ramp, and 24 m/s cap yields about 4.69 km per run, or 70.3 km across one active hour. The public model rounds this to 70,000 meters:

`70,000 m ÷ 280 m × 5 notes = 1,250 note opportunities per active hour`

An average competent player is expected to collect approximately two thirds of the opportunities:

`1,250 × 66.7% ≈ 833 notes per active hour`

Each eligible physical note adds **100,000 simulated lamports**, equal to **0.0001 Demo SOL**, to the integer ledger:

`833 × 0.0001 ≈ 0.0833 Demo SOL per active hour`

At that expected rate:

`0.0833 × 3 active hours ≈ 0.25 Demo SOL`

Therefore, a typical competent player reaches the minimum simulated withdrawal balance in approximately **3 active hours**. A much longer uninterrupted expert run spends more time at maximum speed and can approach the threshold sooner, while short runs or missed notes take longer. This is a pacing estimate, not a promise; actual time varies with run length, collection accuracy, valid active time, and caps.

## 5. Active-time and issuance rules

- The simulated withdrawal interface remains locked until the ledger records at least **2 active hours**.
- The minimum simulated withdrawal is **0.25 Demo SOL**.
- Issuance is capped at **0.125 Demo SOL per active hour**. This makes two hours the mathematical earliest possible point at which 0.25 can be available.
- Issuance is capped at **0.30 Demo SOL per calendar day** in the prototype.
- Only gameplay in the active `Playing` state counts. Menus, countdowns, pauses, hidden tabs, and inactive periods do not count.
- A meaningful run lasts at least 20 seconds, includes at least two accepted movement commands, and averages at least one accepted command per 30 seconds as the run gets longer. These values are client-reported prototype telemetry, not secure proof of play.
- The Double SOL gameplay power-up does not multiply Demo SOL rewards. It may enhance score feedback, but every physical Reward Note can add at most its single base ledger amount.
- Shield, Magnet, Rhythm Boost, and Slow Time may improve survival or collection access, but cannot bypass hourly or daily issuance caps.

The two-hour gate and three-hour expectation describe different limits: two hours is the earliest allowed interface eligibility; approximately three hours is the expected time for a competent normal player to accumulate the 0.25 minimum.

## 6. Simulated withdrawal flow

When both conditions are met — at least 2 active hours and at least 0.25 Demo SOL available — the fixed 0.25 Demo SOL withdrawal-simulation action unlocks.

Confirming the request moves the fixed 0.25 Demo SOL amount from **Available Demo SOL** to **Simulated Withdrawn** in the local ledger and records a timestamped demo receipt. The optional server mirror may receive that demo receipt, but there is no blockchain submission, wallet signature, fee, or transfer of SOL or any other asset.

The completion state must read **Simulation complete**, never “SOL sent” or similar language that could imply payment.

## 7. Example outcomes

| Collection performance | Approximate Demo SOL per active hour | Approximate time to 0.25 |
| --- | ---: | ---: |
| 50% of available notes | 0.0625 | 4 hours |
| 66.7% of available notes | 0.0833 | 3 hours |
| At or above the hourly cap | 0.125 | 2 hours |

These examples assume eligible, valid active time and remaining room under the daily cap. They are explanatory estimates, not guaranteed outcomes.

## 8. Storage, trust, and limitations

Prototype balances are stored in the browser and associated locally with the entered public address. They do not follow the player to another browser or device in this implementation. Clearing site data can erase them. A technically capable user can also modify browser storage.

When available, the optional server endpoint keeps a best-effort database mirror of public addresses and simulated ledger events. The current interface does not use that mirror as authentication or restore authority, and offline or interrupted requests can make it differ from the browser ledger. Run duration, pickup count, and action count originate from the client and are not anti-cheat evidence.

For those reasons, neither the browser ledger nor its optional server mirror is secure or suitable for a real-value reward system. MEOWAVE makes no guarantee that demo balances will persist, remain accurate, or ever become redeemable. Demo history may be reset during development.

## 9. Requirements for any future real production system

A real-value system would be a separate product and must not reuse the prototype ledger as an authority. Before any real SOL functionality could be considered, it would require at minimum:

- Independent legal and regulatory analysis for every supported jurisdiction, including consumer, promotions, gaming, tax, sanctions, and financial-services obligations.
- Clear terms, eligibility restrictions, risk disclosures, privacy notices, and age or location controls where required.
- Authenticated player accounts and a server-authoritative, auditable ledger backed by durable storage.
- Robust anti-cheat, bot resistance, fraud monitoring, rate limits, appeals, and operational review.
- Genuine on-chain ownership indexing and independently sourced price data with documented freshness and failure behavior.
- Treasury controls, reserve policy, sustainable issuance limits, and explicit treatment of fees and volatility.
- Professionally audited transaction infrastructure, secure key custody, incident response, and an explicit user-approved signing flow.
- Security, privacy, accessibility, load, and economic-abuse audits before launch.

Nothing in this prototype represents completion of those requirements, an offer of value, or a commitment to introduce real rewards in the future.

## 10. Summary

MEOWAVE's prototype economy uses five physical Reward Notes per 280-meter cycle. Each eligible note represents 0.0001 Demo SOL in a local simulation. The model targets approximately 0.0833 Demo SOL per active hour for a competent player, a 0.25 minimum in about three hours, a two-hour earliest eligibility gate, a 0.125 hourly cap, and a 0.30 daily cap.

All balances and withdrawals remain simulated. No real cryptocurrency is earned, held, verified, or transferred.
