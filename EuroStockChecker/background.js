let scanResults = [];
let isScanning = false;
let currentProductId = null;
let currentProductName = "";
let status = "Idle";
let statusCounts = {};
let progress = { current: 0, total: 0, shops: 0 };

const positiveStatuses = ["AVAILABLE", "RESERVE_AND_COLLECT", "RESERVATION_FOR_TOMORROW", "AVAILABLE_LOCALLY_IN_SHOP", "RESERVATION_FOR_GIVEN_DATE"];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startScan") {
        startScanning(request.productId, request.productName);
        sendResponse({ started: true });
    } else if (request.action === "stopScan") {
        isScanning = false;
        sendResponse({ stopped: true });
    } else if (request.action === "getStatus") {
        sendResponse({ isScanning, scanResults, status, currentProductId, currentProductName, statusCounts, progress });
    }
    return false; 
});

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i <= retries; i++) {
        try {
            const r = await fetch(url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            if (Array.isArray(data)) return data;
            return []; // Return empty array if data is null/undefined but not an error
        } catch (e) {
            if (i === retries) throw e;
            await new Promise(res => setTimeout(res, 500 * (i + 1))); 
        }
    }
}

async function startScanning(productId, productName) {
    if (isScanning) return;
    isScanning = true;
    currentProductId = productId;
    currentProductName = productName;
    scanResults = [];
    statusCounts = {};
    progress = { current: 0, total: 0, shops: 0 };
    
    status = "Fetching directory...";
    try {
        const shopDirResp = await fetch("https://www.euro.com.pl/rest/api/shops");
        const shopData = await shopDirResp.json();
        const shopMap = {};
        const citySet = new Set();
        shopData.forEach(s => {
            shopMap[s.shopCode] = { name: s.name, addr: `${s.city}, ${s.street} ${s.houseNumber}` };
            if (s.city) citySet.add(s.city);
        });

        const dynamicCities = Array.from(citySet).sort();
        progress.total = dynamicCities.length;

        let concurrency = 10; // Start at 10
        let i = 0;
        
        while (i < dynamicCities.length && isScanning) {
            const batch = dynamicCities.slice(i, i + concurrency);
            status = `Scanning: ${i + 1}-${Math.min(i + concurrency, progress.total)} (Speed: ${concurrency})`;

            let batchErrors = 0;

            await Promise.all(batch.map(async (city) => {
                try {
                    const url = `https://www.euro.com.pl/rest/api/products/${productId}/shops?areaName=${encodeURIComponent(city)}`;
                    const data = await fetchWithRetry(url);
                    
                    if (data.length > 0) {
                        progress.shops += data.length;
                        data.forEach(s => {
                            const avail = s.productAvailability;
                            statusCounts[avail] = (statusCounts[avail] || 0) + 1;
                            if (positiveStatuses.includes(avail)) {
                                const info = shopMap[s.shopCode] || { name: `Shop ${s.shopCode}`, addr: "" };
                                scanResults.push({ city, code: s.shopCode, name: info.name, addr: info.addr, status: avail });
                            }
                        });
                    }
                } catch (e) {
                    batchErrors++;
                    statusCounts["NETWORK_ERROR"] = (statusCounts["NETWORK_ERROR"] || 0) + 1;
                }
            }));

            // ADAPTIVE LOGIC: If we hit errors in this batch, slow down for the next one
            if (batchErrors > 0 && concurrency > 5) {
                concurrency--; 
            } else if (batchErrors === 0 && concurrency < 10) {
                // If perfect batch, we can try to speed back up slowly
                concurrency = Math.min(10, concurrency + 1);
            }

            i += batch.length;
            progress.current = i;
            await new Promise(r => setTimeout(r, 300));
        }
    } catch (e) { status = "Error: API unreachable"; }
    
    status = isScanning ? "Scan Complete" : "Stopped";
    isScanning = false;
}