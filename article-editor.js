// ============================================================
// AppSelf Article Editor v17
// ============================================================

var tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
    try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#0e1621');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0e1621');
    } catch (e) {}
}
var IS_MINIAPP = !!(tg && typeof tg.sendData === 'function');

var USER_ID = 0;
(function () {
    var p = new URLSearchParams(location.search);
    var u = p.get('uid');
    if (u) USER_ID = parseInt(u, 10) || 0;
    else if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) USER_ID = tg.initDataUnsafe.user.id;
})();

var STORAGE_KEY = 'appself_posts_v17';
var FILES_API = location.origin + '/files';
var UPLOAD_URL = location.origin + '/upload';

var posts = [];
var currentPostId = null;
var timerOn = false;
var timerMins = 60;
var channelOk = false;
var channelName = '';
var lastFocusedText = null;
var lastFocusedBlock = null;
var currentFileKind = 'file';
var savedRange = null;
var saveTo = null;

(function () {
    var p = new URLSearchParams(location.search);
    channelOk = p.get('ch') === '1';
    channelName = p.get('chname') || '';
})();

var MATH_KEYS = ['+','-','×','÷','=','≠','≤','≥','±','∞','√','∫','∑','∏','π','α','β','γ','θ','λ','μ','σ','φ','ω','^','_','(',')','[',']','{','}','\\frac{}{}','x^{2}','x^{n}','Δ','∂','∇','→','⇒','↔','log','ln','sin','cos','tan'];

// ═══════════════ SVG ICONS ═══════════════
var SVG_ICONS = {
    'clock': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z',
    'folder': 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    'edit': 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    'send': 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
    'type': 'M5 4v3h5.5v12h3V7H19V4H5z',
    'image': 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    'paperclip': 'M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z',
    'music': 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    'video': 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
    'mic': 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z',
    'list': 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
    'user': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    'table': 'M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM10 17H4v-5h6v5zm0-7H4V5h6v5zm10 7h-8v-5h8v5zm0-7h-8V5h8v5z',
    'sigma': 'M18 4H6l6 8-6 8h12v-2h-8l4-6-4-6h8z',
    'minus': 'M5 11h14v2H5z',
    'paragraph': 'M13 4H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h2v6h2V6h2v14h2V4z',
    'format': 'M5 4v3h5.5v12h3V7H19V4H5z',
    'bold': 'M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z',
    'h1': 'M5 4v3h5.5v12h3V7H19V4H5z',
    'h2': 'M3 17v-2h4v-2H5v-2h2V9H3V7h4c1.1 0 2 .9 2 2v2c0 .74-.4 1.39-1 1.73.6.35 1 .99 1 1.77v2c0 1.1-.9 2-2 2H3zm10 0v-2h4v-2h-4v-2h4V9h-4V7h4c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-4z',
    'h3': 'M3 17v-2h4v-2H3v-2h4V9H3V7h4c1.1 0 2 .9 2 2v2c0 .74-.4 1.39-1 1.73.6.35 1 .99 1 1.77v2c0 1.1-.9 2-2 2H3zm12-10h2v2h2v2h-2v2h-2v-2h-2v-2h2V7zm4 10v-2h2v2h-2zm-6 0v-2h2v2h-2z',
    'quote': 'M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z',
    'code': 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
    'x': 'M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.7 2.88 18.3 9.17 12 2.88 5.7 4.29 4.29l6.3 6.3 6.29-6.3z',
    'eye': 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    'link': 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    'plus': 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    'chev_l': 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z',
    'chev_r': 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z',
    'chev_up': 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
    'chev_down': 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z'
};

function injectIcons(root) {
    root = root || document;
    var els = root.querySelectorAll('[data-icon]');
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var name = el.getAttribute('data-icon');
        if (!name || !SVG_ICONS[name]) continue;
        if (el.dataset.iconDone === name) continue;
        var size = parseInt(el.getAttribute('data-icon-size') || '20', 10);
        var NS = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.style.cssText = 'display:block;width:'+size+'px;height:'+size+'px;flex:0 0 auto;pointer-events:none;';
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', SVG_ICONS[name]);
        svg.appendChild(path);
        el.innerHTML = '';
        el.appendChild(svg);
        el.dataset.iconDone = name;
    }
}

// ═══════════════ UTILS ═══════════════
function toast(msg, isErr) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('err', !!isErr);
    t.classList.add('show');
    clearTimeout(t._to);
    t._to = setTimeout(function () { t.classList.remove('show'); }, 2200);
}
function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtDate(ts) {
    var d = new Date(ts), n = new Date(), df = (n - d) / 1000;
    if (df < 60) return 'همین الان';
    if (df < 3600) return Math.floor(df / 60) + ' دقیقه پیش';
    if (df < 86400) return Math.floor(df / 3600) + ' ساعت پیش';
    return Math.floor(df / 86400) + ' روز پیش';
}
function fmtSize(b) {
    if (!b) return '';
    if (b < 1024) return b + 'B';
    if (b < 1048576) return (b / 1024).toFixed(1) + 'KB';
    return (b / 1048576).toFixed(1) + 'MB';
}

// ═══════════════ STORAGE ═══════════════
function loadPosts() {
    try {
        var r = localStorage.getItem(STORAGE_KEY);
        posts = r ? JSON.parse(r) : [];
        if (!Array.isArray(posts)) posts = [];
    } catch (e) { posts = []; }
}
function savePosts() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }
    catch (e) { toast('حافظه پر', 1); }
}

// ═══════════════ TABS ═══════════════
function updateTabHighlight() {
    var tabs = document.querySelector('.tabs');
    var active = document.querySelector('.tab.active');
    var hl = document.getElementById('tab-highlight');
    if (!tabs || !active || !hl) return;
    var tabsRect = tabs.getBoundingClientRect();
    var tabRect = active.getBoundingClientRect();
    hl.style.left = (tabRect.left - tabsRect.left) + 'px';
    hl.style.width = tabRect.width + 'px';
}

function switchTo(name) {
    document.querySelectorAll('.tab').forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === name);
    });
    document.querySelectorAll('.panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + name);
    });
    var fab = document.getElementById('add-fab');
    if (fab) {
        var showFab = (name === 'saved');
        fab.style.setProperty('display', showFab ? 'flex' : 'none', 'important');
        fab.classList.toggle('hidden', !showFab);
    }
    if (name === 'saved') renderPosts();
    if (name === 'send') updateSendTab();
    setTimeout(updateTabHighlight, 30);
}

document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        if (currentPostId) saveCurrentPost();
        switchTo(tab.dataset.tab);
    });
});

// ═══════════════ POSTS LIST ═══════════════
function renderPosts() {
    var list = document.getElementById('post-list');
    var empty = document.getElementById('empty-saved');
    if (!list) return;
    list.innerHTML = '';
    if (posts.length === 0) {
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');
    posts.forEach(function (p, idx) {
        var item = document.createElement('div');
        item.className = 'post-item';
        var hasTimer = p.timer_at && p.timer_at > Date.now();
        var sent = p.sent_at && !hasTimer;
        var tag = hasTimer ? '<span class="pi-tag">⏰</span>' : (sent ? '<span class="pi-tag sent">✅</span>' : '');
        var initial = (p.title || 'ب').trim()[0] || 'ب';
        item.innerHTML = '<div class="pi-icon">' + esc(initial) + '</div>' +
            '<div class="pi-info"><div class="pi-title">' + esc(p.title || 'بدون عنوان') + '</div>' +
            '<div class="pi-meta"><span>' + fmtDate(p.updated_at || p.created_at) + '</span>' + tag + '</div></div>';
        var del = document.createElement('button');
        del.className = 'pi-del';
        del.innerHTML = '✕';
        del.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!confirm('حذف این پست؟')) return;
            var deletedId = posts[idx] && posts[idx].id;
            posts.splice(idx, 1);
            if (deletedId && deletedId === currentPostId) {
                currentPostId = null;
                var wrap = document.getElementById('blocks');
                if (wrap) wrap.innerHTML = '';
            }
            savePosts();
            renderPosts();
            toast('حذف شد');
        });
        item.appendChild(del);
        item.addEventListener('click', function () { openPost(idx); });
        list.appendChild(item);
    });
}

