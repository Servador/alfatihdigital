// === FETCH PRODUK DARI BACKEND ===
// === FETCH PRODUK DARI BACKEND ===
let allProducts = []; // ✅ simpan global

async function loadProducts() {
  const res = await fetch("/api/products");
  const data = await res.json();
  allProducts = data; // ✅ simpan semua produk untuk filter
  renderProducts(data);
}

// === RENDER PRODUK ===
function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h4>${p.name}</h4>
      <p class="${p.stock > 0 ? '' : 'stock-empty'}">
  Stock: ${p.stock ?? 0}
</p>

<div class="price-buy">
  <button 
    ${p.stock > 0 ? `onclick='openPackagePopup(${JSON.stringify(p)})'` : 'disabled'}
    class="${p.stock > 0 ? '' : 'btn-disabled'}">
    ${p.stock > 0 ? 'Beli Sekarang' : 'Stok Habis'}
  </button>
</div>
    `;
    grid.appendChild(card);
  });
}

function openPackagePopup(product) {
  const popup = document.getElementById("popup");
  const title = document.getElementById("popupTitle");
  const listContainer = document.getElementById("variantList");

  popup.classList.remove("hidden");
  title.textContent = product.name;
  listContainer.innerHTML = "";

  const list = product.variants || [];
  let selectedVariant = null;

  if (list.length > 0) {
  list.forEach(pkg => {
    const btn = document.createElement("button");
    const stok = pkg.stock ?? 0;

    btn.className = "pkg-btn";
    btn.innerHTML = `
  <div style="display:flex; justify-content:space-between;">
    <span>${pkg.title}</span>
    <span style="font-weight:bold;">Rp ${(+pkg.price).toLocaleString("id-ID")}</span>
  </div>
  <small style="color:#555;">📦 Stok: ${stok}</small>
