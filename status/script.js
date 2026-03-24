// API 底座地址
const WORKER_BASE = 'https://api.awa486.top';

let autoRefreshTimer = null;
let rtChart = null;
let onlineChart = null;

async function fetchStatus() {
    const container = document.getElementById('statusContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading">更新中…</div>';

    try {
        const response = await fetch(`${WORKER_BASE}/status`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div class="error">暂无监控数据，请检查 Worker 配置</div>';
            return;
        }
        renderStatusList(data);
    } catch (err) {
        console.error('获取状态失败:', err);
        container.innerHTML = `<div class="error">⚠️ 加载失败：${err.message}<br>请确认 Worker 地址正确且支持 CORS</div>`;
    }
}

async function fetchHistory() {
    try {
        const response = await fetch(`${WORKER_BASE}/history`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const history = await response.json();
        updateCharts(history);
        const chartSection = document.getElementById('chartSection');
        if (chartSection) chartSection.style.display = 'block';
    } catch (err) {
        console.error('获取历史数据失败:', err);
        const chartSection = document.getElementById('chartSection');
        if (chartSection) chartSection.style.display = 'none';
    }
}

function renderStatusList(sites) {
    const container = document.getElementById('statusContainer');
    if (!container) return;

    const html = sites.map(site => {
        const isOnline = site.online === true;
        const statusClass = isOnline ? 'online' : 'offline';
        const statusText = isOnline ? '在线' : '离线';
        const rt = site.responseTime !== undefined ? `${site.responseTime}ms` : '—';
        let lastCheckedFormatted = '—';
        if (site.lastChecked) {
            try {
                const date = new Date(site.lastChecked);
                lastCheckedFormatted = date.toLocaleString('zh-CN', { hour12: false });
            } catch (e) { lastCheckedFormatted = site.lastChecked; }
        }

        return `
            <div class="status-item ${statusClass}">
                <div class="site-info">
                    <div class="site-name">${escapeHtml(site.name)}</div>
                    <div class="site-url">${escapeHtml(site.url)}</div>
                </div>
                <div class="status-badge">
                    <span class="dot"></span>
                    <span class="status-text">${statusText}</span>
                    <span class="response-time">⏱️ ${rt}</span>
                </div>
                <div class="last-check">📅 ${lastCheckedFormatted}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function updateCharts(history) {
    const siteNames = Object.keys(history);
    if (siteNames.length === 0) return;

    // 收集所有时间戳
    let allTimestamps = [];
    for (const name of siteNames) {
        const points = history[name];
        points.forEach(p => allTimestamps.push(p.ts));
    }
    allTimestamps = [...new Set(allTimestamps)].sort();

    const rtDatasets = [];
    const onlineDatasets = [];
    const colorPalette = ['#2c6e9e', '#5f9e6e', '#c97e5a', '#9b6a8c', '#4f8a8b', '#e2a56f'];

    for (let i = 0; i < siteNames.length; i++) {
        const name = siteNames[i];
        const points = history[name];
        const rtMap = {};
        const onlineMap = {};
        points.forEach(p => {
            rtMap[p.ts] = p.rt;
            onlineMap[p.ts] = p.online ? 1 : 0;
        });

        const rtData = allTimestamps.map(ts => rtMap[ts] !== undefined ? rtMap[ts] : null);
        const onlineData = allTimestamps.map(ts => onlineMap[ts] !== undefined ? onlineMap[ts] : null);
        const color = colorPalette[i % colorPalette.length];

        rtDatasets.push({
            label: name,
            data: rtData,
            borderColor: color,
            backgroundColor: 'transparent',
            tension: 0.2,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5,
        });

        onlineDatasets.push({
            label: name,
            data: onlineData,
            borderColor: color,
            backgroundColor: color + '30',
            tension: 0.1,
            fill: true,
            pointRadius: 1,
            stepped: true,
        });
    }

    const labels = allTimestamps.map(ts => {
        const d = new Date(ts);
        return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    });

    // 响应时间图表
    if (rtChart) rtChart.destroy();
    const rtCtx = document.getElementById('rtChart').getContext('2d');
    rtChart = new Chart(rtCtx, {
        type: 'line',
        data: { labels, datasets: rtDatasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'top' },
            },
            scales: {
                y: { title: { display: true, text: '响应时间 (ms)' }, beginAtZero: true },
                x: { title: { display: true, text: '时间' }, ticks: { maxRotation: 45, autoSkip: true } }
            }
        }
    });

    // 在线率图表
    if (onlineChart) onlineChart.destroy();
    const onlineCtx = document.getElementById('onlineChart').getContext('2d');
    onlineChart = new Chart(onlineCtx, {
        type: 'line',
        data: { labels, datasets: onlineDatasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw === 1 ? '在线' : '离线'}` } },
                legend: { position: 'top' },
            },
            scales: {
                y: { title: { display: true, text: '在线状态' }, min: -0.1, max: 1.1, ticks: { stepSize: 1, callback: (val) => val === 1 ? '在线' : val === 0 ? '离线' : '' } },
                x: { title: { display: true, text: '时间' }, ticks: { maxRotation: 45, autoSkip: true } }
            }
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function refreshAll() {
    await fetchStatus();
    await fetchHistory();
}

function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(refreshAll, 60000);
}

function bindManualRefresh() {
    const btn = document.getElementById('manualRefresh');
    if (btn) btn.addEventListener('click', refreshAll);
}

refreshAll();
startAutoRefresh();
bindManualRefresh();