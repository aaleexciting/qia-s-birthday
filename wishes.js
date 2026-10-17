import { createWish, watchWishes, updateWish } from "./firebase-core.js";

const form = document.getElementById("wishForm");
const nameInput = document.getElementById("wishName");
const messageInput = document.getElementById("wishMessage");
const messageCount = document.getElementById("messageCount");
const photoInput = document.getElementById("wishPhoto");
const previewPanel = document.getElementById("photoPreview");
const previewImage = document.getElementById("photoPreviewImage");
const previewName = document.getElementById("photoFileName");
const previewHint = document.getElementById("photoSizeHint");
const removePhotoButton = document.getElementById("removePhoto");
const submitButton = document.getElementById("submitWish");
const formStatus = document.getElementById("formStatus");
const guestbookWall = document.getElementById("guestbookWall");
const wishesList = document.getElementById("wishesList");
const wallCount = document.getElementById("wallCount");
const ownerToggle = document.getElementById("ownerToggle");
const ownerAccess = document.getElementById("ownerAccess");
const ownerGate = document.getElementById("ownerGate");
const ownerLoginForm = document.getElementById("ownerLoginForm");
const ownerPassword = document.getElementById("ownerPassword");
const ownerLoginStatus = document.getElementById("ownerLoginStatus");
const ownerDashboard = document.getElementById("ownerDashboard");
const ownerLockButton = document.getElementById("ownerLockButton");
const ownerWishesList = document.getElementById("ownerWishesList");
const ownerActionStatus = document.getElementById("ownerActionStatus");
const toastMessage = document.getElementById("toastMessage");
const randomWishButton = document.getElementById("randomWishButton");

const OWNER_SESSION_KEY = "qiaBirthdayGuestbookOwnerUnlocked";
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_DATA_URL_CHARS = 240000;
let selectedPhoto = null;
let previewObjectUrl = "";
let unsubscribeWishes = null;
let lightbox = null;
let allWishes = [];
let ownerUnlocked = safelyReadSession(OWNER_SESSION_KEY) === "yes";
let toastTimeout = null;

function safelyReadSession(key) {
  try { return sessionStorage.getItem(key); } catch (_) { return null; }
}

function safelyWriteSession(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch (_) { /* The owner gate still works for this page view if storage is blocked. */ }
}

function setStatus(element, message, type = "") {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-error", type === "error");
  element.classList.toggle("is-success", type === "success");
}

function showToast(message, type = "") {
  if (!toastMessage) return;
  toastMessage.textContent = message;
  toastMessage.classList.toggle("is-error", type === "error");
  toastMessage.hidden = false;
  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => { toastMessage.hidden = true; }, 5600);
}

function safePhotoData(value) {
  return typeof value === "string" && value.length <= 300000 && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : "";
}

function formatDate(timestamp) {
  if (!timestamp) return "baru saja";
  try {
    const date = timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return "baru saja";
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  } catch (_) { return "baru saja"; }
}

function makeLightbox() {
  if (lightbox) return lightbox;
  lightbox = document.createElement("div");
  lightbox.className = "photo-lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Photo preview");
  const close = document.createElement("button");
  close.className = "photo-lightbox-close";
  close.type = "button";
  close.setAttribute("aria-label", "Close photo");
  close.textContent = "×";
  const image = document.createElement("img");
  image.alt = "Photo from the birthday guestbook";
  lightbox.append(close, image);
  document.body.append(lightbox);
  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox(); });
  return lightbox;
}