function newPost() {
    if (currentPostId) saveCurrentPost();
    currentPostId = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    renderBlocks([]);
    switchTo('editor');
    setTimeout(function () {
        addTextBlock();
        saveCurrentPost();
    }, 100);
}

function openPost(idx) {
    var p = posts[idx];
    if (!p) return;
    currentPostId = p.id;
    renderBlocks(p.blocks || []);
    switchTo('editor');
}

document.getElementById('add-fab').addEventListener('click', newPost);

// ═══════════════ GET BLOCKS ═══════════════
function getBlocks() {
    var wrap = document.getElementById('blocks');
    if (!wrap) return [];
    var out = [];
    wrap.querySelectorAll(':scope > .block').forEach(function (b) {
        var t = b.dataset.type;
        if (t === 'text') {
            var el = b.querySelector('.block-text');
            var html = el ? el.innerHTML.trim() : '';
            if (html) out.push({ type: 'text', html: html });
        } else if (t === 'pullquote') {
            var pt = b.querySelector('.pq-text');
            var pa = b.querySelector('.pq-author');
            out.push({ type: 'pullquote', text: pt ? pt.innerHTML : '', author: pa ? pa.innerText : '' });
        } else if (t === 'table') {
            var tbl = b.querySelector('table');
            if (tbl) {
                var rows = [];
                tbl.querySelectorAll('tr').forEach(function (tr) {
                    var cells = [];
                    tr.querySelectorAll('td,th').forEach(function (c) { cells.push(c.innerHTML); });
                    rows.push(cells);
                });
                out.push({ type: 'table', rows: rows });
            }
        } else if (t === 'math') {
            var mc = b.querySelector('.math-content');
            out.push({ type: 'math', content: mc ? (mc.dataset.raw || mc.innerText) : '' });
        } else if (t === 'divider') {
            out.push({ type: 'divider' });
        } else if (t === 'footer') {
            var fc = b.querySelector('.footer-content');
            out.push({ type: 'footer', text: fc ? fc.innerHTML : '' });
        } else if (t === 'image') {
            out.push({ type: 'image', file_id: b.dataset.fileId, url: b.dataset.url, name: b.dataset.name });
        } else if (t === 'file') {
            out.push({ type: 'file', file_id: b.dataset.fileId, url: b.dataset.url, name: b.dataset.name, size: parseInt(b.dataset.size || '0') });
        } else if (t === 'audio') {
            out.push({ type: 'audio', file_id: b.dataset.fileId, url: b.dataset.url, name: b.dataset.name });
        } else if (t === 'video') {
            out.push({ type: 'video', file_id: b.dataset.fileId, url: b.dataset.url, name: b.dataset.name, size: parseInt(b.dataset.size || '0') });
        } else if (t === 'voice') {
            out.push({ type: 'voice', file_id: b.dataset.fileId, url: b.dataset.url, name: b.dataset.name, size: parseInt(b.dataset.size || '0') });
        } else if (t === 'list') {
            var items = [];
            b.querySelectorAll('.list-items > li').forEach(function (li) { items.push(li.innerHTML); });
            out.push({ type: 'list', ordered: b.dataset.ordered === '1', items: items });
        } else if (t === 'button') {
            var inmsg = [], reply = [];
            try { inmsg = JSON.parse(b.dataset.btnInmsg || '[]'); } catch (e) {}
            try { reply = JSON.parse(b.dataset.btnReply || '[]'); } catch (e) {}
            if (inmsg.length || reply.length) {
                out.push({ type: 'button', inmsg: inmsg, reply: reply });
            }
        } else if (t === 'contact') {
            out.push({ type: 'contact', phone: b.dataset.phone, name: b.dataset.cname });
        }
    });
    return out;
}

function renderBlocks(blocks) {
    var wrap = document.getElementById('blocks');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!blocks || !blocks.length) return;
    blocks.forEach(function (b) {
        if (b.type === 'text') addTextBlock(b.html);
        else if (b.type === 'pullquote') addPullquoteBlock(b.text, b.author);
        else if (b.type === 'table') addTableBlock(b.rows);
        else if (b.type === 'math') addMathBlock(b.content);
        else if (b.type === 'divider') addDividerBlock();
        else if (b.type === 'footer') addFooterBlock(b.text);
        else if (b.type === 'image') addImageBlock(b);
        else if (b.type === 'file') addFileBlock(b);
        else if (b.type === 'audio') addAudioBlock(b);
        else if (b.type === 'video') addVideoBlock(b);
        else if (b.type === 'voice') addVoiceBlock(b);
        else if (b.type === 'list') addListBlock(b.items, b.ordered);
        else if (b.type === 'button') addButtonBlock(b);
        else if (b.type === 'contact') addContactBlock(b);
    });
}

// ═══════════════ BLOCK SHELL ═══════════════
function buildBlockShell(type) {
    var b = document.createElement('div');
    b.className = 'block';
    b.dataset.type = type;
    var ctrl = document.createElement('div');
    ctrl.className = 'block-controls';
    ctrl.innerHTML = '<button class="block-ctrl" data-act="up">▲</button>' +
        '<button class="block-ctrl" data-act="down">▼</button>' +
        '<button class="block-ctrl danger" data-act="del">✕</button>';
    ctrl.addEventListener('click', function (e) {
        var t = e.target.closest('[data-act]');
        if (!t) return;
        e.stopPropagation();
        e.preventDefault();
        var act = t.dataset.act;
        if (act === 'del') {
            if (confirm('حذف این بلوک؟')) { b.remove(); saveCurrentPost(); }
        } else if (act === 'up') {
            var p = b.previousElementSibling;
            if (p) { b.parentNode.insertBefore(b, p); saveCurrentPost(); }
        } else if (act === 'down') {
            var n = b.nextElementSibling;
            if (n) { b.parentNode.insertBefore(n, b); saveCurrentPost(); }
        }
    });
    b.appendChild(ctrl);
    return b;
}

document.addEventListener('focusin', function(e) {
    var t = e.target;
    if (t && t.getAttribute && t.getAttribute('contenteditable') === 'true') {
        var b = t.closest && t.closest('.block');
        if (b) lastFocusedBlock = b;
    }
}, true);

function appendBlock(b) {
    var wrap = document.getElementById('blocks');
    if (!wrap) return;
    if (lastFocusedBlock && !wrap.contains(lastFocusedBlock)) lastFocusedBlock = null;
    if (lastFocusedBlock && wrap.contains(lastFocusedBlock) && lastFocusedBlock !== b) {
        var next = lastFocusedBlock.nextElementSibling;
        if (next) wrap.insertBefore(b, next);
        else wrap.appendChild(b);
    } else {
        wrap.appendChild(b);
    }
    setTimeout(function() { lastFocusedBlock = b; }, 0);
}

