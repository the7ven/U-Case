/* ============================================================
   U-case — navbar responsive + panier WhatsApp
   ============================================================ */

const WHATSAPP_NUMBER = "237651487883"; // code pays + numéro

/* ---------- Navbar responsive : menu hamburger ---------- */
const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");

if (hamburger && mobileMenu) {
  const closeMenu = () => {
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
  };

  hamburger.addEventListener("click", () => {
    const isOpen = hamburger.classList.toggle("active");
    mobileMenu.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });
}

/* ---------- Panier ---------- */
const CART_KEY = "ucase_cart";

const cartToggle = document.getElementById("cart-toggle");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartClose = document.getElementById("cart-close");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartWaEl = document.getElementById("cart-wa");
const cartClearEl = document.getElementById("cart-clear");
const cartCountEls = document.querySelectorAll(".cart-count");

/* ---------- Confirmation (thème du site) ---------- */
const confirmEl = document.getElementById("confirm");
const confirmOkEl = document.getElementById("confirm-ok");
let confirmCb = null;

function closeConfirm() {
  if (!confirmEl) return;
  confirmEl.classList.remove("open");
  setTimeout(() => {
    confirmEl.hidden = true;
  }, 200);
  confirmCb = null;
}

function askConfirm(onYes) {
  if (!confirmEl) {
    onYes();
    return;
  }
  confirmCb = onYes;
  confirmEl.hidden = false;
  requestAnimationFrame(() => confirmEl.classList.add("open"));
}

if (confirmEl) {
  confirmEl.querySelectorAll("[data-confirm-cancel]").forEach((el) =>
    el.addEventListener("click", closeConfirm)
  );
  confirmOkEl.addEventListener("click", () => {
    const cb = confirmCb;
    closeConfirm();
    if (cb) cb();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !confirmEl.hidden) closeConfirm();
  });
}

/* ---------- Toast (thème du site) ---------- */
const toastEl = document.getElementById("toast");
const toastMsgEl = toastEl ? toastEl.querySelector(".toast__msg") : null;
const toastActionEl = document.getElementById("toast-action");
let toastTimer;

function hideToast() {
  clearTimeout(toastTimer);
  if (!toastEl) return;
  toastEl.classList.remove("show");
  setTimeout(() => {
    toastEl.hidden = true;
  }, 250);
}

function showToast(message, actionLabel, onAction) {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastMsgEl.textContent = message;
  if (actionLabel) {
    toastActionEl.textContent = actionLabel;
    toastActionEl.hidden = false;
    toastActionEl.onclick = () => {
      hideToast();
      if (onAction) onAction();
    };
  } else {
    toastActionEl.hidden = true;
  }
  toastEl.hidden = false;
  requestAnimationFrame(() => toastEl.classList.add("show"));
  toastTimer = setTimeout(hideToast, 5000);
}

const fmt = (n) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    /* stockage indisponible */
  }
}

let cart = loadCart();

function addToCart(name, price) {
  const line = cart.find((i) => i.name === name);
  if (line) {
    line.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart(cart);
  renderCart();
}

function setQty(name, delta) {
  const line = cart.find((i) => i.name === name);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter((i) => i.name !== name);
  saveCart(cart);
  renderCart();
}

function clearCart() {
  const previous = cart.slice();
  cart = [];
  saveCart(cart);
  renderCart();
  showToast("Panier vidé", "Annuler", () => {
    cart = previous;
    saveCart(cart);
    renderCart();
  });
}

function cartCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function whatsappHref() {
  const lines = cart.map(
    (i) => `• ${i.name} × ${i.qty} — ${fmt(i.price * i.qty)}`
  );
  const msg =
    "Bonjour U-case ! Je souhaite commander :\n\n" +
    lines.join("\n") +
    `\n\nTotal : ${fmt(cartTotal())}` +
    "\n\nMerci de me confirmer la disponibilité et le délai de livraison.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function renderCart() {
  const count = cartCount();
  cartCountEls.forEach((el) => (el.textContent = count));

  cartClearEl.hidden = cart.length === 0;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Votre panier est vide.</p>';
    cartWaEl.classList.add("is-disabled");
    cartWaEl.setAttribute("aria-disabled", "true");
    cartWaEl.removeAttribute("href");
  } else {
    cartItemsEl.innerHTML = cart
      .map(
        (i) => `
      <div class="cart-item" data-name="${escapeHtml(i.name)}">
        <div class="cart-item__info">
          <div class="cart-item__name">${escapeHtml(i.name)}</div>
          <div class="cart-item__unit">${fmt(i.price)} l'unité</div>
        </div>
        <div class="cart-item__qty">
          <button type="button" data-act="dec" aria-label="Retirer un">−</button>
          <span>${i.qty}</span>
          <button type="button" data-act="inc" aria-label="Ajouter un">+</button>
        </div>
      </div>`
      )
      .join("");
    cartWaEl.classList.remove("is-disabled");
    cartWaEl.removeAttribute("aria-disabled");
    cartWaEl.setAttribute("href", whatsappHref());
  }

  cartTotalEl.textContent = fmt(cartTotal());
}

function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

