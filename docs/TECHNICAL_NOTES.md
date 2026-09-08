# Technical Notes

## Request discovery

Chrome DevTools Network inspection showed that expanding a Sales Delivery causes the Michigan METRC page to make a POST request to its transaction-detail route. The request includes the delivery's numeric internal identifier and a JSON paging object. The visible 10-digit delivery number uses leading zeros; the route uses the corresponding numeric value without those zeros.

## Why page-context execution is used

A direct `fetch()` replay returned HTTP 500 during testing, while METRC's page-loaded jQuery request mechanism succeeded with the same route and payload. The extension therefore injects the extraction function into the page's main JavaScript world and uses `window.jQuery` or `window.$`.

## Input handling

The extension reads the source file in the popup with the browser File API. It searches for unique 10-digit delivery values at the beginning of CSV records. This approach accommodates quoted multiline fields elsewhere in METRC's CSV export while avoiding transmission of the source file.

## Paging and retry behavior

Each request asks for 20 records. The extractor reads `TotalPages` from the response and continues until every page is retrieved. A failed page is retried up to three times with increasing delays. Deliveries are processed sequentially with a short pause to reduce request pressure.

## Output construction

Returned fields are preserved dynamically. The original zero-padded delivery number is written onto every row as `Delivery`. CSV values are quoted and embedded quotes are doubled. A UTF-8 byte-order mark is included for compatibility with Excel.

## Page state retained for diagnostics

At completion, the page retains these temporary JavaScript values until navigation or reload:

- `window.metrcFullRows`
- `window.metrcFullErrors`
- `window.metrcFullRun`

They support troubleshooting but are not written to permanent browser storage.

## Known dependencies and risks

- Michigan host: `https://mi.metrc.com/*`
- METRC page-level jQuery request function
- Undocumented route and response structure
- Chrome Manifest V3 `activeTab` and `scripting` permissions
- Authorized, active METRC browser session

The extension must be revalidated after significant Chrome or METRC changes.
