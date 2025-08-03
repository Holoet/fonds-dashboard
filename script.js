const fonds = [
    { name: "MSCI WLD", isin: "IE00B4L5Y983", ticker: "IWDA.AS", shares: 431.1152 },
    { name: "VANECKETFSDFNS ADLA", isin: "IE000YYE6WK5", ticker: "ADLA.AS", shares: 5.0485 },
    { name: "ISHS IV-AUTO.+ROBOTIC.ETF", isin: "IE00BYZK4552", ticker: "2B76.DE", shares: 18.997 }
];

function getStoredShares(isin) {
    const stored = localStorage.getItem(isin);
    return stored ? parseFloat(stored) : null;
}

function saveShares(isin, value) {
    localStorage.setItem(isin, value);
}

function fetchData(ticker) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1mo&interval=1d`;
    return fetch(url).then(res => res.json());
}

function calculateLinearForecast(data) {
    const prices = data.map(d => d.close).filter(p => p);
    const days = prices.map((_, i) => i);
    const n = prices.length;
    const sumX = days.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = days.reduce((sum, x, i) => sum + x * prices[i], 0);
    const sumX2 = days.reduce((sum, x) => sum + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return slope * (n + 30) + intercept;
}

function renderFonds() {
    const container = document.getElementById("fonds-container");
    fonds.forEach(fond => {
        const div = document.createElement("div");
        div.className = "fonds";
        div.innerHTML = `<h2>${fond.name}</h2>
            <p>ISIN: ${fond.isin}</p>
            <label>Stückzahl: <input type="number" id="shares-${fond.isin}" value="${getStoredShares(fond.isin) || fond.shares}" step="0.0001"></label>
            <div id="data-${fond.isin}">Lade Kursdaten...</div>`;
        container.appendChild(div);

        document.getElementById(`shares-${fond.isin}`).addEventListener("change", e => {
            saveShares(fond.isin, e.target.value);
            updateData(fond);
        });

        updateData(fond);
    });
}

function updateData(fond) {
    const shares = parseFloat(document.getElementById(`shares-${fond.isin}`).value);
    fetchData(fond.ticker).then(json => {
        const result = json.chart.result[0];
        const closes = result.indicators.quote[0].close;
        const today = closes[closes.length - 1];
        const weekAgo = closes[closes.length - 5];
        const monthAgo = closes[0];
        const forecast = calculateLinearForecast(closes.map((c, i) => ({ day: i, close: c })));

        const changeWeek = today - weekAgo;
        const changeMonth = today - monthAgo;

        const html = `
            <p>Kurs heute: ${today.toFixed(2)} €</p>
            <p>Kurs vor 1 Woche: ${weekAgo.toFixed(2)} €</p>
            <p>Kurs vor 1 Monat: ${monthAgo.toFixed(2)} €</p>
            <p>Prognose nächster Monat: ${forecast.toFixed(2)} €</p>
            <p>Veränderung Woche: ${changeWeek.toFixed(2)} € (${(changeWeek / weekAgo * 100).toFixed(2)}%)</p>
            <p>Veränderung Monat: ${changeMonth.toFixed(2)} € (${(changeMonth / monthAgo * 100).toFixed(2)}%)</p>
            <p>Wert deiner Position: ${(today * shares).toFixed(2)} €</p>
        `;
        document.getElementById(`data-${fond.isin}`).innerHTML = html;
    });
}

renderFonds();