function openLightbox(src, alt = "Photo from the birthday guestbook") {
  if (!src) return;
  const layer = makeLightbox();
  const image = layer.querySelector("img");
  image.src = src;
  image.alt = alt;
  layer.hidden = false;
  document.body.classList.add("lightbox-open");
  layer.querySelector("button").focus({ preventScroll: true });
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  lightbox.querySelector("img").removeAttribute("src");
  document.body.classList.remove("lightbox-open");
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderWishes(wishes) {
  const visibleWishes = wishes.filter(wish => wish.hidden !== true);
  wallCount.textContent = String(visibleWishes.length);
  wishesList.replaceChildren();

  if (!visibleWishes.length) {
    const empty = createElement("div", "wall-empty");
    empty.append(createElement("span", "", "✦"), createElement("p", "", "Belum ada pesan lain nih. Mungkin kamu yang pertama!"));
    wishesList.append(empty);
    return;
  }

  for (const wish of visibleWishes) {
    const card = createElement("article", "wish-card");
    card.dataset.wishId = wish.id;
    const header = createElement("div", "wish-card-head");
    const mark = createElement("span", "wish-card-heart", "✦");
    mark.setAttribute("aria-hidden", "true");
    const person = createElement("div", "wish-card-person");
    person.append(createElement("strong", "", String(wish.name || "Aya’s friend").slice(0, 48)));
    const time = createElement("time", "", formatDate(wish.createdAt));
    person.append(time);
    header.append(mark, person);
    card.append(header);

    const body = createElement("p", "wish-card-message", String(wish.message || "").slice(0, 900));
    card.append(body);

    const photoData = safePhotoData(wish.photoData);
    if (photoData) {
      const photoButton = createElement("button", "wish-photo-open");
      photoButton.type = "button";
      photoButton.setAttribute("aria-label", `Enlarge photo from ${String(wish.name || "Aya’s friend").slice(0, 48)}`);
      const image = createElement("img", "wish-card-photo");
      image.src = photoData;
      image.alt = `Photo shared by ${String(wish.name || "Aya’s friend").slice(0, 48)}`;
      image.loading = "lazy";
      photoButton.append(image);
      card.append(photoButton);
    }

    const reply = String(wish.reply || "").trim();
    if (reply) {
      const replyBox = createElement("div", "wish-reply");
      replyBox.append(createElement("strong", "", "A little reply from Aya ✦"));
      replyBox.append(createElement("p", "", reply.slice(0, 900)));
      card.append(replyBox);
    }

    const actions = createElement("div", "wish-card-actions");
    const saveButton = createElement("button", "wish-save-card", "Save birthday card ↗");
    saveButton.type = "button";
    saveButton.dataset.saveWish = wish.id;
    saveButton.setAttribute("aria-label", `Save a birthday card for ${String(wish.name || "this wish").slice(0, 48)}`);
    actions.append(saveButton);
    card.append(actions);
    wishesList.append(card);
  }
}

function renderOwnerWishes() {
  if (!ownerUnlocked || !ownerWishesList) return;
  ownerWishesList.replaceChildren();
  if (!allWishes.length) {
    ownerWishesList.append(createElement("p", "owner-empty", "Belum ada pesan yang masuk."));
    return;
  }

  for (const wish of allWishes) {
    const card = createElement("article", `owner-wish-card${wish.hidden === true ? " is-hidden" : ""}`);
    card.dataset.ownerWishId = wish.id;
    const head = createElement("div", "owner-wish-head");
    const identity = createElement("div", "owner-wish-identity");
    identity.append(createElement("strong", "", String(wish.name || "Aya’s friend").slice(0, 48)));
    identity.append(createElement("time", "", formatDate(wish.createdAt)));
    head.append(identity);
    if (wish.hidden === true) head.append(createElement("span", "owner-hidden-badge", "Hidden"));
    card.append(head, createElement("p", "owner-wish-message", String(wish.message || "").slice(0, 900)));
    if (safePhotoData(wish.photoData)) {
      const photo = createElement("img", "owner-wish-photo");
      photo.src = safePhotoData(wish.photoData);
      photo.alt = `Photo shared by ${String(wish.name || "Aya’s friend").slice(0, 48)}`;
      photo.loading = "lazy";
      card.append(photo);
    }

    const replyLabel = createElement("label", "owner-reply-label", "REPLY AS AYA");
    const replyInput = createElement("textarea", "owner-reply-input");
    replyInput.dataset.ownerReply = wish.id;
    replyInput.maxLength = 900;
    replyInput.rows = 3;
    replyInput.value = String(wish.reply || "").slice(0, 900);
    replyInput.placeholder = "Write a warm reply…";
    replyLabel.append(replyInput);
    card.append(replyLabel);

    const actions = createElement("div", "owner-wish-actions");
    const saveReply = createElement("button", "owner-save-reply", "Save reply");
    saveReply.type = "button";
    saveReply.dataset.ownerSaveReply = wish.id;
    const visibility = createElement("button", "owner-visibility-button", wish.hidden === true ? "Show on public page" : "Hide from public page");
    visibility.type = "button";
    visibility.dataset.ownerVisibility = wish.id;
    visibility.dataset.hidden = wish.hidden === true ? "true" : "false";
    actions.append(saveReply, visibility);
    card.append(actions);
    ownerWishesList.append(card);
  }
}

function setOwnerState(unlocked) {
  ownerUnlocked = unlocked;
  safelyWriteSession(OWNER_SESSION_KEY, unlocked ? "yes" : null);
  ownerGate.hidden = unlocked;
  ownerDashboard.hidden = !unlocked;
  ownerAccess.hidden = !unlocked && ownerAccess.hidden;
  ownerToggle.setAttribute("aria-expanded", String(!ownerAccess.hidden));
  ownerToggle.textContent = unlocked ? "Owner mode active" : "Owner access";
  if (unlocked) {
    setStatus(ownerLoginStatus, "Welcome back, Aya. Your guestbook controls are ready. ♡", "success");
    renderOwnerWishes();
  } else {
    setStatus(ownerLoginStatus, "");
    setStatus(ownerActionStatus, "");
    ownerPassword.value = "";
    ownerLoginStatus.textContent = "";
  }
}

function setOwnerPanelVisible(visible) {
  ownerAccess.hidden = !visible;
  ownerToggle.setAttribute("aria-expanded", String(visible));
  if (visible && !ownerUnlocked) window.setTimeout(() => ownerPassword.focus({ preventScroll: true }), 30);
}

function startWishesWatch() {
  if (unsubscribeWishes) return;
  wishesList.replaceChildren();
  const loader = createElement("div", "wall-empty");
  loader.append(createElement("span", "", "✦"), createElement("p", "", "Lagi ambil pesan-pesannya…"));
  wishesList.append(loader);
  unsubscribeWishes = watchWishes(wishes => {
    allWishes = Array.isArray(wishes) ? wishes : [];
    renderWishes(allWishes);
    renderOwnerWishes();
  }, error => {
    console.error("Could not load birthday wishes", error);
    wishesList.replaceChildren(createElement("p", "wall-error", "Guestbook-nya belum bisa dibuka. Coba refresh sebentar lagi, ya."));
    if (ownerUnlocked) ownerWishesList.replaceChildren(createElement("p", "owner-empty", "Pesan belum bisa dimuat. Periksa koneksi lalu refresh, ya."));
  });
}

function clearPhoto() {
  selectedPhoto = null;
  photoInput.value = "";
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = "";
  previewImage.removeAttribute("src");
  previewPanel.hidden = true;
  previewName.textContent = "Foto pilihanmu";
  previewHint.textContent = "Foto akan otomatis dikecilkan sebelum disimpan.";
}

function loadImageSource(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("This image couldn’t be opened. Please choose another photo.")); };
    image.src = objectUrl;
  });
}