`;

    if (stok <= 0) {
      btn.classList.add("disabled");
      btn.style.opacity = 0.45;
      btn.style.cursor = "not-allowed";
      btn.onclick = () => alert("Stok habis! Silahkan pilih paket lain.");
    } else {
      btn.onclick = () => {
        document.querySelectorAll(".pkg-btn").forEach(b =>
          b.classList.remove("active")
        );
        btn.classList.add("active");
        selectedVariant = pkg;
      };
    }

    listContainer.appendChild(btn);
  });
} else {
  listContainer.innerHTML = `
    <p style="text-align:center; font-size:14px;">⚠ Belum ada paket tersedia.</p>
  `;
}

  // ✅ Tombol aksi
  const actionBox = document.createElement("div");
  actionBox.className = "popup-actions";
  actionBox.innerHTML = `
    <button class="cancel-btn">Batal</button>
    <button class="continue-btn">Lanjut</button>
  `;
  listContainer.appendChild(actionBox);

  actionBox.querySelector(".cancel-btn").onclick = () =>
    popup.classList.add("hidden");

  actionBox.querySelector(".continue-btn").onclick = () => {
    if (!selectedVariant) return alert("Silahkan pilih paket terlebih dahulu!");

    localStorage.setItem("checkoutData", JSON.stringify({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price
    }));

    popup.classList.add("hidden");
    window.location.href = "checkout.html";
  };

  document.getElementById("closePopup").onclick = () =>
    popup.classList.add("hidden");
}

// === CEK PESANAN ===
function checkOrder() {
  const popup = document.createElement("div");
  popup.className = "info-popup";
  popup.innerHTML = `
    <div class="info-popup-content">
      <h3>🔎 Cek Pesanan</h3>
      <p>Masukkan ID pesanan kamu:</p>
      <input id="orderIdInput" type="text" placeholder="Contoh: NV12345" style="padding:8px;width:80%;border-radius:6px;border:1px solid #ccc;"><br><br>
      <button onclick="searchOrder()">Cek Sekarang</button>
      <div id="orderResult" style="margin-top:10px;font-size:13px;"></div>
      <button style="background:#aaa;margin-top:12px;" onclick="this.closest('.info-popup').remove()">Tutup</button>
    </div>
  `;
  document.body.appendChild(popup);
}

async function searchOrder() {
  const input = document.getElementById("orderIdInput").value.trim();
  if (!input) return;

  // ✅ Hilangkan NV & ambil angka
  let id = input.toUpperCase().replace("NV", "");
  id = parseInt(id);

  if (isNaN(id)) {
    document.getElementById("orderResult").innerHTML =
      `<p style="color:red;">⚠ ID tidak valid!</p>`;
    return;
  }

  try {
    const res = await fetch("/api/orders/" + id);
    const order = await res.json();
    const result = document.getElementById("orderResult");

    if (order) {
  const statusClass = {
    pending: "status-pending",
    paid: "status-paid",
    done: "status-done",
    canceled: "status-canceled"
  }[order.status] || "status-pending";

  result.innerHTML = `
    <div class="inv-box">
      <p><b>ID Pesanan:</b> NV${String(order.id).padStart(5,"0")}</p>
      <p><b>Nama:</b> ${order.name}</p>
      <p><b>Produk:</b> ${order.product_name}</p>
      <p><b>Paket:</b> ${order.variant_title}</p>
      <p><b>Total:</b> Rp ${order.total.toLocaleString("id-ID")}</p>
      <p><b>Status:</b> 
        <span class="status-badge ${statusClass}">
          ${order.status}
        </span>
      </p>
      <p style="font-size:12px;margin-top:6px;color:#666;">
        Tanggal: ${new Date(order.createdAt).toLocaleString("id-ID")}
      </p>
    </div>
  `;
} else {
  result.innerHTML = `<p style="color:red;">❌ ID pesanan tidak ditemukan.</p>`;
}

    const noOrder = `NV${String(order.id).padStart(5, "0")}`;

    result.innerHTML = `
      <div style="margin-top:10px;text-align:left;">
        <p><b>ID Pesanan:</b> ${noOrder}</p>
        <p><b>Nama:</b> ${order.name}</p>
        <p><b>Produk:</b> ${order.product_name}</p>
        <p><b>Paket:</b> ${order.variant_title}</p>
        <p><b>Total:</b> Rp ${order.total.toLocaleString("id-ID")}</p>
        <p><b>Status:</b> <strong>${order.status.toUpperCase()}</strong></p>
        <p><b>Tanggal:</b> ${new Date(order.createdAt).toLocaleString("id-ID")}</p>
      </div>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById("orderResult").innerHTML =
      `<p style="color:red;">⚠ Server Error!</p>`;
  }
}

// === CARA ORDER ===
function showGuide() {
  const popup = document.createElement("div");
  popup.className = "info-popup";
  popup.innerHTML = `
    <div class="info-popup-content">
      <h3>🛒 Cara Order</h3>
      <p style="text-align:left; font-size:14px;">
        1️⃣ Pilih produk yang diinginkan<br>
        2️⃣ Klik <b>Beli Sekarang</b><br>
        3️⃣ Pilih paket lalu lanjut ke checkout<br>
        4️⃣ Bayar melalui QRIS<br>
        5️⃣ Tunggu konfirmasi admin
      </p>
      <button onclick="this.closest('.info-popup').remove()">Tutup</button>
    </div>
  `;
  document.body.appendChild(popup);
}

// === SEARCH PRODUK ===
document.getElementById("searchBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const res = await fetch("/api/products");
  const data = await res.json();
  const filtered = data.filter(p => p.name.toLowerCase().includes(keyword));
  renderProducts(filtered);
});

// === FILTER KATEGORI ===
function filterCategory(cat) {
  // 🔥 Hapus highlight kategori dulu
  document.querySelectorAll(".cat").forEach(el => el.classList.remove("active"));

  // ✅ Kasih highlight ke tombol yang diklik
  const clicked = document.activeElement;
  clicked.classList.add("active");

  // ✅ Tampilkan semua
  if (cat === 'all') {
    renderProducts(allProducts);
    return;
  }

  // ✅ Filter sesuai kategori
  const filtered = allProducts.filter(p => p.category === cat);
  renderProducts(filtered);
}

// === LOAD SAAT AWAL ===
window.onload = loadProducts;
