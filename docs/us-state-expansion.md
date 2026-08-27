# US state licensing expansion

Florida is the only state currently live. The registry in `data/sources/licenses-states.json` records the authority, public source, access status, terms link, cadence, and adapter state for the next launch markets.

## Current source register

| State | Authority | Current status | Next required action |
|---|---|---|---|
| Florida | Florida DBPR / CILB | Live | Refresh the authorized DBPR export and validate a sample. |
| Texas | Texas Department of Licensing and Regulation | Planned | Obtain an allowed export/API or written permission; map exact trades. |
| California | Contractors State License Board | Planned | Confirm CSLB data-use terms and approved access method. |
| New York | Department of State / local authorities | Planned | Choose a precise trade and jurisdiction; licensing is fragmented. |
| Georgia | Secretary of State / relevant professional board | Planned | Confirm board-specific feed, categories, and republication terms. |
| North Carolina | Licensing Board for General Contractors | Planned | Confirm license classes, export/API access, and terms. |

A public search page is not automatically permission to scrape, cache, republish, or commercialize its records. Treat access and republication as separate approvals.

## Adapter contract

Every state adapter must produce the shared `LicenseRecord` fields:

- `id`
- `stateCode`
- `licenseNumber`
- `businessName`
- `trade`
- `classification`
- `status`
- `issuedAt`
- `expiresAt`
- `city`
- `county`

The output must also include:

- Official authority name
- Source URL(s)
- Retrieval timestamp
- Record count
- Verification sample size and review date when completed

Use `scripts/lib/state-license-adapter.ts` for the common dataset contract and `scripts/lib/license-validation.ts` for required-field, state, duplicate, and synthetic-record checks.

## State launch procedure

1. Identify the exact licensing board and trade categories.
2. Read the source terms and contact the authority if commercial republication is unclear.
3. Confirm whether a bulk file, API, or permitted public-search workflow exists.
4. Record the source and cadence in `data/sources/licenses-states.json`.
5. Build a state-specific parser and fixture from an authorized sample.
6. Add tests for field aliases, statuses, dates, duplicates, and trade mapping.
7. Import into `data/licenses/<state>.json` atomically.
8. Compare a random sample against the official search tool.
9. Add the state to the sitemap only after validation and meaningful page coverage.
10. Mark the registry state `live` only after all gates pass.

Run the registry check with:

```bash
npm run pipeline:validate-states
```

Do not mark a planned state live merely because its authority has a searchable website. Until an approved adapter and dataset exist, the application must not advertise that state as covered.

## Europe later

European expansion is not a single adapter. Licensing, trade registration, pricing, tax display, privacy, language, and data reuse rules differ by country and often by region. Start with one country and one trade category only after the US pilot proves demand. Create a country-specific authority register, localized `LicenseRecord` extensions, VAT/currency rules, translated pages, and a separate terms review.