async function compressImageToBase64(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Pilih file foto, ya.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Ukuran foto maksimal 12 MB. Coba pilih foto yang lebih kecil.");
  let source;
  let originalWidth;
  let originalHeight;
  if ("createImageBitmap" in window) {
    try { source = await createImageBitmap(file); originalWidth = source.width; originalHeight = source.height; }
    catch (_) { source = await loadImageSource(file); originalWidth = source.naturalWidth; originalHeight = source.naturalHeight; }
  } else {
    source = await loadImageSource(file);
    originalWidth = source.naturalWidth;
    originalHeight = source.naturalHeight;
  }
  if (!originalWidth || !originalHeight) throw new Error("Foto ini kelihatannya kosong. Coba foto lain, ya.");
  let scale = Math.min(1, 1000 / Math.max(originalWidth, originalHeight));
  let quality = 0.82;
  let dataUrl = "";
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Browser kamu belum bisa memproses foto ini.");
  for (let attempt = 0; attempt < 10; attempt++) {
    canvas.width = Math.max(1, Math.round(originalWidth * scale));
    canvas.height = Math.max(1, Math.round(originalHeight * scale));
    context.fillStyle = "#fffaf2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_DATA_URL_CHARS) break;
    if (attempt % 2 === 1) quality = Math.max(0.52, quality - 0.08);
    scale *= 0.84;
  }
  if (source && typeof source.close === "function") source.close();
  if (!dataUrl || dataUrl.length > MAX_DATA_URL_CHARS) throw new Error("Foto ini susah dikecilkan. Coba pilih foto yang lebih simpel atau kecil.");
  return dataUrl;
}

