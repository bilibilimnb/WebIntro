async function loadPart(selector, file) {
    try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        document.querySelector(selector).innerHTML = html;
    } catch (err) {
        console.error(`加载 ${file} 失败:`, err);
    }
}

Promise.all([
    loadPart('#header-placeholder', 'parts/header.html'),
    loadPart('#profile-placeholder', 'parts/profile.html'),
    loadPart('#projects-placeholder', 'parts/projects.html'),
    loadPart('#message-board-placeholder', 'parts/message-board.html'),
    loadPart('#footer-placeholder', 'parts/footer.html')
]).then(() => {
    // 线路状态刷新
    if (typeof fetchAndUpdateLines === 'function') {
        fetchAndUpdateLines();
    }
    // 留言板初始化
    if (typeof loadMessages === 'function') {
        loadMessages();
        const submitBtn = document.getElementById('submit-msg');
        if (submitBtn && typeof submitMessage === 'function') {
            submitBtn.removeEventListener('click', submitMessage);
            submitBtn.addEventListener('click', submitMessage);
        }
    }
});