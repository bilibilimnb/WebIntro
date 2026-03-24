const API_BASE = 'https://api.awa486.top';   // 新 API 底座

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

let ipv6Supported = null;

async function fetchAndUpdateLines() {
    const container = document.getElementById('lineStatusList');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/status`);
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

            let linkHtml;
            if (site.name === 'v6.awa486.top') {
                if (ipv6Supported === false) {
                    linkHtml = `<span style="font-size:0.7rem; color:#aaa; text-decoration:none;">访问 →</span>`;
                } else {
                    linkHtml = `<a href="${line.url}" target="_blank" style="font-size:0.7rem; color:#2c6e9e; text-decoration:none;">访问 →</a>`;
                }
            } else {
                linkHtml = `<a href="${line.url}" target="_blank" style="font-size:0.7rem; color:#2c6e9e; text-decoration:none;">访问 →</a>`;
            }

            return `
                <div class="line-item">
                    <div class="line-name">
                        <span class="line-dot ${statusClass}"></span>
                        <span class="line-status-text ${statusClass === 'online' ? 'line-online' : 'line-offline'}">${line.name}</span>
                    </div>
                    <div class="line-time">
                        ${statusText} · ${rt}
                    </div>
                    ${linkHtml}
                </div>
            `;
        }).join('');

        container.innerHTML = linesHtml;
    } catch (err) {
        console.error('获取线路状态失败:', err);
        container.innerHTML = '<div style="color:#b84c3c; text-align:center; padding:0.5rem;">状态服务暂不可用</div>';
    }
}

function checkIPv6Support() {
    const dot = document.querySelector('#ipv6-status .ipv6-dot');
    const textSpan = document.getElementById('ipv6-text');
    if (!dot || !textSpan) return;

    const testUrl = 'http://[240e:97c:2f:1::68]:80/';

    fetch(testUrl, { mode: 'no-cors' })
        .then(() => {
            ipv6Supported = true;
            dot.style.backgroundColor = '#2c9c6e';
            textSpan.innerHTML = '✅ IPv6 网络可达';
            const existingTip = textSpan.parentNode.querySelector('.ipv6-tip');
            if (existingTip) existingTip.remove();
        })
        .catch((err) => {
            console.warn('IPv6 检测失败:', err);
            ipv6Supported = false;
            dot.style.backgroundColor = '#c25a4a';
            textSpan.innerHTML = '❌ 您当前环境不支持 IPv6 网站访问';

            let tipSpan = textSpan.parentNode.querySelector('.ipv6-tip');
            if (!tipSpan) {
                tipSpan = document.createElement('span');
                tipSpan.style.display = 'block';
                tipSpan.style.color = '#e68a2e';
                tipSpan.style.fontSize = '0.7rem';
                tipSpan.style.marginTop = '0.2rem';
                tipSpan.innerText = '您当前环境不支持 IPv6 网站访问';
                tipSpan.className = 'ipv6-tip';
                textSpan.parentNode.appendChild(tipSpan);
            }
        })
        .finally(() => {
            fetchAndUpdateLines();
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        checkIPv6Support();
        setInterval(fetchAndUpdateLines, 60000);
    });
} else {
    checkIPv6Support();
    setInterval(fetchAndUpdateLines, 60000);
}

window.fetchAndUpdateLines = fetchAndUpdateLines;