function wrapCanvasText(context, text, maxWidth) {
  const result = [];
  const paragraphs = String(text || "").split(/\r?\n/);
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      result.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width <= maxWidth || !line) {
        line = next;
      } else {
        result.push(line);
        line = word;
      }
      if (context.measureText(line).width > maxWidth) {
        let chunk = "";
        for (const character of line) {
          if (context.measureText(chunk + character).width > maxWidth && chunk) {
            result.push(chunk);
            chunk = character;
          } else chunk += character;
        }
        line = chunk;
      }
    }
    if (line) result.push(line);
  }
  return result.length ? result : [""];
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function loadCanvasImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Foto yang dilampirkan tidak bisa dimasukkan ke kartu."));
    image.src = source;
  });
}

async function createBirthdayCardBlob(wish) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) { /* Fall back to system fonts. */ }
  }
  const width = 1080;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot create the birthday card image.");

  const message = String(wish.message || "").trim().slice(0, 900);
  context.font = '400 36px "DM Sans", Arial, sans-serif';
  const lines = wrapCanvasText(context, message, 790);
  const lineHeight = 55;
  const bodyTop = 405;
  const bodyBottom = bodyTop + lines.length * lineHeight;
  let photo = null;
  let photoBoxHeight = 0;
  const photoData = safePhotoData(wish.photoData);
  if (photoData) {
    try { photo = await loadCanvasImage(photoData); photoBoxHeight = 360; } catch (_) { photo = null; }
  }
  const photoTop = bodyBottom + (photo ? 44 : 0);
  const footerSpace = 265;
  const height = Math.max(1320, photoTop + photoBoxHeight + footerSpace);
  canvas.width = width;
  canvas.height = height;

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#fff9ef");
  background.addColorStop(0.55, "#f8eddf");
  background.addColorStop(1, "#f5e4d4");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.save();
  context.globalAlpha = 0.2;
  context.strokeStyle = "#c9a782";
  context.lineWidth = 1;
  for (let y = 70; y < height; y += 22) {
    context.beginPath(); context.moveTo(76, y); context.lineTo(width - 76, y); context.stroke();
  }
  context.restore();

  drawRoundedRect(context, 34, 34, width - 68, height - 68, 26);
  context.fillStyle = "rgba(255,250,241,.72)";
  context.fill();
  context.lineWidth = 4;
  context.strokeStyle = "#87343c";
  context.stroke();
  drawRoundedRect(context, 53, 53, width - 106, height - 106, 18);
  context.lineWidth = 2;
  context.strokeStyle = "#c29b65";
  context.stroke();

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#a36a44";
  context.font = '700 21px "DM Sans", Arial, sans-serif';
  context.fillText("A LITTLE KEEPSAKE FOR", width / 2, 128);
  context.fillStyle = "#531920";
  context.font = '600 62px "Playfair Display", Georgia, serif';
  context.fillText("Aya’s Birthday", width / 2, 207);
  context.fillStyle = "#b45159";
  context.font = '400 49px "Great Vibes", cursive';
  context.fillText("a note from the heart", width / 2, 273);

  const dividerY = 331;
  context.strokeStyle = "#c5a178";
  context.lineWidth = 2;
  context.beginPath(); context.moveTo(220, dividerY); context.lineTo(438, dividerY); context.moveTo(642, dividerY); context.lineTo(860, dividerY); context.stroke();
  context.fillStyle = "#b45159";
  context.font = '400 34px Georgia, serif';
  context.fillText("✦", width / 2, dividerY);

  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillStyle = "#4b2425";
  context.font = '400 36px "DM Sans", Arial, sans-serif';
  let y = bodyTop;
  for (const line of lines) {
    if (!line) { y += Math.round(lineHeight * 0.65); continue; }
    context.fillText(line, 145, y, 790);
    y += lineHeight;
  }

  if (photo) {
    const boxX = 225;
    const boxY = photoTop;
    const boxW = 630;
    const boxH = photoBoxHeight;
    drawRoundedRect(context, boxX - 12, boxY - 12, boxW + 24, boxH + 24, 15);
    context.fillStyle = "#fffaf3";
    context.fill();
    context.strokeStyle = "#d8bea1";
    context.lineWidth = 2;
    context.stroke();
    const scale = Math.min(boxW / photo.width, boxH / photo.height);
    const imageW = photo.width * scale;
    const imageH = photo.height * scale;
    context.drawImage(photo, boxX + (boxW - imageW) / 2, boxY + (boxH - imageH) / 2, imageW, imageH);
  }

  const footerY = height - 210;
  context.strokeStyle = "#d0b28e";
  context.lineWidth = 1.5;
  context.beginPath(); context.moveTo(170, footerY); context.lineTo(width - 170, footerY); context.stroke();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#a34b51";
  context.font = '400 34px Georgia, serif';
  context.fillText("♡   ✦   ♡", width / 2, footerY + 42);
  context.fillStyle = "#6e3938";
  context.font = '600 24px "DM Sans", Arial, sans-serif';
  context.fillText(`A NOTE FROM ${String(wish.name || "A FRIEND").trim().slice(0, 48).toLocaleUpperCase()}`, width / 2, footerY + 91);
  context.fillStyle = "#9a7666";
  context.font = '500 19px "DM Sans", Arial, sans-serif';
  context.fillText("AYA’S BIRTHDAY GUESTBOOK  ·  OCTOBER 17", width / 2, footerY + 133);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not prepare the birthday card image.")), "image/png");
  });
}