if (cartDrawer) {
  cartItemsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const name = btn.closest(".cart-item").dataset.name;
    setQty(name, btn.dataset.act === "inc" ? 1 : -1);
  });

  cartWaEl.addEventListener("click", (e) => {
    if (cartWaEl.classList.contains("is-disabled")) e.preventDefault();
  });

  cartClearEl.addEventListener("click", () => {
    if (cart.length) askConfirm(clearCart);
  });

  if (cartToggle) cartToggle.addEventListener("click", openCart);
  cartClose.addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (!confirmEl || confirmEl.hidden)) closeCart();
  });

  renderCart();
}

/* ---------- Catalogue par catégorie ---------- */
const PRODUCTS = [
  // NOTE : produits et prix provisoires — à remplacer par le vrai catalogue.
  { name: "Monolithe Aluminium", spec: "iPhone 17 Pro — Graphite anodisé", price: 9000, cat: "coques", badge: "Nouveau", featured: true },
  { name: "Série Cuir", spec: "iPhone 15 · 16 · 17 — Cuir pleine fleur", price: 8000, cat: "coques", featured: true },
  { name: "Silicone Mat", spec: "iPhone 13 → 17 — 6 coloris", price: 5000, cat: "coques", badge: "Top vente" },
  { name: "Coque Transparente", spec: "iPhone 12 → 17 — anti-jaunissement", price: 4500, cat: "coques" },
  { name: "Câble Tressé 2 m", spec: "USB-C — gaine kevlar", price: 5000, cat: "cables", featured: true },
  { name: "Câble Tressé 1 m", spec: "USB-C — format compact", price: 3500, cat: "cables" },
  { name: "Chargeur 45 W", spec: "Deux ports — format nomade", price: 12000, cat: "chargeurs", badge: "Top vente", featured: true },
  { name: "Chargeur MagSafe 15 W", spec: "Sans fil — aimanté", price: 10000, cat: "chargeurs" },
  { name: "Pochette Zippée", spec: "Chargeur + 2 câbles", price: 4500, cat: "sacoches" },
  { name: "Trousse Voyage", spec: "Compartiments rigides", price: 7000, cat: "sacoches" },
];

const CATEGORY_LABELS = {
  coques: "Coques iPhone",
  cables: "Câbles",
  chargeurs: "Chargeurs",
  sacoches: "Sacoches de charge",
};

const productGridEl = document.getElementById("product-grid");
const productsTitleEl = document.getElementById("products-title");
const showAllEl = document.getElementById("show-all");
const catalogMetaEl = document.getElementById("catalog-meta");
const catalogRows = document.querySelectorAll(".catalog__row");

function productCard(p) {
  const tagClass =
    p.badge && p.badge.toLowerCase() === "nouveau" ? "tag--blue" : "tag--dark";
  const badge = p.badge
    ? `<span class="${tagClass}">${escapeHtml(p.badge.toUpperCase())}</span>`
    : "";
  return `
    <div class="product">
      <div class="product__media">${badge}</div>
      <div class="product__row product__row--tight">
        <div>
          <div class="product__name">${escapeHtml(p.name)}</div>
          <div class="product__spec">${escapeHtml(p.spec)}</div>
        </div>
        <div class="product__price">${fmt(p.price)}</div>
      </div>
      <button class="product__add" type="button" data-name="${escapeHtml(p.name)}" data-price="${p.price}">Ajouter au panier</button>
    </div>`;
}

let currentFilter = "featured";

function renderProducts(filter) {
  currentFilter = filter;
  let list;
  if (filter === "all") list = PRODUCTS;
  else if (filter === "featured") list = PRODUCTS.filter((p) => p.featured);
  else list = PRODUCTS.filter((p) => p.cat === filter);

  productGridEl.innerHTML = list.map(productCard).join("");
  productsTitleEl.textContent =
    filter === "featured"
      ? "Nouveautés & best-sellers"
      : filter === "all"
      ? "Tous les articles"
      : CATEGORY_LABELS[filter] || "Articles";

  if (showAllEl) {
    showAllEl.textContent =
      filter === "all" ? "← VOIR MOINS" : "TOUT VOIR →";
  }

  catalogRows.forEach((r) =>
    r.setAttribute(
      "aria-pressed",
      r.dataset.category === filter ? "true" : "false"
    )
  );
}

if (productGridEl) {
  if (catalogMetaEl) {
    catalogMetaEl.textContent = `COQUES + ACCESSOIRES — ${PRODUCTS.length} RÉFÉRENCES`;
  }

  renderProducts("featured");

  catalogRows.forEach((row) => {
    row.addEventListener("click", () => {
      const isActive = row.getAttribute("aria-pressed") === "true";
      renderProducts(isActive ? "featured" : row.dataset.category);
      productsTitleEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (showAllEl) {
    showAllEl.addEventListener("click", () => {
      renderProducts(currentFilter === "all" ? "featured" : "all");
      productsTitleEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Ajout au panier (délégation, la grille est régénérée)
  productGridEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".product__add");
    if (!btn) return;
    addToCart(btn.dataset.name, Number(btn.dataset.price));
    btn.classList.add("added");
    btn.textContent = "Ajouté ✓";
    setTimeout(() => {
      btn.classList.remove("added");
      btn.textContent = "Ajouter au panier";
    }, 1200);
    openCart();
  });
}
