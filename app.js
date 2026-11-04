/* ============================================================
   PokéCards · mini colección de cartas
   Sin dependencias: todo se guarda en localStorage.
   ============================================================ */

const STORAGE_KEY = "pokecards.v1";
const MAX_IMAGE_SIZE = 640;

const TYPES = {
  fuego:     { label: "Fuego",     emoji: "🔥", color: "#e8552f", soft: "#ffb27a" },
  agua:      { label: "Agua",      emoji: "💧", color: "#2f7de8", soft: "#8fd0ff" },
  planta:    { label: "Planta",    emoji: "🌿", color: "#3fa34d", soft: "#a8e6a1" },
  electrico: { label: "Eléctrico", emoji: "⚡", color: "#c79a00", soft: "#ffe680" },
  psiquico:  { label: "Psíquico",  emoji: "🔮", color: "#a44bd6", soft: "#e0b0ff" },
  oscuro:    { label: "Oscuro",    emoji: "🌙", color: "#4a4f63", soft: "#9aa0b8" },
  hada:      { label: "Hada",      emoji: "✨", color: "#e0568c", soft: "#ffb6d5" },
  normal:    { label: "Normal",    emoji: "⭐", color: "#8b93a7", soft: "#d3d8e6" },
};

// Tipo al que es débil cada tipo
const WEAKNESS = {
  fuego: "agua", agua: "planta", planta: "fuego", electrico: "normal",
  psiquico: "oscuro", oscuro: "hada", hada: "oscuro", normal: "electrico",
};

const RARITY_HOLO = new Set(["Épica", "Legendaria"]);
const RARITY_CLASS = {
  "Común": "rare-common",
  "Rara": "rare-rare",
  "Épica": "rare-epic",
  "Legendaria": "rare-legendary",
};

const SEED_CARDS = [
  {
    id: "seed-1", name: "Chispín", type: "fuego", hp: 70, rarity: "Rara", emoji: "🦊",
    desc: "Su cola chisporrotea cuando está contento. Le encanta dormir al sol.",
    attacks: [
      { name: "Ascua", damage: 20, cost: 1 },
      { name: "Llamarada", damage: 70, cost: 3 },
    ],
  },
  {
    id: "seed-2", name: "Aquín", type: "agua", hp: 80, rarity: "Común", emoji: "🐳",
    desc: "Nada en círculos para crear remolinos y jugar con las olas.",
    attacks: [
      { name: "Burbuja", damage: 20, cost: 1 },
      { name: "Marea", damage: 60, cost: 2 },
    ],
  },
  {
    id: "seed-3", name: "Brotito", type: "planta", hp: 60, rarity: "Rara", emoji: "🌱",
    desc: "La hoja de su cabeza crece un poco cada vez que recibe cariño.",
    attacks: [
      { name: "Hoja afilada", damage: 30, cost: 2 },
      { name: "Latigazo", damage: 50, cost: 2 },
    ],
  },
  {
    id: "seed-4", name: "Voltito", type: "electrico", hp: 60, rarity: "Épica", emoji: "🐭",
    desc: "Acumula electricidad en las mejillas. Un abrazo suyo puede dejarte peinado.",
    attacks: [
      { name: "Chispazo", damage: 30, cost: 1 },
      { name: "Trueno", damage: 90, cost: 3 },
    ],
  },
  {
    id: "seed-5", name: "Lunaris", type: "psiquico", hp: 90, rarity: "Legendaria", emoji: "🌙",
    desc: "Se dice que puede leer los sueños de quien la observa demasiado tiempo.",
    attacks: [
      { name: "Confusión", damage: 40, cost: 2 },
      { name: "Poder psíquico", damage: 100, cost: 3 },
    ],
  },
  {
    id: "seed-6", name: "Bombi", type: "hada", hp: 70, rarity: "Común", emoji: "🧚",
    desc: "Reparte polvo de estrellas a quien encuentra triste en el camino.",
    attacks: [
      { name: "Polvo mágico", damage: 20, cost: 1 },
      { name: "Beso drenaje", damage: 40, cost: 2 },
    ],
  },
];

/* ---------- Estado ---------- */
let cards = loadCards();
let activeType = "todos";
let searchTerm = "";
let detailId = null;
let pendingImage = null; // dataURL de la imagen seleccionada en el formulario

