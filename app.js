/* ============================================================
   PokéCards · mini colección de cartas
   Datos base: data/cartas.json + data/configuracion.json.
   Lo que creas o eliminas se guarda en localStorage.
   ============================================================ */

const DATA_URLS = {
  cards: "data/cartas.json",
  config: "data/configuracion.json",
};

const FALLBACK_URLS = {
  cards: "data/cartas.js",
  config: "data/configuracion.js",
};

const DEFAULT_STORAGE_KEYS = {
  userCards: "pokecards.user.v1",
  removedCards: "pokecards.removed.v1",
  editedCards: "pokecards.edited.v1",
  legacy: "pokecards.v1",
};

let TYPES = {};
let WEAKNESS = {};
let RARITY_HOLO = new Set();
let RARITY_CLASS = {};
let MAX_IMAGE_SIZE = 640;
let STORAGE_KEYS = { ...DEFAULT_STORAGE_KEYS };

/* ---------- Estado ---------- */
let baseCards = [];   // cartas de data/cartas.json
let userCards = [];   // cartas creadas en este navegador
let editedBase = {};  // cambios sobre cartas base, guardados en localStorage
let removedIds = new Set();
let cards = [];
let activeType = "todos";
let searchTerm = "";
let detailId = null;
let pendingImage = null; // dataURL de la imagen seleccionada en el formulario
let editingId = null;    // id de la carta que se está editando
let editImage = "";      // imagen actual de la carta en edición
let editImageUrl = "";   // URL actual de la carta en edición (si aplica)
let dataReady = false;

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

/* ---------- Carga de datos ---------- */
async function loadJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.append(script);
  });
}

async function loadData() {
  try {
    const [config, base] = await Promise.all([
      loadJson(DATA_URLS.config),
      loadJson(DATA_URLS.cards),
    ]);
    return { config, base };
  } catch (error) {
    // Con file:// el navegador bloquea fetch de JSON: usamos los respaldos .js.
    if (location.protocol !== "file:") throw error;

    await Promise.all([
      loadScript(FALLBACK_URLS.config),
      loadScript(FALLBACK_URLS.cards),
    ]);

    const fallback = window.POKECARDS_FALLBACK;
    if (!fallback || !fallback.config || !fallback.cards) {
      throw new Error("No se encontraron los respaldos data/*.js");
    }
    return { config: fallback.config, base: fallback.cards };
  }
}

function applyConfig(config) {
  TYPES = config.types || {};
  WEAKNESS = config.weakness || {};
  RARITY_HOLO = new Set(config.rarityHolo || []);
  RARITY_CLASS = config.rarityClass || {};
  MAX_IMAGE_SIZE = Number(config.maxImageSize) || 640;
  STORAGE_KEYS = { ...DEFAULT_STORAGE_KEYS, ...(config.storage || {}) };
}

function loadLocalState() {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEYS.userCards);
    const rawRemoved = localStorage.getItem(STORAGE_KEYS.removedCards);
    const rawEdited = localStorage.getItem(STORAGE_KEYS.editedCards);

    const parsedEdited = JSON.parse(rawEdited || "{}");
    editedBase =
      parsedEdited && typeof parsedEdited === "object" && !Array.isArray(parsedEdited)
        ? parsedEdited
        : {};

    if (rawUser !== null || rawRemoved !== null) {
      const parsedUser = JSON.parse(rawUser || "[]");
      const parsedRemoved = JSON.parse(rawRemoved || "[]");
      userCards = Array.isArray(parsedUser) ? parsedUser : [];
      removedIds = new Set(Array.isArray(parsedRemoved) ? parsedRemoved : []);
      return;
    }

    // Migración: la versión anterior guardaba todas las cartas en una sola clave.
    const legacy = localStorage.getItem(STORAGE_KEYS.legacy);
    if (!legacy) return;
    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed)) return;

    const baseIds = new Set(baseCards.map((card) => card.id));
    userCards = parsed.filter((card) => card && !baseIds.has(card.id));
    saveCards();
  } catch {
    userCards = [];
    editedBase = {};
    removedIds = new Set();
  }
}

