/* ============================================================
   U-case — navbar responsive + panier WhatsApp
   ============================================================ */

const WHATSAPP_NUMBER = "237651487883"; // code pays + numéro

/* ---------- Animations au scroll (hero) ---------- */
(function heroScrollAnim() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const anims = hero.querySelectorAll(".anim");
  if (!anims.length) return;

  if (!("IntersectionObserver" in window)) {
    anims.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const setIn = (v) =>
    anims.forEach((el) => el.classList.toggle("is-in", v));

  let armed = false;
  const io = new IntersectionObserver(
    (entries) => {
      const inView = entries[entries.length - 1].isIntersecting;
      if (armed) {
        setIn(inView);
        return;
      }
      armed = true;
      // laisser le navigateur peindre l'état caché avant de lancer la transition
      requestAnimationFrame(() => requestAnimationFrame(() => setIn(inView)));
    },
    { threshold: 0.2 }
  );
  io.observe(hero);
})();

/* ---------- Révélation au défilement (reste de la page) ---------- */
(function scrollReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      requestAnimationFrame(() => {
        entries.forEach((e) =>
          e.target.classList.toggle("is-in", e.isIntersecting)
        );
      });
    },
    { threshold: 0, rootMargin: "0px 0px -10% 0px" }
  );

  els.forEach((el) => io.observe(el));
})();

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
// Migration : les anciens paniers n'ont pas de modèle -> on repart à zéro.
if (cart.some((i) => !i.model)) {
  cart = [];
  saveCart(cart);
}

const sameLine = (i, name, model) => i.name === name && i.model === model;

function addToCart(name, price, qty = 1, model = "") {
  const line = cart.find((i) => sameLine(i, name, model));
  if (line) {
    line.qty += qty;
  } else {
    cart.push({ name, model, price, qty });
  }
  saveCart(cart);
  renderCart();
}