/* ---------- Referencias del DOM ---------- */
const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const counter = document.getElementById("counter");
const typeFilters = document.getElementById("typeFilters");
const searchInput = document.getElementById("searchInput");
const formModal = document.getElementById("formModal");
const detailModal = document.getElementById("detailModal");
const cardForm = document.getElementById("cardForm");
const typeSelect = document.getElementById("typeSelect");
const detailContent = document.getElementById("detailContent");
const deleteCardBtn = document.getElementById("deleteCardBtn");
const toastEl = document.getElementById("toast");

/* ---------- Utilidades ---------- */
function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SEED_CARDS);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : structuredClone(SEED_CARDS);
  } catch {
    return structuredClone(SEED_CARDS);
  }
}

function saveCards() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    return true;
  } catch {
    showToast("No hay espacio para guardar esa imagen 😢");
    return false;
  }
}

function uid() {
  return "card-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function typeInfo(key) {
  return TYPES[key] || TYPES.normal;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2400);
}

/* ---------- Render de cartas ---------- */
function buildCardBack() {
  const back = el("div", "card__face card__face--back");
  const swirl = el("div", "card__back-swirl");
  const oval = el("div", "card__back-oval");
  const topText = el("span", "card__back-title card__back-title--top", "POKÉCARDS");

  const ball = el("div", "card__back-ball");
  const ballTop = el("div", "card__back-ball-top");
  const ballBottom = el("div", "card__back-ball-bottom");
  const ballBelt = el("div", "card__back-ball-belt");
  const ballBtn = el("div", "card__back-ball-btn");
  ball.append(ballTop, ballBottom, ballBelt, ballBtn);

  const bottomText = el("span", "card__back-title card__back-title--bottom", "TRADING CARD GAME");

  oval.append(topText, ball, bottomText);
  back.append(swirl, oval);
  return back;
}

function buildCard(card, { detail = false } = {}) {
  const type = typeInfo(card.type);
  const article = el("article", "card");
  if (RARITY_HOLO.has(card.rarity)) article.classList.add("card--holo");
  article.style.setProperty("--type", type.color);
  article.style.setProperty("--type-soft", type.soft);
  article.dataset.id = card.id;

  const flipper = el("div", "card__flipper");
  const front = el("div", "card__face card__face--front");

  if (detail) {
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `${card.name}. Toca para girar la carta.`);
    const toggleFlip = () => article.classList.toggle("is-flipped");
    article.addEventListener("click", toggleFlip);
    article.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleFlip();
      }
    });

    // Giro 3D interactivo con el puntero en modo detalle
    article.addEventListener("mousemove", (e) => {
      if (article.classList.contains("is-flipped")) return;
      const rect = article.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = (-y / (rect.height / 2)) * 14;
      const rotY = (x / (rect.width / 2)) * 14;
      flipper.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    article.addEventListener("mouseleave", () => {
      if (!article.classList.contains("is-flipped")) {
        flipper.style.transform = "";
      }
    });
  } else {
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `${card.name}, carta de tipo ${type.label}. Ver detalle`);
    const triggerSpinAndOpen = () => {
      if (article.classList.contains("is-turning")) return;
      article.classList.add("is-turning");
      setTimeout(() => {
        article.classList.remove("is-turning");
        openDetail(card.id);
      }, 620);
    };
    article.addEventListener("click", triggerSpinAndOpen);
    article.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        triggerSpinAndOpen();
      }
    });
  }

  // Cabecera
  const top = el("div", "card__top");
  const topLeft = el("div");
  topLeft.append(
    el("p", "card__stage", "Básico"),
    el("h3", "card__name", card.name)
  );
  const hp = el("div", "card__hp");
  hp.append(el("span", "", "PS"), document.createTextNode(String(card.hp)));
  top.append(topLeft, hp);

  // Arte
  const art = el("div", "card__art");
  if (card.image) {
    const img = el("img");
    img.src = card.image;
    img.alt = `Ilustración de ${card.name}`;
    img.loading = "lazy";
    art.append(img);
  } else {
    art.append(el("span", "card__emoji", card.emoji || type.emoji));
  }
  const badge = el("span", "card__type-badge");
  badge.textContent = `${type.emoji} ${type.label}`;
  art.append(badge);

  // Descripción
  const desc = el("p", "card__desc", card.desc || "Una criatura misteriosa de la que aún se sabe muy poco.");

  // Ataques
  const attacks = el("div", "card__attacks");
  (card.attacks || []).forEach((attack) => {
    if (!attack || !attack.name) return;
    const row = el("div", "attack");
    const cost = el("div", "attack__cost");
    const count = Math.min(3, Math.max(1, Number(attack.cost) || 1));
    for (let i = 0; i < count; i++) cost.append(el("span", "energy"));
    row.append(
      cost,
      el("span", "attack__name", attack.name),
      el("span", "attack__damage", String(attack.damage ?? 0))
    );
    attacks.append(row);
  });

  // Pie
  const weaknessKey = WEAKNESS[card.type] || "normal";
  const footer = el("div", "card__footer");
  footer.append(
    el("span", "", `Debilidad · ${typeInfo(weaknessKey).label}`),
    el("span", `rarity ${RARITY_CLASS[card.rarity] || "rare-common"}`, `★ ${card.rarity || "Común"}`)
  );

  front.append(top, art, desc, attacks, footer);
  flipper.append(front, buildCardBack());
  article.append(flipper);
  return article;
}