function rebuildCards() {
  const visibleBase = baseCards
    .filter((card) => !removedIds.has(card.id))
    .map((card) => {
      const override = editedBase[card.id];
      return override ? { ...card, ...override, id: card.id } : card;
    });
  cards = [...userCards, ...visibleBase];
}

function saveCards() {
  try {
    localStorage.setItem(STORAGE_KEYS.userCards, JSON.stringify(userCards));
    localStorage.setItem(STORAGE_KEYS.removedCards, JSON.stringify([...removedIds]));
    localStorage.setItem(STORAGE_KEYS.editedCards, JSON.stringify(editedBase));
    return true;
  } catch {
    showToast("No hay espacio para guardar esa imagen 😢");
    return false;
  }
}

function loadError(message) {
  grid.innerHTML = "";
  counter.textContent = "";
  emptyState.hidden = false;
  emptyState.querySelector("h2").textContent = "No se pudieron cargar los datos";
  emptyState.querySelector("p").textContent = message;
  document.getElementById("emptyNewBtn").textContent = "Reintentar";
  document.getElementById("newCardBtn").disabled = true;
  console.error(message);
}

async function init() {
  try {
    const data = await loadData();

    applyConfig(data.config);
    baseCards = Array.isArray(data.base) ? data.base : [];
    loadLocalState();
    rebuildCards();
    dataReady = true;
  } catch {
    loadError(
      "No se encontraron los datos. Revisa que existan data/cartas.json, " +
      "data/configuracion.json y sus respaldos data/cartas.js y data/configuracion.js."
    );
    return;
  }

  buildFilters();
  buildTypeSelect();
  render();
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
function buildCard(card, { detail = false } = {}) {
  const type = typeInfo(card.type);
  const article = el("article", "card");
  if (RARITY_HOLO.has(card.rarity)) article.classList.add("card--holo");
  article.style.setProperty("--type", type.color);
  article.style.setProperty("--type-soft", type.soft);
  article.dataset.id = card.id;

  if (!detail) {
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `${card.name}, carta de tipo ${type.label}. Ver detalle`);
    article.addEventListener("click", () => openDetail(card.id));
    article.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetail(card.id);
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

  article.append(top, art, desc, attacks, footer);
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
  if (!dataReady) return;
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
  detailContent.append(buildCard(card, { detail: true }));
  openModal(detailModal);
}

function openForm(card = null) {
  if (!dataReady) return;

  cardForm.reset();
  pendingImage = null;
  editingId = card ? card.id : null;
  editImage = card ? card.image || "" : "";
  editImageUrl = card && /^https?:\/\//i.test(editImage) ? editImage : "";

  const upload = cardForm.querySelector(".upload");
  const uploadLabel = upload.querySelector(".upload__label");
  upload.classList.remove("is-filled");
  uploadLabel.textContent = "📁 Subir imagen desde tu equipo";
  if (editImage && !editImageUrl) {
    upload.classList.add("is-filled");
    uploadLabel.textContent = "✅ Imagen actual (sube otra para cambiarla)";
  }

  document.getElementById("formTitle").textContent = card ? "Editar carta" : "Nueva carta";
  document.querySelector("#formModal .modal__subtitle").textContent = card
    ? `Ajusta los datos de ${card.name}.`
    : "Dale vida a tu criatura. Solo necesitas un nombre.";
  cardForm.querySelector('button[type="submit"]').textContent = card
    ? "Guardar cambios"
    : "Guardar carta";

  cardForm.querySelector('[name="name"]').value = card ? card.name : "";
  typeSelect.value = card ? card.type : "fuego";
  cardForm.querySelector('[name="hp"]').value = card ? card.hp : 60;
  cardForm.querySelector('[name="rarity"]').value = card ? card.rarity : "Rara";
  cardForm.querySelector('[name="emoji"]').value = card ? card.emoji || "" : "";
  cardForm.querySelector('[name="emoji"]').placeholder = typeInfo(typeSelect.value).emoji;
  cardForm.querySelector('[name="imageUrl"]').value = editImageUrl;
  cardForm.querySelector('[name="desc"]').value = card ? card.desc || "" : "";

  [1, 2].forEach((index) => {
    const attack = card && card.attacks ? card.attacks[index - 1] : null;
    cardForm.querySelector(`[name="atk${index}Name"]`).value = attack ? attack.name : "";
    cardForm.querySelector(`[name="atk${index}Damage"]`).value =
      attack && attack.damage ? attack.damage : "";
    cardForm.querySelector(`[name="atk${index}Cost"]`).value = attack
      ? String(Math.min(3, Math.max(1, Number(attack.cost) || 1)))
      : index === 1 ? "2" : "3";
  });

  openModal(formModal);
  setTimeout(() => cardForm.querySelector('[name="name"]').focus(), 60);
}

function openEdit() {
  const card = cards.find((item) => item.id === detailId);
  if (!card) return;
  closeModal(detailModal);
  openForm(card);
}

function openCreateFromEmpty() {
  if (!dataReady) {
    window.location.reload();
    return;
  }
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
  const image = pendingImage || imageUrl || (editingId && !editImageUrl ? editImage : "");

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

  const cardData = {
    name,
    type,
    hp,
    rarity: String(data.get("rarity") || "Rara"),
    emoji: String(data.get("emoji") || "").trim() || typeInfo(type).emoji,
    image,
    desc: String(data.get("desc") || "").trim(),
    attacks,
  };

  const previousUserCards = userCards;
  const previousEditedBase = editedBase;
  let wasEditing = false;

  if (editingId) {
    wasEditing = true;
    const baseCard = baseCards.find((item) => item.id === editingId);

    if (baseCard) {
      editedBase = {
        ...editedBase,
        [editingId]: {
          ...cardData,
          id: editingId,
          createdAt: baseCard.createdAt || null,
          updatedAt: new Date().toISOString(),
        },
      };
    } else {
      userCards = userCards.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...cardData,
              id: editingId,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
    }
  } else {
    userCards = [
      {
        ...cardData,
        id: uid(),
        createdAt: new Date().toISOString(),
      },
      ...userCards,
    ];
  }

  rebuildCards();
  if (!saveCards()) {
    userCards = previousUserCards;
    editedBase = previousEditedBase;
    rebuildCards();
    return;
  }

  closeModal(formModal);
  editingId = null;
  editImage = "";
  editImageUrl = "";
  activeType = "todos";
  searchTerm = "";
  searchInput.value = "";
  typeFilters.querySelectorAll(".chip").forEach((c) => {
    const active = c.dataset.type === "todos";
    c.classList.toggle("is-active", active);
    c.setAttribute("aria-pressed", String(active));
  });
  render();
  showToast(
    wasEditing ? `¡${name} se actualizó! ✨` : `¡${name} se unió a tu colección! 🎉`
  );
});

/* ---------- Eliminar ---------- */
deleteCardBtn.addEventListener("click", () => {
  const card = cards.find((item) => item.id === detailId);
  if (!card) return;
  if (!window.confirm(`¿Eliminar la carta "${card.name}"?`)) return;

  if (baseCards.some((item) => item.id === detailId)) {
    removedIds.add(detailId);
    delete editedBase[detailId];
  }
  userCards = userCards.filter((item) => item.id !== detailId);
  rebuildCards();
  saveCards();
  closeModal(detailModal);
  render();
  showToast("Carta eliminada");
});

/* ---------- Eventos generales ---------- */
document.getElementById("newCardBtn").addEventListener("click", () => openForm());
document.getElementById("editCardBtn").addEventListener("click", openEdit);
document.getElementById("emptyNewBtn").addEventListener("click", openCreateFromEmpty);

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value;
  render();
});

/* ---------- Arranque ---------- */
init();