function setQty(name, model, delta) {
  const line = cart.find((i) => sameLine(i, name, model));
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter((i) => !sameLine(i, name, model));
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
    (i) =>
      `• ${i.name} (${i.model}) × ${i.qty} — ${fmt(i.price * i.qty)}`
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
      <div class="cart-item" data-name="${escapeHtml(i.name)}" data-model="${escapeHtml(i.model)}">
        <div class="cart-item__info">
          <div class="cart-item__name">${escapeHtml(i.name)}</div>
          <div class="cart-item__model">${escapeHtml(i.model)}</div>
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
    const row = btn.closest(".cart-item");
    setQty(row.dataset.name, row.dataset.model, btn.dataset.act === "inc" ? 1 : -1);
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
// teaser = phrase courte sur la carte ; spec = description complète dans la fiche.
const PRODUCTS = [
  // NOTE : produits et prix provisoires — à remplacer par le vrai catalogue.
  { name: "Lys Bleu", teaser: "Transparente, lys bleu peint main, contour bleu marine.", spec: "Coque transparente à motif floral, lys bleu peint à la main. Contour renforcé bleu marine, compatible MagSafe, protection caméra surélevée.", price: 5000, cat: "coques", badge: "Nouveau", featured: true, img: "images/Lys%20Bleu.png",
    models: ["iPhone 12", "iPhone 12 Pro", "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Plus", "iPhone 16 Plus", "iPhone 16 Pro Max", "iPhone 17", "iPhone 17 Pro Max"] },
  { name: "Série Cuir", teaser: "Cuir grainé façon python, noir brillant, coins renforcés.", spec: "Cuir grainé façon python, noir profond au fini brillant. Prise en main souple, coins renforcés, boutons métallisés et compatibilité MagSafe.", price: 5000, cat: "coques", featured: true, img: "images/serie%20cuir.png",
    models: ["iPhone 12", "iPhone 12 Pro", "iPhone 14 Pro Max", "iPhone 17"] },
  { name: "Silicone Mat", teaser: "Silicone doux, fini mat anti-traces. Plusieurs teintes.", spec: "Silicone doux au toucher, fini mat anti-traces. Intérieur microfibre et contour caméra surélevé. Noir, rose poudré, crème et autres teintes.", price: 4000, cat: "coques", badge: "Top vente", img: "images/silicone%20mat.png",
    models: ["iPhone 17 Pro Max"] },
  { name: "Coque Transparente", teaser: "Transparente anti-jaunissement, croix imprimée et verset.", spec: "Transparente anti-jaunissement, croix fine imprimée et verset « Psalms 46:5 — God is within her, she will not fall ». Bords renforcés, boutons précis.", price: 4500, cat: "coques", img: "images/coque%20transparente.png" },
  { name: "Écaille Ambrée", teaser: "Effet écaille de tortue ambrée, grip trois billes intégré.", spec: "Coque effet écaille de tortue ambrée, avec grip décoratif intégré à trois billes (ambre, noir, léopard). Finition brillante, contour rigide translucide.", price: 7000, cat: "coques", badge: "Nouveau", img: "images/%C3%89caille%20Ambr%C3%A9e.png" },
  { name: "Zèbre Fuchsia", teaser: "Motif zèbre rose fuchsia et noir, contour noir mat.", spec: "Coque rigide à motif zèbre rose fuchsia et noir, finition brillante. Contour noir mat, protection caméra intégrée.", price: 4000, cat: "coques", badge: "Nouveau", img: "images/Z%C3%A8bre%20Fuchsia.png",
    models: ["iPhone 12", "iPhone 12 Pro", "iPhone 13 Pro", "iPhone 15", "iPhone 15 Plus", "iPhone 16 Plus", "iPhone 16 Pro Max"] },
  { name: "Léopard Menthe", teaser: "Léopard menthe & marron, dragonne corde tressée assortie.", spec: "Coque rigide brillante à motif léopard menthe et marron, avec dragonne en corde tressée assortie et mousqueton métallique. Protection caméra intégrée.", price: 7500, cat: "coques", badge: "Nouveau", img: "images/L%C3%A9opard%20Menthe.png" },
  { name: "Tweed Chic", teaser: "Dos en tweed pied-de-poule, contour noir, dragonne cuir à pompon.", spec: "Coque à dos en tissu tweed pied-de-poule (beige, noir, rouge, kaki), contour rigide noir. Livrée avec dragonne en cuir à pompon et breloque cœur.", price: 7500, cat: "coques", badge: "Nouveau", img: "images/tweed-chic.png" },
  { name: "Cœur Anatomique", teaser: "Transparente rose, cœur anatomique illustré et citation.", spec: "Coque transparente rose à illustration de cœur anatomique et citation imprimée. Livrée avec cache-objectif et film de protection d'écran assortis.", price: 6000, cat: "coques", badge: "Nouveau", img: "images/coeur-atomique.png" },
  { name: "Suédine Camel", teaser: "Grain suédine camel doux au toucher, boutons et tour caméra dorés.", spec: "Une coque volontairement épurée, où la texture fait tout le travail : un grain suédine doux au toucher, dans un camel chaud, associé à des touches dorées sur les boutons et le tour caméra. Pensée pour celles et ceux qui veulent une protection discrète mais qui ne fait pas « plastique ».", price: 8000, cat: "coques", badge: "Nouveau", img: "images/suedine%20camel.png" },
  { name: "Cœurs Believe", teaser: "Pluie de petits cœurs bicolores sur fond transparent, citation au dos.", spec: "Une coque légère et positive, avec une pluie de petits cœurs bicolores sur fond transparent et une citation encourageante (« Believe in yourself, and you will be unstoppable. ») imprimée au dos. Simple, mais avec un vrai message.", price: 5500, cat: "coques", badge: "Nouveau", img: "images/coeur%20believe.png" },
  { name: "Trio Nœuds Roses", teaser: "Lot de 3 : rose rayé, noir à nœuds et cœurs, écru graphique.", spec: "Trois façons de porter le même thème : le rose à fines rayures pour un look doux, le noir avec nœuds et cœurs pour plus de contraste, l'écru aux nœuds dessinés en grand format pour un rendu plus graphique. Idéal pour varier selon l'humeur ou pour offrir en lot.", price: 4000, cat: "coques", badge: "Nouveau", img: "images/trio%20noeud%20rose.png",
    models: ["iPhone 17 Pro Max"] },
  { name: "Matelassé Noir", teaser: "Matelassage capitonné, clous strassés, bracelet de perles amovible.", spec: "Une coque au rendu haute couture : matelassage façon cuir capitonné, clous strassés au fil du motif, et contour caméra entièrement serti. Le bracelet en perles amovible, terminé par un nœud et un mousqueton, ajoute une vraie pièce d'accessoire — pas juste une dragonne fonctionnelle.", price: 9500, cat: "coques", badge: "Nouveau", img: "images/matelass%C3%A9-noir.png" },
  { name: "Trio Vintage", teaser: "Lot de 3 : nœuds sur rose, pois noirs sur écru, rayures rose et noir.", spec: "Un mini-vestiaire de motifs intemporels revisités : le nœud romantique, le pois graphique, la rayure marinière détournée en rose et noir. Trois pièces qui peuvent se porter séparément ou en collection, avec une identité commune facile à reconnaître.", price: 4000, cat: "coques", badge: "Nouveau", img: "images/trio-vintage.png",
    models: ["iPhone 17 Pro Max"] },
  { name: "Minou Kawaii 3D", teaser: "Silicone épais rose, gros nœud sculpté 3D, chat blanc à cœurs et étoiles.", spec: "Une coque ludique en silicone épais, avec un gros nœud sculpté en 3D au niveau du bloc caméra et une illustration de chat blanc à cœurs et étoiles. Un format qui plaît surtout pour son côté kawaii et tactile.", price: 7000, cat: "coques", badge: "Nouveau", img: "images/hello-kitty.png" },
  { name: "Câble Tressé 2 m", teaser: "USB-C tressé kevlar, 2 mètres.", spec: "Câble USB-C vers USB-C de 2 m, gaine tressée kevlar résistante aux nœuds. Charge et transfert de données.", price: 5000, cat: "cables", featured: true },
  { name: "Câble Tressé 1 m", teaser: "USB-C tressé, format compact 1 mètre.", spec: "Câble USB-C vers USB-C de 1 m, gaine tressée, format compact pour le sac ou la voiture.", price: 3500, cat: "cables" },
  { name: "Chargeur 45 W", teaser: "Deux ports, format nomade, charge rapide.", spec: "Chargeur secteur 45 W à deux ports USB-C, format nomade. Charge rapide iPhone et compatible ordinateur portable léger.", price: 12000, cat: "chargeurs", badge: "Top vente", featured: true },
  { name: "Chargeur MagSafe 15 W", teaser: "Recharge sans fil aimantée 15 W.", spec: "Chargeur sans fil aimanté 15 W, alignement automatique sur l'iPhone. Câble intégré.", price: 10000, cat: "chargeurs" },
  { name: "Pochette Zippée", teaser: "Range chargeur + 2 câbles.", spec: "Pochette zippée compacte pour ranger un chargeur et deux câbles. Intérieur avec passants élastiques.", price: 4500, cat: "sacoches" },
  { name: "Trousse Voyage", teaser: "Compartiments rigides pour vos accessoires.", spec: "Trousse de voyage à compartiments rigides pour chargeur, câbles, écouteurs et batterie externe.", price: 7000, cat: "sacoches" },
];

const productByName = (name) => PRODUCTS.find((p) => p.name === name);

// Modèles d'iPhone en stock (base + Pro + Pro Max, générations 11 à 17).
const IPHONE_MODELS = [];
["11", "12", "13", "14", "15", "16", "17"].forEach((g) => {
  IPHONE_MODELS.push(`iPhone ${g}`, `iPhone ${g} Pro`, `iPhone ${g} Pro Max`);
});
// Par défaut une coque va sur tous les modèles ; `p.models` restreint la liste.
const modelsFor = (p) => (p.models && p.models.length ? p.models : IPHONE_MODELS);
const shortModel = (m) => m.replace("iPhone ", "");

const CATEGORY_LABELS = {
  coques: "Coques iPhone",
  cables: "Câbles",
  chargeurs: "Chargeurs",
  sacoches: "Sacoches de charge",
};

const PAGE_SIZE = 8;
const productGridEl = document.getElementById("product-grid");
const catalogMetaEl = document.getElementById("catalog-meta");
const showMoreEl = document.getElementById("show-more");
const filterChips = document.querySelectorAll(".filter-chip");

let activeFilter = "all";
let shownCount = PAGE_SIZE;

function filteredList(filter) {
  return filter === "all"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.cat === filter);
}

