document.addEventListener('DOMContentLoaded', async () => {
    const resultsDiv = document.getElementById('results');
    const scanBtn = document.getElementById('scan-btn');
    const stopBtn = document.getElementById('stop-btn');
    const copyBtn = document.getElementById('copy-btn');
    const statusMsg = document.getElementById('status-msg');

    let detectedId = null;
    let detectedName = "";

    const updateUI = () => {
        chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
            if (chrome.runtime.lastError || !response) return;

            if (response.isScanning) {
                scanBtn.style.display = 'none';
                stopBtn.style.display = 'block';
                statusMsg.innerText = response.status;
                const percent = Math.round((response.progress.current / response.progress.total) * 100) || 0;
                resultsDiv.innerHTML = `<div style="width:100%; background:#ddd; height:8px; border-radius:4px;"><div style="width:${percent}%; background:#0056b3; height:8px; border-radius:4px; transition: width 0.3s;"></div></div><p style="font-size:12px;">Found ${response.scanResults.length} matches in ${response.progress.current} cities...</p>`;
            } else {
                stopBtn.style.display = 'none';
                scanBtn.style.display = 'block';

                const isNewProduct = detectedId && (detectedId !== response.currentProductId);

                if (isNewProduct) {
                    statusMsg.innerHTML = `<div style="color:#e67e22; font-weight:bold;">New Product:</div>${detectedName} (${detectedId})`;
                    scanBtn.innerText = `SCAN NEW PRODUCT`;
                    scanBtn.disabled = false;
                } else if (response.status !== "Idle") {
                    statusMsg.innerText = response.status;
                    scanBtn.innerText = `RE-SCAN PRODUCT`;
                    scanBtn.disabled = false;
                }

                if (response.status !== "Idle") {
                    renderFinalSummary(response);
                    if (response.scanResults.length > 0) copyBtn.style.display = 'block';
                }
            }
        });
    };

    function renderFinalSummary(response) {
        let html = `<div class="summary-box">
            <div style="font-size:10px; color:#666; margin-bottom:4px;">RESULTS FOR:</div>
            <strong>${response.currentProductName}</strong> (ID: ${response.currentProductId})<br>
            <hr style="border:0; border-top:1px solid #b3d7ff; margin:5px 0;">
            Checked ${response.progress.current} cities, ${response.progress.shops} stores.
            <ul style="margin:5px 0; padding-left:15px; font-size:11px; color:#555;">`;
        
        Object.entries(response.statusCounts).sort((a,b)=>b[1]-a[1]).forEach(([code, count]) => {
            html += `<li>${code}: ${count}</li>`;
        });
        html += `</ul></div>`;

        if (response.scanResults.length > 0) {
            let lastCity = "";
            response.scanResults.forEach(res => {
                if (res.city !== lastCity) { html += `<div class="city-header">${res.city}</div>`; lastCity = res.city; }
                const q = encodeURIComponent(`RTV EURO AGD ${res.name} ${res.addr}`);
                html += `<div class="shop-entry"><strong>[${res.code}] ${res.name}</strong><br><small>${res.addr}</small><br><span class="avail-status">${res.status}</span><br><a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" class="maps-link">MAPS: Open in new tab</a></div>`;
            });
        }
        resultsDiv.innerHTML = html;
    }

    // Immediate Scraper
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url.includes("euro.com.pl")) {
        try {
            const scraper = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const span = document.querySelector('span[data-aut-id="product-plu"]');
                    const id = span ? span.innerText.replace(/\D/g, "") : null;
                    const h1 = document.querySelector('h1');
                    const name = h1 ? h1.innerText.trim() : document.title.split(' - ')[0];
                    return { id, name };
                }
            });
            detectedId = scraper[0]?.result?.id;
            detectedName = scraper[0]?.result?.name;
        } catch (e) {}
    }

    scanBtn.onclick = () => { if(detectedId) chrome.runtime.sendMessage({ action: "startScan", productId: detectedId, productName: detectedName }); };
    stopBtn.onclick = () => chrome.runtime.sendMessage({ action: "stopScan" });
    
    copyBtn.onclick = () => {
        chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
            let text = `Stock Report: ${response.currentProductName} (ID: ${response.currentProductId})\n\n`;
            response.scanResults.forEach(res => {
                text += `[${res.code}] ${res.city}: ${res.name}\n${res.addr}\nStatus: ${res.status}\n\n`;
            });
            navigator.clipboard.writeText(text).then(() => {
                const oldText = copyBtn.innerText;
                copyBtn.innerText = "COPIED!";
                setTimeout(() => copyBtn.innerText = oldText, 2000);
            });
        });
    };

    setInterval(updateUI, 1000);
    updateUI();
});