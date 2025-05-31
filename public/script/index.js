document.addEventListener("DOMContentLoaded", function () {
    // コンポーネントを非同期で読み込み
    function loadComponent(elementId, url) {
        return fetch(url)
            .then(response => response.text())
            .then(data => {
                document.getElementById(elementId).innerHTML = data;
            });
    }
    function loadContent(elementClass, url) {
        return fetch(url)
            .then(response => response.text())
            .then(data => {
                document.querySelectorAll(elementClass).forEach(el => {
                    el.innerHTML = data;
                });
            });
    }


    // コンポーネントの読み込みをすべて待つ
    Promise.all([
        loadComponent('topNav',         '../component/page_parts/topNav.html'),
        loadComponent('bottomNav',      '../component/page_parts/bottomNav.html'),
        loadComponent('head',           '../component/page_parts/head.html'),
    ]).then(async () => {

    Promise.all([
        // ひとつしか対応していないので
        loadContent('.loginState',         '../component/page_contents/loginState.html'),
    ]).then(async () => {

// ▼ ログイン中ユーザーの表示処理をここに組み込む ▼
        const emailDisplays = document.querySelectorAll('.currentUserEmail');
        const studyIdDisplays = document.querySelectorAll('.currentStudyId');
        const token = localStorage.getItem('token');

        if (emailDisplays.length && token) {
            try {
                const res = await fetch('/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();

                    // email表示
                    emailDisplays.forEach(el => {
                        el.textContent = `ログイン中: ${data.email}`;
                    });

                    // study_id表示
                    studyIdDisplays.forEach(el => {
                        if (data.study_id) {
                            el.textContent = `参加中の研究: ${data.study_id}`;
                        } else {
                            el.textContent = 'まだ研究には参加していません。';
                        }
                    });

                } else {
                    emailDisplays.forEach(el => {
                        el.textContent = 'ログイン情報が取得できませんでした。';
                    });
                    studyIdDisplays.forEach(el => {
                        el.textContent = '参加研究の情報が取得できませんでした。';
                    });
                }
            } catch (err) {
                console.error(err);
                emailDisplays.forEach(el => {
                    el.textContent = '通信エラーでユーザー情報を取得できませんでした。';
                });
                studyIdDisplays.forEach(el => {
                    el.textContent = '通信エラーで研究情報を取得できませんでした。';
                });
            }
        } else if (emailDisplays.length) {
            const storedUserName = localStorage.getItem('userName');

            if (storedUserName) {
                // 名前が保存されている場合の表示
                emailDisplays.forEach(el => {
                    el.classList.remove('text-muted', 'small');  
                    el.textContent = `${storedUserName} さん の記録です。`;
                });
                studyIdDisplays.forEach(el => {
                    el.textContent = '現在は睡眠の記録のみ可能です。';
                });
            } else {
                // 名前も保存されていない場合（完全な未ログイン）
                emailDisplays.forEach(el => {
                    el.textContent = '未ログインです。';
                });
                studyIdDisplays.forEach(el => {
                    el.textContent = '未ログインのため、研究情報を表示できません。';
                });
            }
        }

        // ▲ ログイン処理ここまで ▲

    // Promise.all page_contents
    }).catch(error => {
        console.error('Error loading contents:', error);
    });
    // Promise.all page_parts
    }).catch(error => {
        console.error('Error loading components:', error);
    });
});

import { menuItems } from './setting/content-left.js';
import { rightColumnItems } from './setting/content-right.js';
import { left, right, root } from './api.js';

left.renderSidebar(menuItems);       // ← OK：定義された関数名に合わせる
left.renderLeftOffcanvas();          // ← OK：これは正しく呼ばれている

right.renderRightContent(rightColumnItems);
right.renderRightOffcanvas();


// 履歴イベントと初回ロード
window.addEventListener("DOMContentLoaded", root.loadCenterContent);
window.addEventListener("popstate", root.loadCenterContent);

// クリック遷移対応（SPAリンクにだけ）
document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-link]");
    if (link) {
        e.preventDefault();
        const url = link.getAttribute("href");
        history.pushState({}, "", url);
        root.loadCenterContent();
    }
});

document.getElementById("app")?.addEventListener("click", e => {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    if (action === "show-left") {
        showContent("leftSide", "rightSide");
    } else if (action === "show-right") {
        showContent("rightSide", "leftSide");
    }
});


// 表示切り替え関数（そのまま使えます）
function showContent(showId, hideIds) {
    const showEl = document.getElementById(showId);
    if (showEl) showEl.classList.remove('d-none');

    if (typeof hideIds === 'string') {
        const hideEl = document.getElementById(hideIds);
        if (hideEl) hideEl.classList.add('d-none');
    } else if (Array.isArray(hideIds)) {
        hideIds.forEach(hideId => {
            const el = document.getElementById(hideId);
            if (el) el.classList.add('d-none');
        });
    }
}