function getFilteredCards() {
  const term = searchTerm.trim().toLowerCase();
  return cards.filter((card) => {
    const matchesType = activeType === "todos" || card.type === activeType;
    const matchesTerm =
      !term ||
      card.name.toLowerCase().includes(term) ||
      (card.desc || "").toLowerCase().includes(term);
    return matchesType && matchesTerm;
  });
}

function render() {
  grid.innerHTML = "";
  const visible = getFilteredCards();

  visible.forEach((card) => grid.append(buildCard(card)));

  emptyState.hidden = visible.length > 0;
  const total = cards.length;
  counter.innerHTML = total === 0
    ? ""
    : `Mostrando <strong>${visible.length}</strong> de <strong>${total}</strong> ${total === 1 ? "carta" : "cartas"}`;

  if (total > 0 && visible.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Sin resultados";
    emptyState.querySelector("p").textContent = "Prueba con otro nombre u otro tipo de carta.";
    document.getElementById("emptyNewBtn").textContent = "Limpiar filtros";
  } else {
    emptyState.querySelector("h2").textContent = "Tu colección está vacía";
    emptyState.querySelector("p").textContent = "Crea tu primera carta y empieza a armar tu colección.";
    document.getElementById("emptyNewBtn").textContent = "Crear carta";
  }
}

/* ---------- Filtros ---------- */
function buildFilters() {
  const options = [{ key: "todos", label: "Todas", emoji: "✨" }].concat(
    Object.entries(TYPES).map(([key, value]) => ({ key, label: value.label, emoji: value.emoji }))
  );

  options.forEach((option) => {
    const chip = el("button", "chip", `${option.emoji} ${option.label}`);
    chip.type = "button";
    chip.dataset.type = option.key;
    chip.setAttribute("aria-pressed", option.key === activeType ? "true" : "false");
    if (option.key === activeType) chip.classList.add("is-active");
    chip.addEventListener("click", () => {
      activeType = option.key;
      typeFilters.querySelectorAll(".chip").forEach((c) => {
        const active = c.dataset.type === activeType;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", String(active));
      });
      render();
    });
    typeFilters.append(chip);
  });
}

function buildTypeSelect() {
  Object.entries(TYPES).forEach(([key, value]) => {
    const option = el("option", "", `${value.emoji} ${value.label}`);
    option.value = key;
    typeSelect.append(option);
  });
}

/* ---------- Modales ---------- */
function openModal(modal) {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.hidden = true;
  document.body.style.overflow = "";
}

function openDetail(id) {
  const card = cards.find((item) => item.id === id);
  if (!card) return;
  detailId = id;
  detailContent.innerHTML = "";
  const cardEl = buildCard(card, { detail: true });
  const hintEl = el("p", "detail__hint", "🔄 Toca la carta para darle la vuelta (frente / dorso)");
  detailContent.append(cardEl, hintEl);
  openModal(detailModal);
}

function openForm() {
  cardForm.reset();
  pendingImage = null;
  const upload = cardForm.querySelector(".upload");
  upload.classList.remove("is-filled");
  upload.querySelector(".upload__label").textContent = "📁 Subir imagen desde tu equipo";
  cardForm.querySelector('[name="hp"]').value = 60;
  cardForm.querySelector('[name="type"]').value = "fuego";
  cardForm.querySelector('[name="emoji"]').placeholder = TYPES.fuego.emoji;
  openModal(formModal);
  setTimeout(() => cardForm.querySelector('[name="name"]').focus(), 60);
}

