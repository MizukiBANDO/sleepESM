function loadCenterContent() {
    const path       = location.pathname;
    const pageName   = path === "/" ? "home" : path.slice(1); // "/about" → "about"
    const htmlPath   = path === "/" ? `/page/index.html` :`/page/${pageName}/index.html`;
    const scriptPath = path === "/" ? `/page/script.js`  :`/page/${pageName}/script.js`;

    fetch(htmlPath)
        .then(res => {
            if (!res.ok) throw new Error("ページが見つかりません");
            return res.text();
        })
        .then(html => {
            const container = document.getElementById("center-content");
            container.innerHTML = html;

            // JSファイルを再読み込み（前のものを削除）
            loadScriptReplace(scriptPath);
        })
        .catch(error => {
            document.getElementById("center-content").innerHTML = `
                <p class="text-danger">読み込みエラー: ${error.message}</p>
            `;
        });
}

function loadScriptReplace(src) {
  // 前回のスクリプト（あれば）を削除
  const existing = document.getElementById('page-script');
  if (existing) existing.remove();

  // ✅ import() のみで読み込む（scriptタグは不要）
  import(`${src}?t=${Date.now()}`)
    .then(mod => {
      if (typeof mod.initPage === 'function') {
        mod.initPage();
      } else {
        console.warn(`initPage() が見つかりません: ${src}`);
      }
    })
    .catch(err => {
      console.error(`❌ スクリプト読み込みエラー: ${src}`, err);
    });
}


export {
    loadCenterContent,
    loadScriptReplace
}