// ═══════════════ TEXT BLOCK ═══════════════
function onTextKeydown(e) {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey) return;
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    var tn = range.startContainer;
    var inNode = sel.anchorNode;
    var ctx = null;
    while (inNode && inNode !== e.target) {
        var tag = inNode.nodeName;
        if (tag === 'BLOCKQUOTE' || tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'PRE') {
            ctx = tag; break;
        }
        inNode = inNode.parentNode;
    }
    if (!ctx) return;
    if (ctx === 'H1' || ctx === 'H2' || ctx === 'H3') {
        e.preventDefault();
        document.execCommand('formatBlock', false, '<p>');
        scheduleSave();
        return;
    }
    if (ctx === 'PRE') return;
    if (ctx === 'BLOCKQUOTE') {
        e.preventDefault();
        e.stopPropagation();
        var bq = inNode;
        var curBlock = tn;
        if (curBlock !== bq) {
            while (curBlock && curBlock.parentNode && curBlock.parentNode !== bq) curBlock = curBlock.parentNode;
            if (!curBlock || curBlock.parentNode !== bq) curBlock = bq;
        }
        var isLineEmpty = ((curBlock.textContent || '').trim() === '');
        if (isLineEmpty && bq.dataset.pendingExit === '1') {
            delete bq.dataset.pendingExit;
            if (curBlock !== bq && curBlock.parentNode === bq) curBlock.remove();
            if (bq.textContent.trim() === '') {
                document.execCommand('formatBlock', false, '<p>');
            } else {
                var p = document.createElement('p');
                p.innerHTML = '<br>';
                bq.parentNode.insertBefore(p, bq.nextSibling);
                var r = document.createRange();
                r.setStart(p, 0); r.collapse(true);
                sel.removeAllRanges(); sel.addRange(r);
            }
            scheduleSave();
            return;
        }
        if (isLineEmpty) {
            bq.dataset.pendingExit = '1';
            if (curBlock === bq && !bq.querySelector('br') && bq.textContent === '') {
                bq.appendChild(document.createElement('br'));
            }
            return;
        }
        var newP = document.createElement('p');
        newP.innerHTML = '<br>';
        if (curBlock === bq) bq.appendChild(newP);
        else bq.insertBefore(newP, curBlock.nextSibling);
        bq.dataset.pendingExit = '1';
        var rr = document.createRange();
        rr.setStart(newP, 0); rr.collapse(true);
        sel.removeAllRanges(); sel.addRange(rr);
        scheduleSave();
        return;
    }
}

function addTextBlock(html) {
    var b = buildBlockShell('text');
    var t = document.createElement('div');
    t.className = 'block-text';
    t.contentEditable = 'true';
    t.setAttribute('spellcheck', 'false');
    t.dataset.ph = 'متن خود را بنویسید...';
    t.innerHTML = html || '';
    t.addEventListener('focus', function () { lastFocusedText = t; });
    t.addEventListener('input', scheduleSave);
    t.addEventListener('keydown', onTextKeydown);
    b.appendChild(t);
    appendBlock(b);
    if (!html) setTimeout(function () { t.focus(); }, 60);
    return b;
}

// ═══════════════ PULLQUOTE ═══════════════
function addPullquoteBlock(text, author) {
    var b = buildBlockShell('pullquote');
    var w = document.createElement('div');
    w.className = 'block-pullquote';
    var t = document.createElement('div');
    t.className = 'pq-text';
    t.contentEditable = 'true';
    t.setAttribute('spellcheck', 'false');
    t.innerHTML = text || '';
    t.addEventListener('input', scheduleSave);
    var a = document.createElement('div');
    a.className = 'pq-author';
    a.contentEditable = 'true';
    a.textContent = author || '';
    a.addEventListener('input', scheduleSave);
    w.appendChild(t);
    w.appendChild(a);
    w.addEventListener('click', function (e) {
        var tg = e.target;
        if (tg === t || tg === a) return;
        e.preventDefault();
        e.stopPropagation();
        t.focus();
        var range = document.createRange();
        range.selectNodeContents(t);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });
    b.appendChild(w);
    appendBlock(b);
    if (!text) setTimeout(function () { t.focus(); }, 60);
    return b;
}

// ═══════════════ TABLE ═══════════════
function addTableBlock(rows) {
    var b = buildBlockShell('table');
    var w = document.createElement('div');
    w.className = 'block-table';
    var tools = document.createElement('div');
    tools.className = 'table-tools';
    tools.innerHTML = '<button class="table-tool" data-tact="add-row">+R</button>' +
        '<button class="table-tool" data-tact="add-col">+C</button>' +
        '<button class="table-tool" data-tact="del-row">-R</button>' +
        '<button class="table-tool" data-tact="del-col">-C</button>' +
        '<button class="table-tool danger" data-tact="del">✕</button>';
    var tbl = document.createElement('table');
    if (!rows || !rows.length) rows = [['ستون ۱','ستون ۲','ستون ۳'],['—','—','—'],['—','—','—']];
    rows.forEach(function (r, ri) {
        var tr = document.createElement('tr');
        r.forEach(function (c) {
            var cell = document.createElement(ri === 0 ? 'th' : 'td');
            cell.contentEditable = 'true';
            cell.innerHTML = c || '—';
            cell.addEventListener('input', scheduleSave);
            tr.appendChild(cell);
        });
        tbl.appendChild(tr);
    });
    tools.addEventListener('click', function (e) {
        var t = e.target.closest('[data-tact]');
        if (!t) return;
        e.stopPropagation();
        var act = t.dataset.tact;
        if (act === 'add-row') {
            var tr = document.createElement('tr');
            var cols = tbl.querySelector('tr') ? tbl.querySelector('tr').children.length : 3;
            for (var i = 0; i < cols; i++) {
                var td = document.createElement('td');
                td.contentEditable = 'true';
                td.innerHTML = '—';
                td.addEventListener('input', scheduleSave);
                tr.appendChild(td);
            }
            tbl.appendChild(tr);
        } else if (act === 'add-col') {
            tbl.querySelectorAll('tr').forEach(function (row, ri) {
                var cell = document.createElement(ri === 0 ? 'th' : 'td');
                cell.contentEditable = 'true';
                cell.innerHTML = '—';
                cell.addEventListener('input', scheduleSave);
                row.appendChild(cell);
            });
        } else if (act === 'del-row') {
            var last = tbl.querySelector('tr:last-child');
            if (last && tbl.querySelectorAll('tr').length > 1) last.remove();
        } else if (act === 'del-col') {
            tbl.querySelectorAll('tr').forEach(function (row) {
                if (row.children.length > 1) row.lastElementChild.remove();
            });
        } else if (act === 'del') {
            b.remove();
        }
        saveCurrentPost();
    });
    w.appendChild(tools);
    w.appendChild(tbl);
    b.appendChild(w);
    appendBlock(b);
    return b;
}

// ═══════════════ MATH ═══════════════
function addMathBlock(content) {
    var b = buildBlockShell('math');
    var w = document.createElement('div');
    w.className = 'block-math';
    var m = document.createElement('div');
    m.className = 'math-content';
    m.contentEditable = 'true';
    m.dataset.raw = content || '';
    m.textContent = content || '';
    m.addEventListener('input', function () {
        m.dataset.raw = m.textContent;
        scheduleSave();
    });
    w.appendChild(m);
    b.appendChild(w);
    appendBlock(b);
    setTimeout(function () { m.focus(); }, 100);
    return b;
}

// ═══════════════ DIVIDER ═══════════════
function addDividerBlock() {
    var b = buildBlockShell('divider');
    var w = document.createElement('div');
    w.className = 'block-divider';
    w.innerHTML = '<hr>';
    b.appendChild(w);
    appendBlock(b);
    saveCurrentPost();
    return b;
}

// ═══════════════ FOOTER ═══════════════
function addFooterBlock(text) {
    var b = buildBlockShell('footer');
    var w = document.createElement('div');
    w.className = 'block-footer';
    var f = document.createElement('div');
    f.className = 'footer-content';
    f.contentEditable = 'true';
    f.innerHTML = text || '';
    f.addEventListener('input', scheduleSave);
    w.appendChild(f);
    b.appendChild(w);
    appendBlock(b);
    if (!text) setTimeout(function () { f.focus(); }, 60);
    return b;
}