function openCreateFromEmpty() {
  if (cards.length > 0) {
    activeType = "todos";
    searchTerm = "";
    searchInput.value = "";
    typeFilters.querySelectorAll(".chip").forEach((c) => {
      const active = c.dataset.type === "todos";
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-pressed", String(active));
    });
    render();
    return;
  }
  openForm();
}

document.querySelectorAll("[data-close]").forEach((node) => {
  node.addEventListener("click", () => {
    const modal = node.closest(".modal");
    if (modal) closeModal(modal);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  [formModal, detailModal].forEach((modal) => {
    if (!modal.hidden) closeModal(modal);
  });
});

/* ---------- Imagen del formulario ---------- */
const fileInput = cardForm.querySelector('[name="imageFile"]');
const uploadBox = cardForm.querySelector(".upload");
const uploadLabel = uploadBox.querySelector(".upload__label");

fileInput.addEventListener("change", async () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) {
    pendingImage = null;
    uploadBox.classList.remove("is-filled");
    uploadLabel.textContent = "📁 Subir imagen desde tu equipo";
    return;
  }

  try {
    pendingImage = await resizeImage(file);
    uploadBox.classList.add("is-filled");
    uploadLabel.textContent = `✅ ${file.name}`;
  } catch {
    pendingImage = null;
    uploadBox.classList.remove("is-filled");
    uploadLabel.textContent = "📁 Subir imagen desde tu equipo";
    showToast("No se pudo leer esa imagen");
  }
});

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Archivo no válido"));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagen no válida"));
    };

    img.src = url;
  });
}

typeSelect.addEventListener("change", () => {
  const emojiField = cardForm.querySelector('[name="emoji"]');
  emojiField.placeholder = typeInfo(typeSelect.value).emoji;
});

/* ---------- Submit ---------- */
cardForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(cardForm);
  const name = String(data.get("name") || "").trim();

  if (!name) {
    showToast("Ponle un nombre a tu carta");
    cardForm.querySelector('[name="name"]').focus();
    return;
  }

  const type = String(data.get("type") || "normal");
  const hp = Math.min(300, Math.max(10, Number(data.get("hp")) || 60));
  const imageUrl = String(data.get("imageUrl") || "").trim();

  const attacks = [
    {
      name: String(data.get("atk1Name") || "").trim(),
      damage: Number(data.get("atk1Damage")) || 0,
      cost: Number(data.get("atk1Cost")) || 1,
    },
    {
      name: String(data.get("atk2Name") || "").trim(),
      damage: Number(data.get("atk2Damage")) || 0,
      cost: Number(data.get("atk2Cost")) || 2,
    },
  ].filter((attack) => attack.name);

  const card = {
    id: uid(),
    name,
    type,
    hp,
    rarity: String(data.get("rarity") || "Rara"),
    emoji: String(data.get("emoji") || "").trim() || typeInfo(type).emoji,
    image: pendingImage || imageUrl || "",
    desc: String(data.get("desc") || "").trim(),
    attacks,
    createdAt: new Date().toISOString(),
  };

  cards.unshift(card);
  if (!saveCards()) {
    cards.shift();
    return;
  }

  closeModal(formModal);
  activeType = "todos";
  searchTerm = "";
  searchInput.value = "";
  typeFilters.querySelectorAll(".chip").forEach((c) => {
    const active = c.dataset.type === "todos";
    c.classList.toggle("is-active", active);
    c.setAttribute("aria-pressed", String(active));
  });
  render();
  showToast(`¡${name} se unió a tu colección! 🎉`);
});

/* ---------- Eliminar ---------- */
deleteCardBtn.addEventListener("click", () => {
  const card = cards.find((item) => item.id === detailId);
  if (!card) return;
  if (!window.confirm(`¿Eliminar la carta "${card.name}"?`)) return;

  cards = cards.filter((item) => item.id !== detailId);
  saveCards();
  closeModal(detailModal);
  render();
  showToast("Carta eliminada");
});

/* ---------- Eventos generales ---------- */
document.getElementById("newCardBtn").addEventListener("click", openForm);
document.getElementById("emptyNewBtn").addEventListener("click", openCreateFromEmpty);

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value;
  render();
});

/* ---------- Arranque ---------- */
buildFilters();
buildTypeSelect();
render();
