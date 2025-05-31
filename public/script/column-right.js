import { rightColumnItems } from './setting/content-right.js'

function renderRightContent(items, containerId = "right-content") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ""; // 初期化

    // 「状態」ラベルと loginState を最初に追加
    const statusLabel = document.createElement("div");
    statusLabel.className = "d-flex mt-2 mb-2 p-1 rounded-pill bg-light border justify-content-center fw-bold";
    statusLabel.textContent = "状態";

    const loginState = document.createElement("div");
    loginState.className = "loginState";

    container.appendChild(statusLabel);
    container.appendChild(loginState);

    // 以下、カードやhrを追加
    items.forEach(item => {
        if (item === "hr") {
            container.appendChild(document.createElement("hr"));
            return;
        }

        const card = document.createElement("div");
        card.className = "card m-1 mb-3 p-2 shadow bg-light";

        const content = document.createElement("div");
        content.className = item.class;
        content.textContent = item.label;

        card.appendChild(content);
        container.appendChild(card);
    });
}

function renderRightOffcanvas(containerId = "rightOffcanvas") {
    const container = document.getElementById(containerId);

    container.innerHTML = `
        <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title" id="offcanvasRightLabel">状態</h5>
                <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
                <div class="text-start" id="offcanvasRightBody"></div>
            </div>
        </div>
    `;

    renderRightOffcanvasContent(rightColumnItems, "offcanvasRightBody");
}

function renderRightOffcanvasContent(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    const loginState = document.createElement("div");
    loginState.className = "loginState";
    container.appendChild(loginState);

    items.forEach(item => {
        if (item === "hr") {
            container.appendChild(document.createElement("hr"));
            return;
        }

        const card = document.createElement("div");
        card.className = "card m-1 mb-3 p-2 shadow bg-light";

        const content = document.createElement("div");
        content.className = item.class;
        content.textContent = item.label;

        card.appendChild(content);
        container.appendChild(card);
    });
}

export {
    renderRightContent,
    renderRightOffcanvas,
    renderRightOffcanvasContent
}