function safeFilePart(value) {
  return String(value || "friend").normalize("NFKD").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "friend";
}

async function saveOrShareBirthdayCard(wish, button) {
  if (button) { button.disabled = true; button.textContent = "Preparing card…"; }
  try {
    const blob = await createBirthdayCardBlob(wish);
    const file = new File([blob], `aya-birthday-wish-${safeFilePart(wish.name)}.png`, { type: "image/png" });
    let canShareFiles = false;
    try { canShareFiles = Boolean(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (_) { canShareFiles = false; }
    if (canShareFiles) {
      await navigator.share({ files: [file], title: "A birthday note for Aya", text: "A little birthday keepsake for Aya ✦" });
      showToast("Card ready to share. Choose “Save Image” in the share sheet to keep it in your camera roll.");
    } else {
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.name;
      anchor.rel = "noopener";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      showToast("Birthday card downloaded. On iPhone, open the image and choose “Save Image” to add it to Photos.");
    }
  } catch (error) {
    if (error && error.name === "AbortError") return;
    console.error("Could not create/share birthday card", error);
    showToast("Could not prepare the card this time. Please try again.", "error");
  } finally {
    if (button) { button.disabled = false; button.textContent = "Save birthday card ↗"; }
  }
}

function celebrateWish() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const panel = form.closest(".write-panel");
  if (!panel) return;
  const decorations = ["💗", "♡", "💕", "✦", "✨", "💖"];
  for (let i = 0; i < 13; i += 1) {
    const heart = createElement("span", "celebration-heart", decorations[i % decorations.length]);
    heart.setAttribute("aria-hidden", "true");
    heart.style.setProperty("--heart-x", `${8 + Math.random() * 84}%`);
    heart.style.setProperty("--heart-y", `${42 + Math.random() * 40}%`);
    heart.style.setProperty("--heart-size", `${0.8 + Math.random() * 0.9}rem`);
    heart.style.setProperty("--heart-dx", `${-55 + Math.random() * 110}px`);
    heart.style.setProperty("--heart-rotate", `${-45 + Math.random() * 90}deg`);
    heart.style.animationDelay = `${Math.random() * 180}ms`;
    panel.append(heart);
    window.setTimeout(() => heart.remove(), 1550);
  }
}

if (randomWishButton) {
  randomWishButton.addEventListener("click", () => {
    const visible = allWishes.filter(wish => wish.hidden !== true);
    if (!visible.length) {
      showToast("The wish wall is waiting for its first little note. ♡");
      return;
    }
    const wish = visible[Math.floor(Math.random() * visible.length)];
    const card = Array.from(wishesList.querySelectorAll(".wish-card")).find(item => item.dataset.wishId === wish.id);
    if (!card) return;
    wishesList.querySelectorAll(".wish-card.is-surprise").forEach(item => item.classList.remove("is-surprise"));
    card.classList.remove("is-surprise");
    void card.offsetWidth;
    card.classList.add("is-surprise");
    card.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    randomWishButton.textContent = "✨ Your pick!";
    window.setTimeout(() => {
      card.classList.remove("is-surprise");
      randomWishButton.textContent = "🎲 Surprise me";
    }, 1650);
  });
}

messageInput.addEventListener("input", () => { messageCount.textContent = `${messageInput.value.length} / 900`; });
photoInput.addEventListener("change", () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { clearPhoto(); setStatus(formStatus, "Please choose an image file. Videos can’t be added to the guestbook yet.", "error"); return; }
  if (file.size > MAX_FILE_BYTES) { clearPhoto(); setStatus(formStatus, "Photos must be 12 MB or smaller. Please choose a smaller image.", "error"); return; }
  selectedPhoto = file;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  previewImage.src = previewObjectUrl;
  previewName.textContent = file.name;
  previewHint.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · otomatis dikompres`;
  previewPanel.hidden = false;
  setStatus(formStatus, "");
});
removePhotoButton.addEventListener("click", clearPhoto);

wishesList.addEventListener("click", event => {
  const photoButton = event.target.closest(".wish-photo-open");
  if (photoButton) {
    const image = photoButton.querySelector("img");
    if (image) openLightbox(image.src, image.alt);
    return;
  }
  const saveButton = event.target.closest("[data-save-wish]");
  if (saveButton) {
    const wish = allWishes.find(entry => entry.id === saveButton.dataset.saveWish);
    if (wish) void saveOrShareBirthdayCard(wish, saveButton);
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = selectedPhoto ? "Lagi kompres foto…" : "Lagi kirim pesan…";
  setStatus(formStatus, "Sebentar ya, pesanmu lagi disiapkan.");
  try {
    let photoData = "";
    if (selectedPhoto) {
      photoData = await compressImageToBase64(selectedPhoto);
      previewHint.textContent = `Ready to save · ${(photoData.length / 1024).toFixed(0)} KB`;
    }
    submitButton.querySelector("span").textContent = "Mengirim…";
    await createWish({ name: nameInput.value, message: messageInput.value, photoData, photoType: photoData ? "image/jpeg" : "" });
    celebrateWish();
    form.reset();
    messageCount.textContent = "0 / 900";
    clearPhoto();
    setStatus(formStatus, "Makasih udah mampir! Pesanmu masuk. Sekarang boleh intip pesan yang lain juga ✦", "success");
    showToast("Makasih udah ikut ngeramein birthday guestbook ini ✦");
    guestbookWall.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  } catch (error) {
    console.error("Could not save the birthday wish", error);
    setStatus(formStatus, error && error.message && !/permission|Missing or insufficient permissions/i.test(error.message)
      ? error.message
      : "Pesanmu belum berhasil dikirim. Coba lagi sebentar, ya. Kalau tetap gagal, Firestore rules mungkin belum dipublish.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Kirim Pesan";
  }
});

ownerToggle.addEventListener("click", () => setOwnerPanelVisible(ownerAccess.hidden));
ownerLoginForm.addEventListener("submit", event => {
  event.preventDefault();
  if (ownerPassword.value.trim().toLocaleLowerCase() === "dishwasher") {
    setOwnerState(true);
    setStatus(ownerLoginStatus, "Welcome back, Aya. Your guestbook controls are ready. ♡", "success");
    renderOwnerWishes();
  } else {
    setStatus(ownerLoginStatus, "That is not the right cat name. Try again. ♡", "error");
    ownerPassword.value = "";
    ownerPassword.focus();
  }
});

ownerLockButton.addEventListener("click", () => {
  setOwnerState(false);
  setOwnerPanelVisible(true);
  ownerToggle.textContent = "Owner access";
  ownerPassword.focus({ preventScroll: true });
});

ownerWishesList.addEventListener("click", async event => {
  const saveButton = event.target.closest("[data-owner-save-reply]");
  const visibilityButton = event.target.closest("[data-owner-visibility]");
  if (!saveButton && !visibilityButton) return;
  if (!ownerUnlocked) {
    setStatus(ownerActionStatus, "Please unlock owner access first.", "error");
    return;
  }
  const button = saveButton || visibilityButton;
  const wishId = button.dataset.ownerSaveReply || button.dataset.ownerVisibility;
  const wish = allWishes.find(entry => entry.id === wishId);
  if (!wish) {
    setStatus(ownerActionStatus, "This message could not be found. Refresh and try again.", "error");
    return;
  }

  button.disabled = true;
  try {
    if (saveButton) {
      const card = saveButton.closest("[data-owner-wish-id]");
      const replyInput = card && card.querySelector("[data-owner-reply]");
      await updateWish(wishId, { reply: replyInput ? replyInput.value : "" });
      setStatus(ownerActionStatus, `Reply saved for ${String(wish.name || "this wish").slice(0, 48)}.`, "success");
    } else {
      const willHide = visibilityButton.dataset.hidden !== "true";
      await updateWish(wishId, { hidden: willHide });
      setStatus(ownerActionStatus, willHide ? "Message hidden from the public page. You can restore it here." : "Message is visible on the public page again.", "success");
    }
  } catch (error) {
    console.error("Could not moderate birthday wish", error);
    setStatus(ownerActionStatus, "That change could not be saved. Check Firestore rules and try again.", "error");
  } finally {
    button.disabled = false;
  }
});

if (ownerUnlocked) {
  ownerAccess.hidden = false;
  ownerToggle.setAttribute("aria-expanded", "true");
  ownerToggle.textContent = "Owner mode active";
  ownerGate.hidden = true;
  ownerDashboard.hidden = false;
}

startWishesWatch();
