# METRC Sales Deliveries Tag Export

A private Chrome extension created by NUMBERS Accounting to export tag-level transaction detail from Michigan METRC Sales Deliveries.

## The problem

Michigan METRC allows an authorized back-end user to export a summarized Sales Deliveries report. The compliance record needed for reconciliation, however, exists at the package/tag level. In the ordinary interface, the user must expand each delivery separately to see those records.

This extension automates that repetitive read-only retrieval. It accepts the summarized Sales Deliveries CSV as its control population, extracts each 10-digit delivery number, requests the transaction detail for every delivery through the user's existing authenticated METRC session, and downloads one consolidated CSV.

## What it does

1. Reads a user-selected Sales Deliveries CSV locally in Chrome.
2. Identifies unique 10-digit delivery numbers from the first CSV column.
3. Removes display-only leading zeros when constructing the internal delivery identifier.
4. Calls METRC's Sales Deliveries transaction-detail web route from the authenticated page.
5. Follows pagination and retries transient failures up to three times.
6. Restores the original zero-padded delivery number on every output row.
7. Downloads a UTF-8 CSV containing all returned tag-level fields.
8. Downloads a separate error CSV if any delivery fails after retries.

## What it does not do

- It does not store or request a METRC password, API key, cookie, or session token.
- It does not create, edit, adjust, void, submit, or delete METRC records.
- It does not send extracted data to NUMBERS Accounting or another external service.
- It is not a METRC Connect integration and does not use the official public API.

## Requirements

- Google Chrome with permission to load an unpacked extension.
- An authorized user logged into `https://mi.metrc.com`.
- Access to the correct Michigan license and Sales Deliveries records.
- A summarized Sales Deliveries export saved as a real `.csv` file.

## Installation

1. Download and extract the release archive to a permanent local folder.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select the folder containing `manifest.json`.
6. Pin **Flint Flower Life METRC Tag Export** from Chrome's Extensions menu.

See [docs/OPERATOR_GUIDE.md](docs/OPERATOR_GUIDE.md) for the controlled operating procedure.

## Technical architecture

The Manifest V3 popup reads the source CSV without uploading it. When the operator starts an extraction, Chrome injects `runMetrcTagExtraction` into the active Michigan METRC page's main JavaScript world. The function uses the request mechanism already loaded by the METRC application and calls:

```text
POST /api/sales/deliveries/transactions?id={deliveryId}&includeHistory=true
```

with a JSON paging request. The extension processes deliveries sequentially, waits briefly between deliveries, and displays progress in a page overlay.

## Validation history

Development was performed progressively:

- Single-delivery inspection established the endpoint, request method, payload, and response structure.
- A three-delivery test returned 11 tag rows with matching package counts and totals.
- A 25-delivery test returned 78 tag rows, matched the $1,102.52 summarized population, and reported zero errors.
- A full population of 1,289 deliveries was recognized from the source CSV and successfully processed through the installed extension.

These results document observed behavior; they are not a guarantee that METRC will preserve the same internal route.

## Output files

```text
Flint_Flower_Life_METRC_Tag_Detail_YYYY-MM-DD_HHMMSS.csv
Flint_Flower_Life_METRC_Tag_Errors_YYYY-MM-DD_HHMMSS.csv
```

The error file is created only when failures remain after three attempts.

## Security and compliance considerations

- Use only with the licensee's authorization and under an individually assigned METRC account.
- Apply least-privilege access and preserve the source summary as the control population.
- Treat the output as confidential compliance data.
- Do not place credentials in the source code or repository.
- Review applicable METRC terms, state requirements, and organizational policies before deployment.
- Revalidate totals, row counts, and error logs after each run.

See [SECURITY.md](SECURITY.md) for the security model and [docs/TECHNICAL_NOTES.md](docs/TECHNICAL_NOTES.md) for implementation details.

## Maintenance

This tool depends on an undocumented web route and METRC's page-level request library. A METRC interface update could require code changes. Before deploying a new version:

1. Test one delivery.
2. Test a small known population.
3. Reconcile package counts and dollar totals.
4. Run the full population only after the control tests pass.

## License and attribution

This repository is an independent internal-use project and is not affiliated with, endorsed by, or supported by METRC. METRC and related marks belong to their respective owner. No open-source license is granted unless the repository owner adds one explicitly.

## Version

Version 1.0.0 — initial validated private release.
