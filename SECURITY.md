# Security Model

## Scope

The extension is designed for authorized, read-only extraction of Michigan METRC Sales Deliveries transaction detail.

## Permissions

- `activeTab`: limits execution to the tab deliberately activated by the operator.
- `scripting`: permits the extraction function to run in the active METRC page.
- Host access is restricted to `https://mi.metrc.com/*`.

## Data handling

- Source CSV content is read locally.
- No API keys, passwords, cookies, or session tokens are collected or stored.
- No analytics or external network destination is included.
- Output is downloaded locally as CSV.

## Operational controls

- Install only from a controlled source archive.
- Limit use to authorized personnel and licensed facilities.
- Preserve source and output files in approved engagement storage.
- Validate counts and errors after every run.
- Remove the extension when it is no longer required.

## Reporting concerns

Do not include credentials or client data in a GitHub issue. Report the extension version, Chrome version, general error text, and reproducible steps using sanitized sample data.

## Disclaimer

This independent project is not affiliated with or supported by METRC. Because it relies on an internal web route, continued compatibility is not guaranteed.
