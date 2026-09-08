const fileInput = document.getElementById('sourceFile');
const startButton = document.getElementById('start');
const selection = document.getElementById('selection');
const status = document.getElementById('status');

let selectedDeliveries = [];
let selectedFileName = '';

fileInput.addEventListener('change', async () => {
  status.textContent = '';
  status.className = 'status';
  startButton.disabled = true;
  selectedDeliveries = [];

  const file = fileInput.files && fileInput.files[0];
  if (!file) {
    selection.textContent = 'No file selected';
    return;
  }

  selectedFileName = file.name;
  if (!file.name.toLowerCase().endsWith('.csv')) {
    selection.textContent = file.name;
    showError('Select a file whose name ends in .csv.');
    return;
  }

  try {
    const text = await file.text();
    selectedDeliveries = [...new Set(text.match(/^\d{10}(?=,)/gm) || [])];

    if (!selectedDeliveries.length) {
      selection.textContent = file.name;
      showError('No 10-digit Delivery values were found at the start of CSV records.');
      return;
    }

    selection.textContent = `${file.name} — ${selectedDeliveries.length.toLocaleString()} deliveries`;
    startButton.disabled = false;
  } catch (error) {
    showError(`The CSV could not be read: ${error.message}`);
  }
});

startButton.addEventListener('click', async () => {
  startButton.disabled = true;
  fileInput.disabled = true;
  status.className = 'status';
  status.textContent = 'Starting extraction in the METRC tab…';

  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith('https://mi.metrc.com/')) {
      throw new Error('The active tab is not Michigan METRC.');
    }

    const result = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      world: 'MAIN',
      func: runMetrcTagExtraction,
      args: [selectedDeliveries, selectedFileName]
    });

    const outcome = result && result[0] && result[0].result;
    if (!outcome || !outcome.started) {
      throw new Error(outcome && outcome.message ? outcome.message : 'The extraction did not start.');
    }

    status.className = 'status success';
    status.textContent = 'Extraction started. Watch the progress panel in METRC.';
  } catch (error) {
    showError(error.message || String(error));
    startButton.disabled = false;
    fileInput.disabled = false;
  }
});

function showError(message) {
  status.className = 'status error';
  status.textContent = message;
}

function runMetrcTagExtraction(deliveries, sourceFileName) {
  if (window.metrcBulkRunning) {
    return {started: false, message: 'A METRC extraction is already running in this tab.'};
  }

  const jq = window.jQuery || window.$;
  if (!jq || typeof jq.ajax !== 'function') {
    return {started: false, message: 'METRC’s page request function was not found. Reload METRC and try again.'};
  }

  if (!Array.isArray(deliveries) || !deliveries.length) {
    return {started: false, message: 'No deliveries were supplied.'};
  }

  window.metrcBulkRunning = true;

  const existing = document.getElementById('ffl-metrc-export-progress');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'ffl-metrc-export-progress';
  Object.assign(panel.style, {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    width: '360px',
    padding: '18px',
    zIndex: '2147483647',
    border: '1px solid #87a497',
    borderRadius: '10px',
    boxShadow: '0 8px 30px rgba(0,0,0,.25)',
    background: '#ffffff',
    color: '#13231d',
    fontFamily: 'Arial, sans-serif',
    fontSize: '13px',
    lineHeight: '1.4'
  });

  const title = document.createElement('div');
  title.textContent = 'Flint Flower Life — METRC Tag Export';
  Object.assign(title.style, {fontWeight: '700', fontSize: '15px', marginBottom: '10px'});

  const progress = document.createElement('div');
  progress.textContent = `Starting ${deliveries.length.toLocaleString()} deliveries…`;

  const detail = document.createElement('div');
  detail.textContent = `Source: ${sourceFileName}`;
  Object.assign(detail.style, {marginTop: '7px', color: '#52635b', fontSize: '11px', overflowWrap: 'anywhere'});

  panel.append(title, progress, detail);
  document.body.appendChild(panel);

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const stamp = () => {
    const d = new Date();
    const pad = value => String(value).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  };

  const downloadCsv = (rows, filename) => {
    if (!rows.length) return;
    const columns = [...new Set(rows.flatMap(Object.keys))];
    const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = '\uFEFF' + [
      columns.map(quote).join(','),
      ...rows.map(row => columns.map(column => quote(row[column])).join(','))
    ].join('\r\n');
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
  };

  const requestPage = async (id, page) => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await jq.ajax({
          url: `/api/sales/deliveries/transactions?id=${id}&includeHistory=true`,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            request: {
              take: 20,
              skip: (page - 1) * 20,
              page,
              pageSize: 20,
              group: []
            }
          })
        });
      } catch (error) {
        if (attempt === 3) throw error;
        progress.textContent = `Retry ${attempt}/3 — Delivery ${id}, page ${page}`;
        await sleep(attempt * 2000);
      }
    }
  };

  (async () => {
    const rows = [];
    const errors = [];
    const startedAt = new Date().toISOString();
    const fileStamp = stamp();

    try {
      for (let index = 0; index < deliveries.length; index += 1) {
        const delivery = deliveries[index];
        const id = String(Number(delivery));

        try {
          let page = 1;
          let totalPages = 1;
          do {
            const response = await requestPage(id, page);
            const data = Array.isArray(response.Data) ? response.Data : [];
            rows.push(...data.map(record => ({...record, Delivery: delivery})));
            totalPages = Number(response.TotalPages) || 1;
            page += 1;
          } while (page <= totalPages);
        } catch (error) {
          errors.push({
            Delivery: delivery,
            Status: error && error.status ? error.status : 'Error',
            Message: error && error.statusText ? error.statusText : 'Request failed'
          });
        }

        const completed = index + 1;
        progress.textContent = `${completed.toLocaleString()} / ${deliveries.length.toLocaleString()} deliveries • ${rows.length.toLocaleString()} tag rows • ${errors.length} errors`;
        await sleep(200);
      }

      window.metrcFullRows = rows;
      window.metrcFullErrors = errors;
      window.metrcFullRun = {
        sourceFileName,
        startedAt,
        finishedAt: new Date().toISOString(),
        deliveryCount: deliveries.length,
        tagRowCount: rows.length,
        errorCount: errors.length
      };

      downloadCsv(rows, `Flint_Flower_Life_METRC_Tag_Detail_${fileStamp}.csv`);
      if (errors.length) {
        await sleep(750);
        downloadCsv(errors, `Flint_Flower_Life_METRC_Tag_Errors_${fileStamp}.csv`);
      }

      panel.style.borderColor = errors.length ? '#b98518' : '#28805b';
      panel.style.background = errors.length ? '#fff8e7' : '#eef9f3';
      title.textContent = errors.length ? 'Completed with errors' : 'Extraction complete';
      progress.textContent = `${deliveries.length.toLocaleString()} deliveries • ${rows.length.toLocaleString()} tag rows • ${errors.length} errors`;
      detail.textContent = errors.length
        ? 'The detail CSV and a separate error CSV were downloaded.'
        : 'The full tag-detail CSV was downloaded.';
    } catch (error) {
      panel.style.borderColor = '#b33a3a';
      panel.style.background = '#fff0f0';
      title.textContent = 'Extraction stopped';
      progress.textContent = error && error.message ? error.message : String(error);
      detail.textContent = 'No METRC records were changed. Reload the page before trying again.';
    } finally {
      window.metrcBulkRunning = false;
    }
  })();

  return {started: true};
}