// ═══════════════ FILE BLOCKS ═══════════════
function addImageBlock(data) {
    var b = buildBlockShell('image');
    b.dataset.fileId = data.file_id || '';
    b.dataset.url = data.url || '';
    b.dataset.name = data.name || 'image';
    var w = document.createElement('div');
    w.className = 'block-file';
    var src = data.url || ('https://findlo.ir/AppSelf/file_proxy.php?fid=' + encodeURIComponent(data.file_id || ''));
    w.innerHTML = '<img src="' + src + '" alt="' + esc(data.name) + '">';
    b.appendChild(w);
    appendBlock(b);
    saveCurrentPost();
    return b;
}
function addFileBlock(data) {
    var b = buildBlockShell('file');
    b.dataset.fileId = data.file_id || '';
    b.dataset.url = data.url || '';
    b.dataset.name = data.name || 'file';
    b.dataset.size = data.size || 0;
    var w = document.createElement('div');
    w.className = 'block-file';
    w.innerHTML = '<div class="file-card"><div class="fi">📎</div>' +
        '<div class="finfo"><div class="fname">' + esc(data.name || 'file') + '</div>' +
        '<div class="fmeta">' + fmtSize(data.size) + '</div></div></div>';
    b.appendChild(w);
    appendBlock(b);
    saveCurrentPost();
    return b;
}
function addAudioBlock(data) {
    var b = buildBlockShell('audio');
    b.dataset.fileId = data.file_id || '';
    b.dataset.url = data.url || '';
    b.dataset.name = data.name || 'audio';
    var w = document.createElement('div');
    w.className = 'block-file';
    w.innerHTML = '<div class="file-card"><div class="fi">🎵</div>' +
        '<div class="finfo"><div class="fname">' + esc(data.name || 'audio') + '</div>' +
        '<div class="fmeta">فایل صوتی</div></div></div>';
    b.appendChild(w);
    appendBlock(b);
    saveCurrentPost();
    return b;
}
function addVideoBlock(data) {
    var b = buildBlockShell('video');
    b.dataset.fileId = data.file_id || '';
    b.dataset.url = data.url || '';
    b.dataset.name = data.name || 'video';
    b.dataset.size = data.size || 0;
    var w = document.createElement('div');
    w.className = 'block-file';
    w.innerHTML = '<div class="file-card"><div class="fi">🎬</div>' +
        '<div class="finfo"><div class="fname">' + esc(data.name || 'video.mp4') + '</div>' +
        '<div class="fmeta">ویدیو' + (data.size ? ' · ' + fmtSize(data.size) : '') + '</div></div></div>';
    b.appendChild(w);
    appendBlock(b);
    saveCurrentPost();
    return b;
}
function addVoiceBlock(data) {
    var b = buildBlockShell('voice');
    b.dataset.fileId = data.file_id || '';
    b.dataset.url = data.url || '';
    b.dataset.name = data.name || 'voice';
    b.dataset.size = data.size || 0;
    var w = document.createElement('div');
    w.className = 'block-file';
    w.innerHTML = '<div class="file-card"><div class="fi">🎤</div>' +
        '<div class="finfo"><div class="fname">ویس</div>' +
        '<div class="fmeta">پیام صوتی' + (data.size ? ' · ' + fmtSize(data.size) : '') + '</div></div></div>';
    b.appendChild(w);
    appendBlock(b);
    saveCurrentPost();
    return b;
}
function addContactBlock(data) {
    var b = buildBlockShell('contact');
    b.dataset.phone = data.phone || '';
    b.dataset.cname = data.name || '';
    var w = document.createElement('div');
    w.className = 'block-file';
    w.innerHTML = '<div class="file-card"><div class="fi">👤</div>' +
        '<div class="finfo"><div class="fname">' + esc(data.name || 'مخاطب') + '</div>' +
        '<div class="fmeta">' + esc(data.phone || '') + '</div></div></div>';
    b.appendChild(w);
    appendBlock(b);
    saveCurrentPost();
    return b;
}

// ═══════════════ LIST ═══════════════
function onListKeydown(e) {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey) return;
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var node = sel.anchorNode;
    if (!node) return;
    var li = node.nodeType === 3 ? node.parentNode : node;
    while (li && li.nodeName !== 'LI') li = li.parentNode;
    if (!li) return;
    var list = li.parentNode;
    var isEmpty = li.textContent.trim() === '';
    e.preventDefault();
    if (!isEmpty) {
        var newLi = document.createElement('li');
        newLi.contentEditable = 'true';
        newLi.innerHTML = '';
        newLi.addEventListener('input', scheduleSave);
        newLi.addEventListener('keydown', onListKeydown);
        list.insertBefore(newLi, li.nextSibling);
        var r = document.createRange();
        r.setStart(newLi, 0); r.collapse(true);
        sel.removeAllRanges(); sel.addRange(r);
        saveCurrentPost();
        return;
    }
    li.remove();
    var block = list.closest('.block');
    if (!block) return;
    var parent = block.parentNode;
    var nextSib = block.nextSibling;
    var listEmpty = (list.children.length === 0);
    if (listEmpty) parent.removeChild(block);
    var nb = addTextBlock();
    if (nb && parent) {
        if (nextSib && nextSib.parentNode === parent) parent.insertBefore(nb, nextSib);
        else parent.appendChild(nb);
    }
    var nbText = nb ? nb.querySelector('.block-text') : null;
    if (nbText) {
        setTimeout(function () {
            nbText.focus();
            var rr = document.createRange();
            rr.selectNodeContents(nbText);
            rr.collapse(false);
            var s2 = window.getSelection();
            s2.removeAllRanges();
            s2.addRange(rr);
        }, 40);
    }
    saveCurrentPost();
}

function addListBlock(items, ordered) {
    var b = buildBlockShell('list');
    b.dataset.ordered = ordered ? '1' : '0';
    var w = document.createElement('div');
    w.className = 'block-list';
    var list = document.createElement(ordered ? 'ol' : 'ul');
    list.className = 'list-items';
    if (!items || !items.length) items = [''];
    items.forEach(function (item) {
        var li = document.createElement('li');
        li.contentEditable = 'true';
        li.innerHTML = item || '';
        li.addEventListener('input', scheduleSave);
        li.addEventListener('keydown', onListKeydown);
        list.appendChild(li);
    });
    var tools = document.createElement('div');
    tools.className = 'list-tools';
    tools.innerHTML = '<button class="list-tool" data-lact="toggle">' + (ordered ? '1.' : '•') + '</button>' +
        '<button class="list-tool" data-lact="add">+</button>' +
        '<button class="list-tool danger" data-lact="del">✕</button>';
    tools.addEventListener('click', function (e) {
        var tg = e.target.closest('[data-lact]');
        if (!tg) return;
        e.stopPropagation();
        var act = tg.dataset.lact;
        if (act === 'toggle') {
            var wasOrdered = b.dataset.ordered === '1';
            b.dataset.ordered = wasOrdered ? '0' : '1';
            var oldList = w.querySelector('.list-items');
            var newList = document.createElement(wasOrdered ? 'ul' : 'ol');
            newList.className = 'list-items';
            while (oldList.firstChild) newList.appendChild(oldList.firstChild);
            oldList.parentNode.replaceChild(newList, oldList);
            tg.textContent = wasOrdered ? '•' : '1.';
        } else if (act === 'add') {
            var li = document.createElement('li');
            li.contentEditable = 'true';
            li.innerHTML = '';
            li.addEventListener('input', scheduleSave);
            li.addEventListener('keydown', onListKeydown);
            w.querySelector('.list-items').appendChild(li);
            li.focus();
        } else if (act === 'del') {
            b.remove();
        }
        saveCurrentPost();
    });
    w.appendChild(tools);
    w.appendChild(list);
    b.appendChild(w);
    appendBlock(b);
    if (!items[0]) setTimeout(function () { var f = list.querySelector('li'); if (f) f.focus(); }, 60);
    return b;
}

