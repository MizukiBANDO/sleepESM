import { menuItems } from './setting/content-left.js'

function renderSidebar(items, containerId = "left-content") {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    items.forEach(item => {
        if (item === "hr") {
            container.appendChild(document.createElement("hr"));
            return;
        }

        const row = document.createElement("div");
        row.className = "row text-left";

        const link = document.createElement("a");
        link.className = "nav-item nav-link align-items-center";
        link.href = item.url;
        link.dataset.link = true;

        link.innerHTML = `
            <i class="bi ${item.icon} icon-large2"></i>
            <span class="d-none d-xxl-inline icon-large fw-bold">　${item.label}</span>
        `;

        row.appendChild(link);
        container.appendChild(row);
    });
}

function renderLeftOffcanvas(containerId = "leftOffcanvas") {
    const container = document.getElementById(containerId);

    container.innerHTML = `
        <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasLeft" aria-labelledby="offcanvasLeftLabel">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title" id="offcanvasLeftLabel">NemLog Web</h5>
                <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body" id="offcanvasLeftBody"></div>
        </div>
    `;

    renderOffcanvasMenu(menuItems, "offcanvasLeftBody");
}

function renderOffcanvasMenu(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    items.forEach(item => {
        if (item === "hr") {
            container.appendChild(document.createElement("hr"));
            return;
        }

        const row = document.createElement("div");
        row.className = "row";

        const link = document.createElement("a");
        link.className = "nav-item nav-link d-flex align-items-center";
        link.href = item.url;
        link.dataset.link = true;

        link.innerHTML = `
            　<i class="bi ${item.icon} icon-large2"></i>
            <span class="icon-large fw-bold">　${item.label}</span>
        `;

        // ✅ オフキャンバスを閉じる処理を追加
        link.addEventListener("click", () => {
            const offcanvasEl = document.getElementById("offcanvasLeft");
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl)
                || new bootstrap.Offcanvas(offcanvasEl);
            bsOffcanvas.hide();
        });

        row.appendChild(link);
        container.appendChild(row);
    });
}


export {
    renderSidebar,
    renderLeftOffcanvas,
    renderOffcanvasMenu
}