# Contractor outreach playbook

Selling featured listings to contractors who **already appear organically** on
the site. They have zero risk (they're already getting exposure) and a clear
upside (more of it). Sequence assumes email; LinkedIn/SMS variants at the end.

## The offer

| Tier | What they get | Price |
|---|---|---|
| Free — Verified | "License verified" badge on their profile, edit business description | $0 (hook — gets the conversation started) |
| Featured | Top placement in their trade × metro cost page + lead form routing priority | $49–149/mo depending on metro size |
| Market exclusive | Only featured pro for that trade × metro | $199–399/mo in large metros |

Anchor against the alternative: industry-average leads run **~$90 each** on
Angi/Thumbtack — a flat $99/mo beats buying two shared leads a month.

Attach the one-page comparison to the first email: see
`docs/competitive-brief.md`. For a print-ready PDF handout, open
`docs/competitive-brief-print.html` in a browser and print to PDF
(Ctrl+P / Cmd+P → Save as PDF). It walks a contractor from "why not the big
names" to the flat-rate offer in 30 seconds.

## Targeting

Work from your own data: pull active licenses from `data/licenses/*.json` for
one state, cross-reference metros where you have cost pages. Prioritize:

1. Active license + city matching one of our live metro pages
2. Trades with highest ticket: HVAC > roofing > electrical > plumbing
3. Businesses with a website (easier pitch) AND those without (bigger need)

## The sequence (email)

**Email 1 — Day 0. Subject: "Your {trade} license shows up when {city} homeowners check costs"**

> Hi {first name},
>
> I run DwellGauge — we publish what projects actually cost in {city}, built from
> public wage data and permit records ({link to their relevant cost page}).
>
> Your {licenseNumber} license came up in my {state} board data, so you already
> appear in our {city} {trade} results.
>
> Two things, no strings:
> 1. Want the free "license verified" badge? Reply "verify" and I'll set it up today.
> 2. If you'd like to be the first {trade} company homeowners see there, I have
>    one featured slot for {city} — $X/mo flat, cancel anytime.
>
> Either way, nice work keeping an active license since {issuedAt}. Most don't.
>
> {name}

**Email 2 — Day 4. Subject: "Re: ..."** (reply-thread keeps deliverability high)

> Quick follow-up, {first name}. The badge is free either way — takes me 2 minutes.
> And here's the math on featured: average home-services lead runs ~$90 across
> Angi/Thumbtack. Our featured slot is ${price}/mo flat — roughly two shared
> leads. Ours route exclusively to you. Want it?

**Email 3 — Day 9. Subject: breakup / scarcity**

> Last note from me. I'm opening exactly one featured slot per {city} {trade},
> and I've had another local company ask about it. If you want it, reply by
> Friday. If not — good luck this season, and the free verified badge offer stands.

## Variants

- **LinkedIn:** Email 1 body minus links, end with "happy to send the page link here."
- **SMS (only if they replied):** "{First name}, it's {you} from DwellGauge — your featured {city} slot is still open till Friday. Yes/no works 👍"

## Objection handling

| Objection | Response |
|---|---|
| "I already use Angi/Thumbtack" | "Keep them. We're flat-rate and exclusive — most of my featured pros run both and compare cost-per-job after a month." |
| "I get enough work" | "Then take the free verified badge — it protects you when homeowners compare. Featured can wait until you want more." |
| "No website" | "That's the point — your DwellGauge profile IS your web presence, and it's where cost-searchers already land." |
| "Too expensive" | vs. shared-lead math above; also offer first month at 50% to prove routing. |
| "Is this legit?" | Link the live profile showing their public license record; never ask for money before they see it. |

## Ops & tracking

- Send Tue–Thu mornings, local time. Cap at ~20/day/mailbox.
- Log every contractor + status in `data/runtime/outreach.csv` (or a simple sheet):
  name, license id, tier pitched, date, outcome.
- Benchmarks for cold B2B: open 40–60% (small lists, clean subjects), reply
  5–15%, close 1–5%. Ten featured clients = $500–1,500/mo recurring from one
  state's worth of data — repeat per state.
- UTM-tag the cost-page link in Email 1 (`?utm_source=outreach`) so you can show
  each prospect real traffic numbers in follow-ups.