// ═══════════════ BUTTON BLOCK (Multi-tab) ═══════════════
function addButtonBlock(data) {
    var b = buildBlockShell('button');
    var inmsg = (data && data.inmsg) || [];
    var reply = (data && data.reply) || [];
    b.dataset.btnInmsg = JSON.stringify(inmsg);
    b.dataset.btnReply = JSON.stringify(reply);

    var w = document.createElement('div');
    w.className = 'block-file';
    w.style.cssText = 'padding:8px 4px;';

    var html = '';
    if (inmsg.length) {
        var rows = [];
        var cur = [];
        inmsg.forEach(function (it, i) {
            if (i === 0 || it.layout === 'column') {
                if (cur.length) rows.push(cur);
                cur = [it];
            } else {
                cur.push(it);
            }
        });
        if (cur.length) rows.push(cur);
        rows.forEach(function (row) {
            html += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:4px;">';
            row.forEach(function (it) {
                var cls = 'preview-btn-' + (it.color || 'plain');
                if (!it.color) cls = 'preview-btn-plain';
                html += '<div class="' + cls + '" style="padding:9px 14px;border:1px solid;border-radius:18px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;">' +
                    esc(it.text || '') + ' <span style="opacity:.7;">↗</span></div>';
            });
            html += '</div>';
        });
    }
    if (reply.length) {
        html += '<div style="margin-top:6px;padding-top:8px;border-top:1px dashed var(--border);">' +
            '<div style="font-size:10px;color:var(--text3);text-align:center;margin-bottom:6px;">📎 زیر پست</div>';
        reply.forEach(function (it) {
            html += '<div style="display:flex;justify-content:center;margin-bottom:4px;">' +
                '<div style="padding:8px 16px;background:var(--bg3);border:1px solid rgba(255,255,255,0.08);border-radius:18px;font-size:12.5px;color:var(--text);display:inline-flex;align-items:center;gap:6px;min-width:60%;justify-content:center;">' +
                esc(it.text || '') + ' <span style="opacity:.5;">↗</span></div></div>';
        });
        html += '</div>';
    }
    w.innerHTML = html;
    b.appendChild(w);
    appendBlock(b);
    saveCurrentPost();
    return b;
}

// ═══════════════ BUTTON MODAL HELPERS ═══════════════
function _btnBoxHTML(item, kind, idx) {
    var text = (item && item.text) || '';
    var url = (item && item.url) || 'https://';
    var color = (item && item.color) || 'success';
    var layout = (item && item.layout) || 'row';
    var colorRow = '';
    var layoutRow = '';
    if (kind === 'inmsg') {
        colorRow = '<div><label>رنگ:</label><select class="btn-color">' +
            '<option value="success"' + (color === 'success' ? ' selected' : '') + '>🟢 سبز</option>' +
            '<option value="primary"' + (color === 'primary' ? ' selected' : '') + '>🔵 آبی</option>' +
            '<option value="danger"' + (color === 'danger' ? ' selected' : '') + '>🔴 قرمز</option>' +
            '<option value=""' + (color === '' ? ' selected' : '') + '>⚪ شفاف</option>' +
            '</select></div>';
        layoutRow = '<div><label>چیدمان:</label><select class="btn-layout">' +
            '<option value="row"' + (layout === 'row' ? ' selected' : '') + '>↔️ کنار</option>' +
            '<option value="column"' + (layout === 'column' ? ' selected' : '') + '>↕️ زیر</option>' +
            '</select></div>';
    }
    return '<div class="btn-item-box" data-kind="' + kind + '" data-idx="' + idx + '">' +
        '<button class="btn-del" onclick="removeBtnItem(\'' + kind + '\',' + idx + ')">✕</button>' +
        '<input type="text" class="modal-input btn-txt" placeholder="متن دکمه" value="' + esc(text) + '">' +
        '<input type="url" class="modal-input btn-url" placeholder="https://..." dir="ltr" value="' + esc(url) + '">' +
        '<div class="btn-label-row">' + colorRow + layoutRow + '</div>' +
        '</div>';
}

function _renderList(kind, items) {
    var listId = kind === 'inmsg' ? 'btn-inmsg-list' : 'btn-reply-list';
    var list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';
    items.forEach(function (it, idx) {
        list.insertAdjacentHTML('beforeend', _btnBoxHTML(it, kind, idx));
    });
}

function _collectList(kind) {
    var BIDI_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00A0]/g;
    var listId = kind === 'inmsg' ? 'btn-inmsg-list' : 'btn-reply-list';
    var list = document.getElementById(listId);
    if (!list) return [];
    var out = [];
    list.querySelectorAll('.btn-item-box').forEach(function (box) {
        var txtEl = box.querySelector('.btn-txt');
        var urlEl = box.querySelector('.btn-url');
        var txt = ((txtEl ? txtEl.value : '') || '').replace(BIDI_RE, '').trim();
        var url = ((urlEl ? urlEl.value : '') || '').replace(BIDI_RE, '').trim();
        if (!txt || !url || url.indexOf('http') !== 0) return;
        var item = { text: txt, url: url };
        if (kind === 'inmsg') {
            var cEl = box.querySelector('.btn-color');
            var lEl = box.querySelector('.btn-layout');
            item.color = cEl ? cEl.value : '';
            item.layout = lEl ? lEl.value : 'row';
        }
        out.push(item);
    });
    return out;
}

function openButtonModal() {
    _renderList('inmsg', []);
    _renderList('reply', []);
    document.querySelectorAll('.btn-tab').forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === 'inmsg');
    });
    document.querySelectorAll('.btn-tab-pane').forEach(function (p) {
        p.classList.toggle('active', p.dataset.pane === 'inmsg');
    });
    openModal('modal-button');
}

function removeBtnItem(kind, idx) {
    var current = _collectList(kind);
    current.splice(idx, 1);
    _renderList(kind, current);
}

function insertButtons() {
    var inmsg = _collectList('inmsg');
    var reply = _collectList('reply');
    if (!inmsg.length && !reply.length) {
        toast('حداقل یه دکمه اضافه کن', 1);
        return;
    }
    closeModal('modal-button');
    addButtonBlock({ inmsg: inmsg, reply: reply });
    var n = inmsg.length + reply.length;
    toast('✅ ' + n + ' دکمه اضافه شد');
}

// Listeners for tabs + add buttons
document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.btn-tab');
    if (tab) {
        e.preventDefault();
        var name = tab.dataset.tab;
        document.querySelectorAll('.btn-tab').forEach(function (t) {
            t.classList.toggle('active', t === tab);
        });
        document.querySelectorAll('.btn-tab-pane').forEach(function (p) {
            p.classList.toggle('active', p.dataset.pane === name);
        });
        return;
    }
    var addBtn = e.target.closest && e.target.closest('.btn-add-row');
    if (addBtn) {
        e.preventDefault();
        var kind = addBtn.dataset.add;
        var current = _collectList(kind);
        var blank = { text: '', url: 'https://' };
        if (kind === 'inmsg') { blank.color = 'success'; blank.layout = 'row'; }
        current.push(blank);
        _renderList(kind, current);
        setTimeout(function () {
            var listId = kind === 'inmsg' ? 'btn-inmsg-list' : 'btn-reply-list';
            var list = document.getElementById(listId);
            if (list) {
                var boxes = list.querySelectorAll('.btn-item-box');
                var last = boxes[boxes.length - 1];
                if (last) { var t = last.querySelector('.btn-txt'); if (t) t.focus(); }
            }
        }, 50);
    }
});