function badgeHtml(p) {
  if (!p.badge) return "";
  const cls =
    p.badge.toLowerCase() === "nouveau" ? "tag--blue" : "tag--dark";
  return `<span class="${cls}">${escapeHtml(p.badge.toUpperCase())}</span>`;
}

function compatLabel(p) {
  const m = modelsFor(p);
  const gen = (s) => (s.match(/iPhone (\d+)/) || [])[1];
  const a = gen(m[0]);
  const b = gen(m[m.length - 1]);
  return a === b ? `iPhone ${a}` : `iPhone ${a} – ${b}`;
}

function productCard(p) {
  const n = escapeHtml(p.name);
  const media = p.img
    ? `<img class="product__img" src="${p.img}" alt="${n}" loading="lazy">`
    : "";
  return `
    <article class="product">
      <button class="product__open" type="button" data-name="${n}" aria-label="Voir les détails : ${n}">
        <span class="product__media${p.img ? " has-img" : ""}">${media}${badgeHtml(p)}</span>
      </button>
      <div class="product__body">
        <div class="product__row">
          <span class="product__name">${n}</span>
          <span class="product__price">${fmt(p.price)}</span>
        </div>
        <p class="product__teaser">${escapeHtml(p.teaser || p.spec)}</p>
        <p class="product__compat">${compatLabel(p)}</p>
        <button class="product__open product__details" type="button" data-name="${n}">Voir les détails</button>
      </div>
    </article>`;
}

