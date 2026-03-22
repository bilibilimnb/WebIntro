const lineMapping = {
    'drive.awa486.top': {
        name: 'SakuraFrp',
        url: 'https://drive.awa486.top'
    },
    'v6.awa486.top': {
        name: '中国大陆IPv6',
        url: 'https://v6.awa486.top:10721'
    }
};

async function fetchAndUpdateLines() {
    const container = document.getElementById('lineStatusList');
    if (!container) return;

    try {
        const res = await fetch('https://status.awa486.top/status');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const lines = data.filter(site => lineMapping[site.name]);
        if (lines.length === 0) {
            container.innerHTML = '<div style="color:#6f8fae; text-align:center; padding:0.5rem;">暂无线路状态数据</div>';
            return;
        }

        const linesHtml = lines.map(site => {
            const online = site.online === true;
            const statusClass = online ? 'online' : 'offline';
            const statusText = online ? '在线' : '离线';
            const rt = site.responseTime !== undefined ? `${site.responseTime}ms` : '—';
            const line = lineMapping[site.name];
            return `
                <div class="line-item">
                    <div class="line-name">
                        <span class="line-dot ${statusClass}"></span>
                        <span class="line-status-text ${statusClass === 'online' ? 'line-online' : 'line-offline'}">${line.name}</span>
                    </div>
                    <div class="line-time">
                        ${statusText} · ${rt}
                    </div>
                    <a href="${line.url}" target="_blank" style="font-size:0.7rem; color:#2c6e9e; text-decoration:none;">访问 →</a>
                </div>
            `;
        }).join('');

        container.innerHTML = linesHtml;
    } catch (err) {
        console.error('获取线路状态失败:', err);
        container.innerHTML = '<div style="color:#b84c3c; text-align:center; padding:0.5rem;">状态服务暂不可用</div>';
    }
}

// 导出到全局，以便 index.html 可以主动调用
window.fetchAndUpdateLines = fetchAndUpdateLines;

// 页面加载后自动执行一次（当 DOM 包含 #lineStatusList 时）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        fetchAndUpdateLines();
        setInterval(fetchAndUpdateLines, 60000);
    });
} else {
    fetchAndUpdateLines();
    setInterval(fetchAndUpdateLines, 60000);
}