// ═══════════════ SIDEBAR TOGGLE ═══════════════
var topIcons = document.getElementById('sidebar');
var topToggle = document.getElementById('top-toggle');
var topOpen = true;

if (topToggle && topIcons) {
    topToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        topOpen = !topOpen;
        topIcons.classList.toggle('collapsed', !topOpen);
        var icon = topToggle.querySelector('[data-icon]');
        if (icon) {
            icon.setAttribute('data-icon', topOpen ? 'chev_l' : 'chev_r');
            icon.dataset.iconDone = '';
            injectIcons(topToggle);
        }
    });
}

document.querySelectorAll('.sidebar-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var t = btn.dataset.add;
        if (t === 'text') addTextBlock();
        else if (t === 'image') openFilesModal('image');
        else if (t === 'file') openFilesModal('file');
        else if (t === 'audio') openFilesModal('audio');
        else if (t === 'video') openFilesModal('video');
        else if (t === 'voice') openFilesModal('voice');
        else if (t === 'contact') {
            var name = prompt('نام مخاطب:');
            if (name) {
                var phone = prompt('شماره:') || '';
                addContactBlock({ name: name, phone: phone });
            }
        }
    });
});

// ═══════════════ BOTTOM TOGGLE ═══════════════
var bottomBar = document.getElementById('bottom-bar');
var bottomToggle = document.getElementById('bottom-toggle');
var bottomOpen = true;
if (bottomToggle && bottomBar) {
    var bottomTools = bottomBar.querySelector('.toolbar-inner');
    bottomToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        bottomOpen = !bottomOpen;
        if (bottomTools) bottomTools.classList.toggle('collapsed', !bottomOpen);
        var icon = bottomToggle.querySelector('[data-icon]');
        if (icon) {
            icon.setAttribute('data-icon', bottomOpen ? 'chev_down' : 'chev_up');
            icon.dataset.iconDone = '';
            injectIcons(bottomToggle);
        }
    });
}

// ═══════════════ TOOLBAR ═══════════════
document.querySelectorAll('.tbtn[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var t = btn.dataset.add;
        if (t === 'table') addTableBlock();
        else if (t === 'math') openMathModal();
        else if (t === 'divider') addDividerBlock();
        else if (t === 'footer') addFooterBlock();
    });
});

// ═══════════════ FMT / BIU MENUS ═══════════════
var fmtBtn = document.getElementById('fmt-btn');
var fmtMenu = document.getElementById('fmt-menu');
var biuBtn = document.getElementById('biu-btn');
var biuMenu = document.getElementById('biu-menu');

if (fmtBtn) {
    fmtBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        fmtMenu.classList.toggle('show');
        biuMenu.classList.remove('show');
        if (fmtMenu.classList.contains('show')) updateFmtMenuStates();
    });
}
if (biuBtn) {
    biuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        biuMenu.classList.toggle('show');
        fmtMenu.classList.remove('show');
        if (biuMenu.classList.contains('show')) updateBiuMenuStates();
    });
}
document.addEventListener('click', function (e) {
    if (fmtMenu && !fmtMenu.contains(e.target) && e.target !== fmtBtn) fmtMenu.classList.remove('show');
    if (biuMenu && !biuMenu.contains(e.target) && e.target !== biuBtn) biuMenu.classList.remove('show');
});

function getActiveText() {
    var sel = window.getSelection();
    if (sel.rangeCount) {
        var n = sel.anchorNode;
        while (n && !(n.classList && n.classList.contains('block-text'))) n = n.parentNode;
        if (n) return n;
    }
    return lastFocusedText || document.querySelector('.block-text');
}

// FMT menu handlers
document.querySelectorAll('#fmt-menu .fmt-item').forEach(function (item) {
    item.addEventListener('click', function () {
        var f = item.dataset.fmt;
        var el = getActiveText();
        if (f === 'pullquote') {
            if (!el) { toast('اول روی یه بلوک متن بزن', 1); return; }
            el.focus();
            var sel = window.getSelection();
            var selectedText = sel ? sel.toString().trim() : '';
            var safeText = selectedText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var pqHTML = '<div class="pq-inline">' +
                '<div class="pq-text">' + safeText + '</div>' +
                '<div class="pq-credit"></div>' +
                '</div><p><br></p>';
            if (selectedText) {
                try { document.execCommand('delete', false, null); } catch (e) {}
            }
            document.execCommand('insertHTML', false, pqHTML);
            setTimeout(function () {
                var pqTexts = el.querySelectorAll('.pq-inline .pq-text');
                var target = pqTexts[pqTexts.length - 1];
                if (target) {
                    var range = document.createRange();
                    range.selectNodeContents(target);
                    range.collapse(false);
                    var s = window.getSelection();
                    s.removeAllRanges();
                    s.addRange(range);
                }
            }, 40);
            fmtMenu.classList.remove('show');
            saveCurrentPost();
            return;
        }
        if (f === 'list' || f === 'list_ordered') {
            addListBlock([], f === 'list_ordered');
            fmtMenu.classList.remove('show');
            saveCurrentPost();
            return;
        }
        if (f === 'clear') {
            if (el) {
                el.focus();
                document.execCommand('removeFormat');
                document.execCommand('formatBlock', false, '<p>');
                saveCurrentPost();
            }
            fmtMenu.classList.remove('show');
            return;
        }
        if (!el) { toast('اول روی یه بلوک متن بزن', 1); return; }
        el.focus();
        if (f === 'pre') document.execCommand('formatBlock', false, '<pre>');
        else if (f === 'blockquote') document.execCommand('formatBlock', false, '<blockquote>');
        else document.execCommand('formatBlock', false, '<' + f + '>');
        fmtMenu.classList.remove('show');
        saveCurrentPost();
    });
});

// BIU menu handlers
document.querySelectorAll('#biu-menu .fmt-item').forEach(function (item) {
    item.addEventListener('click', function () {
        var f = item.dataset.inline;
        var el = getActiveText();
        if (f === 'link') {
            openLinkModal();
            biuMenu.classList.remove('show');
            return;
        }
        if (f === 'button') {
            openButtonModal();
            biuMenu.classList.remove('show');
            return;
        }
        if (!el) { toast('اول روی یه بلوک متن بزن', 1); return; }
        el.focus();
        if (f === 'clear') {
            document.execCommand('removeFormat');
        } else if (f === 'spoiler') {
            var sel = window.getSelection();
            var text = sel.toString() || 'اسپویلر';
            document.execCommand('insertHTML', false, '<span class="spoiler" style="background:#232e3c;border-radius:4px;padding:1px 4px;color:transparent;">' + esc(text) + '</span>');
        } else {
            document.execCommand(f, false, null);
        }
        biuMenu.classList.remove('show');
        saveCurrentPost();
    });
});

// Menu state helpers
function updateFmtMenuStates() {
    var el = getActiveText();
    if (!el) return;
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var cur = sel.anchorNode;
    var activeFmt = null;
    while (cur && cur !== el && cur !== document.body) {
        var name = (cur.nodeName || '').toLowerCase();
        if (name === 'h1' || name === 'h2' || name === 'h3' ||
            name === 'blockquote' || name === 'pre') {
            activeFmt = name; break;
        }
        if (name === 'p') { activeFmt = 'p'; break; }
        cur = cur.parentNode;
    }
    document.querySelectorAll('#fmt-menu .fmt-item').forEach(function (item) {
        var f = item.dataset.fmt;
        item.classList.toggle('active', f === activeFmt);
    });
}
function updateBiuMenuStates() {
    var s = { bold: false, italic: false, underline: false, strikeThrough: false };
    try {
        s.bold = document.queryCommandState('bold');
        s.italic = document.queryCommandState('italic');
        s.underline = document.queryCommandState('underline');
        s.strikeThrough = document.queryCommandState('strikeThrough');
    } catch (e) {}
    document.querySelectorAll('#biu-menu .fmt-item').forEach(function (item) {
        var f = item.dataset.inline;
        item.classList.toggle('active', !!s[f]);
    });
}
document.addEventListener('selectionchange', function () {
    if (fmtMenu && fmtMenu.classList.contains('show')) updateFmtMenuStates();
    if (biuMenu && biuMenu.classList.contains('show')) updateBiuMenuStates();
});

