# Configure official BLS and permit data

The application currently has real Florida license data and generated cost estimates. The wage and permit warnings mean their optional source datasets are not installed. Do not describe wage ratios or permit observations as official until these steps pass.

## BLS OEWS wages

The BLS adapter uses official OEWS ZIP archives:

```env
BLS_OEWS_METRO_URL=https://www.bls.gov/oes/special.requests/oesm25ma.zip
BLS_OEWS_NATIONAL_URL=https://www.bls.gov/oes/special.requests/oesm25nat.zip
```

### Steps

1. Confirm the current OEWS release on the BLS OEWS page: https://www.bls.gov/oes/
2. Download the metropolitan and national ZIP files from BLS, or set the two variables to the current official release URLs.
3. If BLS blocks automated access, download the files manually and use local file URLs:

```env
BLS_OEWS_METRO_URL=file:///C:/path/to/oesmXXma.zip
BLS_OEWS_NATIONAL_URL=file:///C:/path/to/oesmXXnat.zip
```

4. Run:

```bash
npm run pipeline:wages
npm run pipeline:compute
npm run pipeline:validate
```

5. Confirm `data/generated/wage-ratios.json` contains `source: "BLS OEWS"`, a current `generatedAt`, and ratios for the configured metro area codes.
6. Compare a few median wages with the source workbooks. The application stores metro-to-national ratios, not a promise that every contractor charges the BLS median wage.

The importer rejects HTML responses, missing workbook columns, unsupported occupations, empty output, and unreasonable ratios. It preserves the previous valid file if refresh fails.

## Permit observations

Permits are not a national dataset. Choose one official city or county portal for each launch metro. Socrata is supported when the government portal officially exposes the dataset through its API.

### Steps for each jurisdiction

1. Identify the official city/county permit portal.
2. Confirm the dataset owner is the government authority.
3. Read its terms, API limits, update cadence, and republication rules.
4. Open the dataset API endpoint and inspect several rows.
5. Identify fields for jurisdiction, issue date, permit type, and fee/amount.
6. Configure the exact mapping in `PERMITS_SOURCE_CONFIG`.
7. Run the importer and review the output against the portal.

Example:

```env
PERMITS_SOCRATA_URL=https://official-portal.example.gov/resource/abcd-1234.json
PERMITS_SOURCE_CONFIG={"url":"https://official-portal.example.gov/resource/abcd-1234.json","source":"Official City Permit Portal","jurisdictionField":"city","dateField":"issued_date","typeField":"permit_type","amountField":"permit_fee","allowedTypes":["mechanical","roof","plumbing","electrical"]}
```

Then run:

```bash
npm run pipeline:permits
npm run pipeline:compute
npm run pipeline:validate
```

The permit adapter rejects non-JSON responses, malformed rows, missing dates/jurisdictions, invalid amounts, unsupported types, and empty matching results. It writes source URL, source name, retrieval timestamp, and record count into `data/generated/permit-observations.json`.

## Release decision

Run:

```bash
npm run launch:check
```

Warnings are acceptable only if the site does not make claims that require the missing dataset. Before publishing local wage or permit claims, require:

- Successful pipeline run
- Quality validation pass
- Random source comparison
- Current metadata and source URL
- Freshness endpoint returning healthy
- Updated page copy that accurately distinguishes observed data from modeled assumptions
