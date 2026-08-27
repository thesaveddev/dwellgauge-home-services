# Official source adapters

## BLS OEWS wages

The wage adapter downloads the official BLS OEWS metropolitan and national ZIP/XLSX files, extracts the occupation median wages, and creates metro-to-national ratios for the supported SOC codes. It rejects non-ZIP responses, missing workbook headers, unsupported occupations, and empty results.

Configure the official BLS URLs:

```env
BLS_OEWS_METRO_URL=https://www.bls.gov/oes/special.requests/oesm25ma.zip
BLS_OEWS_NATIONAL_URL=https://www.bls.gov/oes/special.requests/oesm25nat.zip
```

Run:

```bash
npm run pipeline:wages
npm run pipeline:compute
```

The output includes the BLS source, source URLs, generated timestamp, and ratio count. Existing output remains intact if a download or parse fails.

## Permit data

Permit data is jurisdiction-specific. Do not use a generic API response without verifying that it is an official city/county portal, the dataset is current, the fields are understood, and republication is allowed.

Set both variables only after confirming the mapping:

```env
PERMITS_SOCRATA_URL=https://official-portal.example.gov/resource/abcd-1234.json
PERMITS_SOURCE_CONFIG={"url":"https://official-portal.example.gov/resource/abcd-1234.json","source":"Official City Permit Portal","jurisdictionField":"city","dateField":"issued_date","typeField":"permit_type","amountField":"permit_fee","allowedTypes":["mechanical","roof","plumbing","electrical"]}
```

Run:

```bash
npm run pipeline:permits
```

The adapter rejects malformed rows, missing jurisdiction/date/amount fields, and datasets with no supported permit types. It writes only after successful validation and preserves the previous file on failure.

## Release gates

- Review source terms and rate limits.
- Keep source URLs and retrieval metadata in generated files.
- Inspect a random sample against the official portal.
- Confirm `/api/health/freshness` is healthy after refresh.
- Do not present modeled permit allowances as observed official data unless the generated observations are current and traceable.