// ═══════════════ MODALS ═══════════════
function openModal(id) { var m = document.getElementById(id); if (m) m.classList.add('show'); }
function closeModal(id) { var m = document.getElementById(id); if (m) m.classList.remove('show'); }
document.querySelectorAll('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(m.id); });
});

// ═══════════════ LINK MODAL ═══════════════
function openLinkModal() {
    var u = document.getElementById('modal-link-url');
    var t = document.getElementById('modal-link-text');
    if (u) u.value = '';
    if (t) t.value = '';
    var sel = window.getSelection();
    savedRange = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    openModal('modal-link');
    setTimeout(function () { if (u) u.focus(); }, 250);
}
function insertLink() {
    var u = document.getElementById('modal-link-url');
    var t = document.getElementById('modal-link-text');
    var url = u ? u.value.trim() : '';
    var txt = (t ? t.value.trim() : '') || url;
    if (!url) { toast('لینک وارد کن', 1); return; }
    closeModal('modal-link');
    var el = getActiveText();
    if (el) {
        el.focus();
        if (savedRange) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
        }
        document.execCommand('insertHTML', false, '<a href="' + esc(url) + '" target="_blank">' + esc(txt) + '</a>');
        saveCurrentPost();
    }
    toast('✅ لینک اضافه شد');
}

// ═══════════════ FILES MODAL ═══════════════
function openFilesModal(kind) {
    currentFileKind = kind || 'file';
    var title = document.getElementById('files-title');
    if (title) {
        var label = kind === 'image' ? 'عکس' : (kind === 'audio' ? 'موزیک' : (kind === 'video' ? 'ویدیو' : (kind === 'voice' ? 'ویس' : 'فایل')));
        title.innerHTML = '<span data-icon="paperclip" data-icon-size="18"></span> افزودن ' + label;
        injectIcons(title);
    }
    openModal('modal-files');
    switchSource('local');
}
function switchSource(src) {
    document.querySelectorAll('.source-tab button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.src === src);
    });
    if (src === 'local') renderLocalPicker();
    else renderBotFiles();
}
function renderLocalPicker() {
    var list = document.getElementById('files-list');
    if (!list) return;
    list.innerHTML = '<div style="padding:16px;text-align:center;">' +
        '<input type="file" id="local-file-input" style="display:none;">' +
        '<button class="btn-primary" id="local-pick-btn" style="width:auto;margin:0 auto;padding:14px 28px;">📤 انتخاب فایل</button>' +
        '<div style="font-size:11.5px;color:var(--text2);margin-top:12px;">حجم مجاز تا ۲۰ مگابایت</div></div>';
    var inp = document.getElementById('local-file-input');
    var btn = document.getElementById('local-pick-btn');
    if (inp) inp.accept = currentFileKind === 'image' ? 'image/*' : (currentFileKind === 'audio' ? 'audio/*' : (currentFileKind === 'video' ? 'video/*' : (currentFileKind === 'voice' ? 'audio/*' : '*/*')));
    if (btn && inp) btn.addEventListener('click', function () { inp.click(); });
    if (inp) inp.addEventListener('change', function () {
        var f = inp.files[0];
        if (f) uploadLocal(f);
    });
}
async function uploadLocal(file) {
    if (file.size > 20 * 1024 * 1024) { toast('بیش از ۲۰ مگابایت', 1); return; }
    toast('در حال آپلود...');
    var fd = new FormData();
    fd.append('file', file);
    try {
        var r = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
        var data = await r.json();
        if (!data.ok) { toast('خطا: ' + (data.error || ''), 1); return; }
        if (currentFileKind === 'image') addImageBlock({ url: data.url, name: file.name });
        else if (currentFileKind === 'audio') addAudioBlock({ url: data.url, name: file.name });
        else if (currentFileKind === 'video') addVideoBlock({ url: data.url, name: file.name, size: file.size });
        else if (currentFileKind === 'voice') addVoiceBlock({ url: data.url, name: file.name, size: file.size });
        else addFileBlock({ url: data.url, name: file.name, size: file.size });
        closeModal('modal-files');
        toast('✅ اضافه شد');
    } catch (e) { toast('خطای شبکه', 1); }
}
async function renderBotFiles() {
    var list = document.getElementById('files-list');
    if (!list) return;
    if (!USER_ID) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--danger);font-size:13px;">USER_ID پیدا نشد</div>';
        return;
    }
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text2);font-size:13px;">در حال بارگذاری...</div>';
    try {
        var r = await fetch(FILES_API + '?uid=' + USER_ID + '&t=' + Date.now());
        var data = await r.json();
        var files = data.files || [];
        if (currentFileKind === 'image') files = files.filter(function (f) { return f.type === 'photo'; });
        else if (currentFileKind === 'audio') files = files.filter(function (f) { return f.type === 'audio'; });
        else if (currentFileKind === 'video') files = files.filter(function (f) { return f.type === 'video'; });
        else if (currentFileKind === 'voice') files = files.filter(function (f) { return f.type === 'voice'; });
        if (!files.length) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text2);font-size:13px;line-height:1.9;">فایلی پیدا نشد.<br>به PV ربات برو و فایل بفرست.</div>';
            return;
        }
        list.innerHTML = '';
        files.forEach(function (f) {
            var item = document.createElement('div');
            item.className = 'file-item';
            var icon = f.type === 'photo' ? '🖼' : (f.type === 'video' ? '🎬' : (f.type === 'audio' || f.type === 'voice') ? '🎵' : '📎');
            item.innerHTML = '<div class="fi">' + icon + '</div>' +
                '<div style="flex:1;min-width:0;">' +
                '<div class="fname">' + esc(f.name || 'file') + '</div>' +
                '<div class="fmeta">' + (f.size ? fmtSize(f.size) : '') + '</div></div>';
            item.addEventListener('click', function () {
                if (f.type === 'photo') addImageBlock({ file_id: f.file_id, name: f.name });
                else if (f.type === 'audio') addAudioBlock({ file_id: f.file_id, name: f.name });
                else if (f.type === 'video') addVideoBlock({ file_id: f.file_id, name: f.name, size: f.size });
                else if (f.type === 'voice') addVoiceBlock({ file_id: f.file_id, name: f.name, size: f.size });
                else addFileBlock({ file_id: f.file_id, name: f.name, size: f.size });
                closeModal('modal-files');
                toast('✅ اضافه شد');
            });
            list.appendChild(item);
        });
    } catch (e) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--danger);">خطا در بارگذاری</div>';
    }
}

// ═══════════════ MATH MODAL ═══════════════
function openMathModal() {
    var m = document.getElementById('modal-math');
    var inp = document.getElementById('math-input');
    var keys = document.getElementById('math-keys');
    if (!m || !inp || !keys) return;
    inp.value = '';
    keys.innerHTML = '';
    MATH_KEYS.forEach(function (k) {
        var b = document.createElement('button');
        b.className = 'math-key';
        b.textContent = k;
        b.addEventListener('click', function () {
            inp.value += k;
            inp.focus();
        });
        keys.appendChild(b);
    });
    openModal('modal-math');
    setTimeout(function () { inp.focus(); }, 250);
}
function confirmMath() {
    var inp = document.getElementById('math-input');
    var val = inp ? inp.value.trim() : '';
    closeModal('modal-math');
    if (!val) return;
    addMathBlock(val);
}