function renderProducts() {
  const list = filteredList(activeFilter);
  const visible = list.slice(0, shownCount);

  productGridEl.innerHTML = list.length
    ? visible.map(productCard).join("")
    : `<p class="product-empty">${
        CATEGORY_LABELS[activeFilter] || "Cette catégorie"
      } — bientôt disponible.</p>`;

  if (showMoreEl) {
    const remaining = list.length - visible.length;
    showMoreEl.hidden = remaining <= 0;
    showMoreEl.textContent = `Afficher les ${remaining} autres`;
  }

  filterChips.forEach((chip) =>
    chip.setAttribute(
      "aria-pressed",
      chip.dataset.category === activeFilter ? "true" : "false"
    )
  );
}

function setFilter(filter) {
  activeFilter = filter;
  shownCount = PAGE_SIZE;
  renderProducts();
}

if (productGridEl) {
  if (catalogMetaEl) {
    catalogMetaEl.textContent = `COQUES + ACCESSOIRES — ${PRODUCTS.length} RÉFÉRENCES`;
  }

  // Compteur par catégorie sur les puces : « Coques (5) »
  filterChips.forEach((chip) => {
    const n = filteredList(chip.dataset.category).length;
    chip.textContent = `${chip.textContent.trim()} (${n})`;
  });

  renderProducts();

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => setFilter(chip.dataset.category));
  });

  if (showMoreEl) {
    showMoreEl.addEventListener("click", () => {
      shownCount = filteredList(activeFilter).length;
      renderProducts();
    });
  }

  // Délégation : ouvrir la fiche produit (la grille est régénérée)
  productGridEl.addEventListener("click", (e) => {
    const openBtn = e.target.closest(".product__open");
    if (openBtn) openProductModal(openBtn.dataset.name);
  });
}

