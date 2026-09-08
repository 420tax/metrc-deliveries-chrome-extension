# Operator Guide: METRC Sales Deliveries Tag Export

## Purpose

Use this procedure to convert a summarized Michigan METRC Sales Deliveries CSV into a consolidated tag-level detail CSV. The extension retrieves information only; it does not change METRC records.

## Before you begin

- Confirm that you are authorized to access the license and its delivery records.
- Use Google Chrome.
- Keep the extension folder in a permanent location after installation.
- Create a dedicated work folder for the source report and output files.

## Part 1 — Install the extension

1. Extract the extension ZIP file.
2. Open Chrome.
3. Enter `chrome://extensions` in the address bar and press Enter.
4. Turn on **Developer mode** in the upper-right corner.
5. Click **Load unpacked**.
6. Select the extracted `flint-flower-life-metrc-extension` folder—the folder containing `manifest.json`.
7. Confirm that Chrome displays **Flint Flower Life METRC Tag Export** and that its switch is enabled.
8. Open Chrome's Extensions menu using the puzzle-piece icon.
9. Pin **Flint Flower Life METRC Tag Export** to the toolbar.

## Part 2 — Prepare the METRC source population

1. Log into Michigan METRC with your own authorized account.
2. Select Flint Flower Life's correct adult-use license.
3. Open **Sales > Sales Deliveries > Inactive**.
4. Apply the intended reporting period or other filters.
5. Review the visible population before exporting.
6. Download the summarized Sales Deliveries report.
7. Preserve the original downloaded report unchanged.
8. If the report opens in Excel, save a working copy as **CSV UTF-8 (Comma delimited) (*.csv)**.
9. Confirm that the working filename ends in `.csv`, not `.csv.xlsx`.

## Part 3 — Run the tag-detail extraction

1. Return to the open Michigan METRC tab.
2. Click the pinned extension button.
3. Click **Choose CSV file**.
4. Select the prepared Sales Deliveries CSV.
5. Confirm that the displayed delivery count agrees with the source report.
6. If the count is wrong, stop and correct the source file.
7. Click **Extract all tag detail** once.
8. Confirm that a progress panel appears in the lower-right corner of METRC.
9. Leave the METRC tab open. Do not reload it, close it, or navigate away.
10. Wait until the panel reports **Extraction complete** or **Completed with errors**.

## Part 4 — Preserve and validate the output

1. Locate the downloaded `Flint_Flower_Life_METRC_Tag_Detail_...csv` file.
2. If an error file was created, preserve it with the detail file.
3. Move the source report, detail CSV, and error CSV into the engagement's controlled storage location.
4. Record the run date, source reporting period, source delivery count, tag-row count, and error count.
5. Confirm that the output contains the zero-padded `Delivery` field and `PackageLabel` values.
6. Compare delivery counts and selected totals to the summarized source report.
7. Do not treat a run with unresolved errors as complete.

## Error recovery

If the extension creates an error CSV:

1. Do not discard the successful detail CSV.
2. Review the failed delivery numbers in the error CSV.
3. Create a small CSV containing those delivery records in the same source-report format.
4. Confirm that you remain logged into the correct METRC license.
5. Run the extension using the small retry CSV.
6. Preserve the retry output and document how it was combined with the original run.

## Troubleshooting

**Active tab is not Michigan METRC**  
Return to the `mi.metrc.com` tab and reopen the extension.

**No 10-digit Delivery values were found**  
Confirm that the file is a genuine CSV and that Delivery is the first column.

**METRC's page request function was not found**  
Reload METRC, return to Sales Deliveries, and retry.

**An extraction is already running**  
Wait for the existing progress panel to finish. Do not start a second run.

**Chrome blocks a second download**  
Allow multiple downloads from `mi.metrc.com`; this is normally relevant only when an error CSV must also be saved.

## Control checklist

- [ ] Correct METRC user and license confirmed.
- [ ] Reporting period and source population confirmed.
- [ ] Original summary export preserved.
- [ ] Extension delivery count agrees with the source.
- [ ] Run completed without unresolved errors.
- [ ] Detail output and any error/retry output preserved.
- [ ] Delivery count, tag-row count, and selected totals validated.
- [ ] Files moved to controlled engagement storage.

## Important limitation

This extension uses an internal METRC web route rather than METRC Connect. A METRC interface change may interrupt it. If results change unexpectedly, stop using the tool and perform the one-delivery and small-population validation tests before resuming production use.
