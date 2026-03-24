async function loadMessages() {
    const container = document.getElementById('messages-list');
    if (!container) return;
    try {
        const res = await fetch(`${window.API_BASE}/messages`);
        if (!res.ok) throw new Error('加载失败');
        const messages = await res.json();
        if (!messages.length) {
            container.innerHTML = '<div style="color:#6f8fae; text-align:center; padding:1rem;">暂无留言，抢个沙发吧～</div>';
            return;
        }
        const html = messages.map(msg => `
            <div style="border-bottom: 1px solid #eef2f6; padding: 0.8rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <strong style="color: #1f2a44;">${escapeHtml(msg.name)}</strong>
                    <span style="font-size: 0.7rem; color: #8aa2be;">${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div style="color: #4a5a72; margin-top: 0.3rem;">${escapeHtml(msg.content)}</div>
            </div>
        `).join('');
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="color:#b84c3c; text-align:center; padding:1rem;">留言加载失败，请稍后刷新</div>';
    }
}

async function submitMessage() {
    const nameInput = document.getElementById('msg-name');
    const contentInput = document.getElementById('msg-content');
    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    if (!name || !content) {
        alert('请填写昵称和留言内容');
        return;
    }
    if (name.length > 20 || content.length > 5000) {
        alert('昵称最多20字，留言最多5000字');
        return;
    }
    const btn = document.getElementById('submit-msg');
    btn.disabled = true;
    btn.innerText = '发送中…';
    try {
        const res = await fetch(`${window.API_BASE}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, content }),
        });
        if (!res.ok) throw new Error('提交失败');
        nameInput.value = '';
        contentInput.value = '';
        await loadMessages();
    } catch (err) {
        alert('提交失败，请稍后重试');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerText = '发送';
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// 自动执行（备用）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadMessages();
        const submitBtn = document.getElementById('submit-msg');
        if (submitBtn) submitBtn.addEventListener('click', submitMessage);
    });
} else {
    loadMessages();
    const submitBtn = document.getElementById('submit-msg');
    if (submitBtn) submitBtn.addEventListener('click', submitMessage);
}