/* ---------- Fiche produit (modale) ---------- */
const pmodal = document.getElementById("pmodal");
const pmEls = pmodal && {
  img: document.getElementById("pmodal-img"),
  badge: document.getElementById("pmodal-badge"),
  name: document.getElementById("pmodal-name"),
  desc: document.getElementById("pmodal-desc"),
  price: document.getElementById("pmodal-price"),
  models: document.getElementById("pmodal-model-list"),
  qty: document.getElementById("pmodal-qty"),
  add: document.getElementById("pmodal-add"),
};
let pmProduct = null;
let pmQty = 1;
let pmModel = null;

function pmRefresh() {
  if (!pmProduct) return;
  pmEls.qty.textContent = pmQty;
  if (pmModel) {
    pmEls.add.disabled = false;
    pmEls.add.textContent = `Ajouter au panier — ${fmt(pmProduct.price * pmQty)}`;
  } else {
    pmEls.add.disabled = true;
    pmEls.add.textContent = "Choisissez un modèle";
  }
}

function pmRenderModels() {
  pmEls.models.innerHTML = modelsFor(pmProduct)
    .map(
      (m) =>
        `<button type="button" class="pmodal__model-chip" data-model="${escapeHtml(
          m
        )}" aria-pressed="false">${escapeHtml(shortModel(m))}</button>`
    )
    .join("");
}

function openProductModal(name) {
  const p = productByName(name);
  if (!p || !pmodal) return;
  pmProduct = p;
  pmQty = 1;
  pmModel = null;
  pmRenderModels();

  if (p.img) {
    pmEls.img.src = p.img;
    pmEls.img.alt = p.name;
    pmEls.img.hidden = false;
  } else {
    pmEls.img.hidden = true;
  }
  pmEls.badge.hidden = !p.badge;
  if (p.badge) {
    pmEls.badge.textContent = p.badge.toUpperCase();
    pmEls.badge.className =
      "pmodal__badge " +
      (p.badge.toLowerCase() === "nouveau" ? "tag--blue" : "tag--dark");
  }
  pmEls.name.textContent = p.name;
  pmEls.desc.textContent = p.spec;
  pmEls.price.textContent = fmt(p.price);
  pmRefresh();

  pmodal.hidden = false;
  requestAnimationFrame(() => pmodal.classList.add("open"));
  pmodal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  if (!pmodal) return;
  pmodal.classList.remove("open");
  pmodal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setTimeout(() => {
    pmodal.hidden = true;
  }, 220);
}

if (pmodal) {
  pmodal.querySelectorAll("[data-pmodal-close]").forEach((el) =>
    el.addEventListener("click", closeProductModal)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !pmodal.hidden) closeProductModal();
  });
  pmodal.querySelectorAll("[data-q]").forEach((btn) =>
    btn.addEventListener("click", () => {
      pmQty = Math.max(1, pmQty + (btn.dataset.q === "inc" ? 1 : -1));
      pmRefresh();
    })
  );
  pmEls.models.addEventListener("click", (e) => {
    const chip = e.target.closest(".pmodal__model-chip");
    if (!chip) return;
    pmModel = chip.dataset.model;
    pmEls.models
      .querySelectorAll(".pmodal__model-chip")
      .forEach((c) => c.setAttribute("aria-pressed", c === chip ? "true" : "false"));
    pmRefresh();
  });
  pmEls.add.addEventListener("click", () => {
    if (!pmProduct || !pmModel) return;
    addToCart(pmProduct.name, pmProduct.price, pmQty, pmModel);
    closeProductModal();
    openCart();
  });
}
