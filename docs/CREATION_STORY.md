# From 1,289 Clicks to One Export

## Building a Read-Only Chrome Tool for METRC Delivery-Sale Compliance Data

The problem did not begin as a software project. It began as a reporting problem.

One of our cannabis retail clients conducts delivery sales. METRC allows a back-end user to download a summarized list of those deliveries, but the compliance layer we actually need is the package tag. That information is visible in METRC, but only after opening an individual delivery. The ordinary workflow therefore requires a user to expand one delivery, collect its tag information, return to the list, and repeat the process for every sale.

For a few deliveries, that is inconvenient. For 1,289 deliveries, it is not a workable control procedure.

The objective was deliberately narrow: retrieve information that an authorized user could already see, consolidate it, and save it as a CSV. We were not trying to submit transactions, alter inventory, automate adjustments, or build a full METRC integration. We simply needed to get the existing compliance data out of the interface in a controlled and reproducible way.

## Finding the underlying request

Modern web applications rarely reload an entire page every time a user expands a record. Instead, the page usually makes a background request and inserts the returned information into the display. Chrome's Developer Tools make those requests visible.

We opened the Network panel, selected the Fetch/XHR filter, and expanded one Sales Delivery. Among the routine support and telemetry traffic, a meaningful request appeared: a POST to METRC's Sales Deliveries transaction-detail route. Its query string contained the delivery identifier and an `includeHistory` setting. Its request body contained an ordinary paging object. Its response contained the transaction rows, including package IDs, package labels, product information, quantity, price, tax, and delivery status.

That response established the essential point: the package-tag detail was already being delivered to the authorized browser as structured data. The interface was merely showing it one delivery at a time.

There was one small translation issue. METRC displayed delivery numbers as ten digits with leading zeros, while the background request used the corresponding numeric identifier without the leading zeros. A displayed delivery such as `0004137052` therefore became `4137052` in the request. The extension would need to preserve both concepts: use the numeric value for retrieval, but retain the original zero-padded number as the audit-friendly delivery identifier in the CSV.

## Why a copied request was not enough

The first instinct was to replay the request with the browser's standard `fetch()` function. That produced an HTTP 500 error even though the page itself could retrieve the same record. Reconstructing the request as form data did not solve it.

The successful approach was to use the request function already loaded by the METRC page. A jQuery `$.ajax()` request made from the page context returned the expected JSON. That difference shaped the architecture of the final tool. The extension would not create its own independent connection to METRC. It would inject a controlled extraction function into the active METRC page and use the page's existing authenticated request mechanism.

This distinction matters. The tool does not contain a METRC username, password, API key, cookie, or session token. It works only while an authorized user is already logged into Michigan METRC and deliberately starts the extraction from that tab.

## Testing in layers

We did not begin with all 1,289 deliveries.

The first successful response was inspected field by field. We confirmed that each returned row represented the tag-level transaction information visible when the delivery was expanded. Next, we tested three deliveries. That run returned 11 tag rows, and the package counts and totals matched the interface.

We then tested a 25-delivery population. The result contained 78 tag rows, zero request errors, and a total of $1,102.52—the same total shown by the summarized source population. Only after those control tests passed did we run the entire CSV.

That progression was important. Automation can reproduce a mistake much faster than a person can. The single-record and small-population tests established that we had identified the correct request, mapped delivery IDs correctly, followed pagination, and preserved the fields necessary for reconciliation.

## Turning the console procedure into an application

The Developer Tools procedure proved the concept, but it was not an acceptable recurring workflow. It required copying code into the Console, responding to Chrome's paste warning, and managing a script that an ordinary operator could not reasonably be expected to audit each time.

The solution was a private Chrome extension using Manifest V3. Its interface asks the operator to select the summarized Sales Deliveries CSV. The file remains local to the browser. The extension identifies unique ten-digit delivery values from the first column and displays the count before allowing the run to begin.

When the operator clicks the extraction button, the extension verifies that the active tab is Michigan METRC. It then starts the page-context retrieval process and displays a progress panel showing completed deliveries, tag rows, and errors.

Each delivery is processed sequentially. The extension requests 20 records at a time, reads the number of available pages, and continues until the delivery is complete. If a page request fails, the tool retries it up to three times with increasing delays. A short pause between deliveries reduces unnecessary pressure on the application.

At completion, the extension downloads a timestamped UTF-8 CSV. Every returned field is preserved, and every row receives the original zero-padded delivery number. If any delivery remains unsuccessful after the retries, the extension downloads a second CSV listing the errors. Successful records are not discarded merely because a small number require follow-up.

## Controls built around the automation

The extension solves the mechanical problem, but it does not eliminate the need for controls.

The summarized METRC export remains the control population. The operator must preserve it, confirm the reporting period and license, and compare its delivery count with the count recognized by the extension. The completed output must be reviewed for error records, zero-padded delivery numbers, package labels, and selected totals. A run with unresolved errors is not complete.

The technical permissions are also narrow. The extension receives temporary access to the active tab and can execute code only after the operator invokes it. Host access is restricted to the Michigan METRC domain. The code contains no analytics and no external destination for the extracted data.

Most importantly, the code makes only the identified read request. It does not call endpoints that create, update, adjust, submit, void, or delete METRC records.

## What this project is—and is not

This is not a METRC Connect integration. It relies on an internal route used by the Michigan METRC web interface. That makes the tool useful, but it also creates a maintenance obligation. METRC can change the route, request format, page libraries, or response structure without treating the change as a public API revision.

Accordingly, the extension should be viewed as a controlled internal tool rather than a permanent interface contract. A material METRC change should trigger the same validation sequence used during development: one delivery, then a small known population, then a full run only after counts and totals agree.

An official METRC Connect integration may eventually provide a more durable architecture. It requires an integrator/vendor credential plus a client user API key and remains limited to the endpoints METRC exposes for the applicable state. Enrollment therefore does not necessarily mean that this exact delivery transaction detail will be available through the official API. That question must be tested separately.

## The larger lesson

The most interesting part of this project is not the amount of JavaScript involved. It is the relationship between a compliance system's interface and the data already moving beneath it.

A report can be technically available and still be operationally inaccessible. METRC exposed the tag detail to the user, but the one-delivery-at-a-time design prevented the information from functioning as a practical bulk reconciliation source. By observing the application's existing request, validating the response, and wrapping the process in a narrow operator-controlled tool, we converted a manual browsing task into a repeatable export.

The result is modest by design: choose the source CSV, confirm the population, start the run, and preserve the output. But that modest tool changes what is possible at the compliance layer. Tag-level delivery activity can now be reviewed as a population rather than as 1,289 separate clicks.

That is often where useful accounting technology begins—not with a grand platform, but with one stubborn control problem that should not require a person to click the same arrow a thousand times.

---

*This independent project is not affiliated with, endorsed by, or supported by METRC. Use is limited to authorized users and facilities. Organizations should review applicable terms, regulatory requirements, and information-security policies before deployment.*