// ═══════════════ SAVE ═══════════════
function scheduleSave() {
    clearTimeout(saveTo);
    saveTo = setTimeout(saveCurrentPost, 500);
}

function _genTitle(blocks) {
    if (!blocks || !blocks.length) return 'بدون عنوان';
    for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (b.type === 'text' && b.html) {
            var tmp = document.createElement('div');
            tmp.innerHTML = b.html;
            var txt = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
            if (txt) return txt.length > 60 ? txt.slice(0, 57) + '…' : txt;
        }
        if (b.type === 'list' && b.items && b.items.length) {
            for (var j = 0; j < b.items.length; j++) {
                var lt = document.createElement('div');
                lt.innerHTML = b.items[j];
                var ltxt = (lt.textContent || '').trim();
                if (ltxt) return ltxt.length > 60 ? ltxt.slice(0, 57) + '…' : ltxt;
            }
        }
    }
    return 'بدون عنوان';
}

function saveCurrentPost() {
    if (!currentPostId) return;
    var blocks = getBlocks();
    var title = _genTitle(blocks);
    var i = -1;
    for (var k = 0; k < posts.length; k++) {
        if (posts[k].id === currentPostId) { i = k; break; }
    }
    var data = {
        id: currentPostId,
        title: title || 'بدون عنوان',
        blocks: blocks,
        created_at: i >= 0 ? posts[i].created_at : Date.now(),
        updated_at: Date.now(),
        timer_at: i >= 0 ? posts[i].timer_at : null,
        sent_at: i >= 0 ? posts[i].sent_at : null
    };
    if (i >= 0) posts[i] = data;
    else posts.unshift(data);
    savePosts();
}

// ═══════════════ TIMER ═══════════════
function toggleTimer() {
    timerOn = !timerOn;
    var sw = document.getElementById('timer-switch');
    var picker = document.getElementById('timer-picker');
    if (sw) sw.classList.toggle('on', timerOn);
    if (picker) picker.classList.toggle('show', timerOn);
    updateTimerHint();
}
document.getElementById('timer-switch').addEventListener('click', toggleTimer);
document.querySelectorAll('.timer-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
        document.querySelectorAll('.timer-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        timerMins = parseInt(chip.dataset.mins);
        updateTimerHint();
    });
});
function updateTimerHint() {
    var h = document.getElementById('timer-hint');
    if (!h) return;
    if (!timerOn) { h.textContent = ''; return; }
    var target = new Date(Date.now() + timerMins * 60000);
    var days = Math.floor(timerMins / 1440);
    var hours = Math.floor((timerMins % 1440) / 60);
    var mins = timerMins % 60;
    var timeStr = target.getFullYear() + '/' +
        String(target.getMonth() + 1).padStart(2, '0') + '/' +
        String(target.getDate()).padStart(2, '0') + ' - ' +
        String(target.getHours()).padStart(2, '0') + ':' +
        String(target.getMinutes()).padStart(2, '0');
    var txt = 'ارسال در ';
    if (days) txt += days + ' روز و ' + hours + ' ساعت';
    else if (hours) txt += hours + ' ساعت و ' + mins + ' دقیقه';
    else txt += mins + ' دقیقه';
    h.innerHTML = txt + '<br><span style="color:var(--text2);font-weight:400;font-size:11px;">' + timeStr + '</span>';
}

// ═══════════════ SEND TAB ═══════════════
function updateSendTab() {
    var row = document.getElementById('channel-row');
    var txt = document.getElementById('channel-text');
    var setup = document.getElementById('btn-setchannel');
    var sendBtn = document.getElementById('send-btn');
    var pinfo = document.getElementById('post-info-text');
    if (row && txt) {
        if (channelOk) {
            row.classList.add('ok');
            txt.textContent = channelName ? '✅ ' + channelName : '✅ متصل';
            if (setup) setup.classList.add('hidden');
        } else {
            row.classList.remove('ok');
            txt.textContent = '❌ متصل نیست';
            if (setup) setup.classList.remove('hidden');
        }
    }
    if (pinfo) {
        if (currentPostId) {
            var p = null;
            for (var i = 0; i < posts.length; i++) {
                if (posts[i].id === currentPostId) { p = posts[i]; break; }
            }
            pinfo.textContent = p ? ((p.title || 'بدون عنوان') + ' · ' + ((p.blocks || []).length) + ' المان') : '—';
        } else pinfo.textContent = 'هیچ پستی انتخاب نشده';
    }
    if (sendBtn) sendBtn.disabled = !(channelOk && currentPostId);
}
document.getElementById('btn-setchannel').addEventListener('click', function () { sendToBot('/setchannel'); });

function sendPost() {
    if (!currentPostId) { toast('پست انتخاب کن', 1); return; }
    if (!channelOk) { toast('چنل ست کن', 1); return; }
    saveCurrentPost();
    var post = null;
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].id === currentPostId) { post = posts[i]; break; }
    }
    if (!post) return;
    var timerAt = timerOn ? Date.now() + timerMins * 60000 : null;
    var payload = { action: 'send_article_v2', post_id: post.id, blocks: post.blocks || [], timer_at: timerAt };
    if (IS_MINIAPP && tg.sendData) {
        try {
            tg.sendData(JSON.stringify(payload));
            var idx = -1;
            for (var k = 0; k < posts.length; k++) {
                if (posts[k].id === post.id) { idx = k; break; }
            }
            if (idx >= 0) {
                posts[idx].timer_at = timerAt;
                posts[idx].sent_at = timerAt ? null : Date.now();
                savePosts();
            }
            toast(timerAt ? '⏰ زمان‌بندی شد' : '🚀 ارسال شد');
            setTimeout(function () { try { tg.close(); } catch (e) {} }, 800);
        } catch (err) { toast('خطا: ' + err.message, 1); }
    } else toast('فقط در تلگرام', 1);
}
document.getElementById('send-btn').addEventListener('click', sendPost);

function sendToBot(cmd) {
    if (IS_MINIAPP && tg.sendData) {
        tg.sendData(JSON.stringify({ action: 'command', cmd: cmd }));
        setTimeout(function () { try { tg.close(); } catch (e) {} }, 400);
    }
}

// ═══════════════ FOCUS KILLER ═══════════════
document.addEventListener('focusin', function(e) {
    var t = e.target;
    if (!t || !t.style) return;
    var ce = (t.getAttribute && t.getAttribute('contenteditable') === 'true') || t.contentEditable === 'true';
    if (!ce) return;
    t.style.setProperty('outline', 'none', 'important');
    t.style.setProperty('outline-width', '0', 'important');
    t.style.setProperty('border', '0', 'important');
    t.style.setProperty('-webkit-focus-ring-color', 'transparent', 'important');
    t.style.setProperty('box-shadow', 'none', 'important');
}, true);

// ═══════════════ INIT ═══════════════
loadPosts();
switchTo('saved');
renderPosts();

window.addEventListener('resize', updateTabHighlight);
window.addEventListener('orientationchange', function () { setTimeout(updateTabHighlight, 200); });
window.addEventListener('load', function () { setTimeout(updateTabHighlight, 50); });

window.addEventListener('beforeunload', function () {
    if (currentPostId) saveCurrentPost();
});

injectIcons(document);
setTimeout(updateTabHighlight, 100);
console.log('AppSelf Editor v17 ready. USER_ID:', USER_ID, 'posts:', posts.length);